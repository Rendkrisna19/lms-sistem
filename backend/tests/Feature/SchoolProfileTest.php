<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\LmsFixtures;
use Tests\TestCase;

/**
 * Profil sekolah (logo, akreditasi, identitas), manajemen admin sekolah, dan daftar akun.
 */
class SchoolProfileTest extends TestCase
{
    use LmsFixtures, RefreshDatabase;

    public function test_school_admin_uploads_logo_and_updates_profile(): void
    {
        Storage::fake('public');
        $world = $this->createSchoolWorld();
        Sanctum::actingAs($world['admin']);

        $this->post('/api/admin/school', [
            'name' => 'SMA Mitra Inalum Baru',
            'npsn' => '10203099',
            'jenjang' => 'SMA',
            'accreditation' => 'A',
            'address' => 'Jl. Pendidikan No. 1',
            'phone' => '0622-000111',
            'email' => 'humas@sekolah.sch.id',
            'logo' => UploadedFile::fake()->image('logo.png', 400, 400),
        ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.name', 'SMA Mitra Inalum Baru')
            ->assertJsonPath('data.accreditation', 'A');

        $school = School::findOrFail($world['school']->id);
        $this->assertNotNull($school->logo);
        Storage::disk('public')->assertExists($school->logo);

        // Ganti logo: logo lama harus dihapus
        $old = $school->logo;
        $this->post('/api/admin/school', [
            'name' => 'SMA Mitra Inalum Baru',
            'logo' => UploadedFile::fake()->image('logo2.jpg', 300, 300),
        ], ['Accept' => 'application/json'])->assertOk();
        Storage::disk('public')->assertMissing($old);
        $this->assertNotSame($old, $school->refresh()->logo);
    }

    public function test_profile_rejects_invalid_accreditation_and_duplicate_npsn(): void
    {
        $world = $this->createSchoolWorld();
        $other = School::factory()->create(['npsn' => '99887766']);
        Sanctum::actingAs($world['admin']);

        $this->post('/api/admin/school', [
            'name' => 'X',
            'accreditation' => 'Z',
            'npsn' => '99887766',
        ], ['Accept' => 'application/json'])->assertStatus(422)
            ->assertJsonValidationErrors(['accreditation', 'npsn']);

        $this->assertNotNull($other->id);
    }

    public function test_school_admin_creates_and_removes_other_admins_of_own_school_only(): void
    {
        $world = $this->createSchoolWorld();
        $foreign = $this->createSchoolWorld()['admin'];
        Sanctum::actingAs($world['admin']);

        $created = $this->postJson('/api/admin/admins', [
            'name' => 'Admin Kedua',
            'nomor_induk' => 'ADM-SEKOLAH-2',
            'email' => 'admin2@sekolah.sch.id',
            'password' => 'rahasia123',
        ])->assertCreated();

        $newId = $created->json('data.id');
        $this->assertSame($world['school']->id, User::find($newId)->school_id);
        $this->assertSame('admin', User::find($newId)->role);

        $this->deleteJson("/api/admin/admins/{$newId}")->assertOk();
        $this->assertNull(User::find($newId));

        // Tidak bisa menghapus akun sendiri, dan tidak bisa menyentuh admin sekolah lain
        $this->deleteJson("/api/admin/admins/{$world['admin']->id}")->assertStatus(422);
        $this->deleteJson("/api/admin/admins/{$foreign->id}")->assertNotFound();
    }

    public function test_accounts_list_is_scoped_and_filterable_by_role(): void
    {
        $world = $this->createSchoolWorld();
        $this->createSchoolWorld(); // sekolah lain, tidak boleh muncul
        Sanctum::actingAs($world['admin']);

        $all = $this->getJson('/api/admin/accounts')->assertOk();
        $roles = collect($all->json('data.accounts'))->pluck('role')->unique()->sort()->values()->all();
        $this->assertSame(['admin', 'guru', 'murid'], $roles);

        $students = $this->getJson('/api/admin/accounts?role=murid')->assertOk();
        $this->assertSame(['murid'], collect($students->json('data.accounts'))->pluck('role')->unique()->values()->all());
        $this->assertSame(1, $students->json('data.summary.murid'));
    }

    public function test_master_sees_accounts_across_schools_and_can_filter_one_school(): void
    {
        $this->createSchoolWorld();
        $other = $this->createSchoolWorld();
        Sanctum::actingAs(User::factory()->masterAdmin()->create());

        $everything = $this->getJson('/api/admin/accounts')->assertOk();
        $this->assertGreaterThan(3, $everything->json('data.summary.total'));

        $one = $this->getJson('/api/admin/accounts?school_id=' . $other['school']->id)->assertOk();
        $this->assertSame(3, $one->json('data.summary.total'));
    }
}
