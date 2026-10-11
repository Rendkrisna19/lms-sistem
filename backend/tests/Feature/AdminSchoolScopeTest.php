<?php

namespace Tests\Feature;

use App\Models\Classroom;
use App\Models\MaterialAccess;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\LmsFixtures;
use Tests\TestCase;

class AdminSchoolScopeTest extends TestCase
{
    use LmsFixtures, RefreshDatabase;

    private array $mine;

    private array $other;

    protected function setUp(): void
    {
        parent::setUp();

        $this->mine = $this->createSchoolWorld();
        $this->other = $this->createSchoolWorld();
        Sanctum::actingAs($this->mine['admin']);
    }

    public function test_lists_only_contain_own_school_records(): void
    {
        $teacherIds = collect($this->getJson('/api/admin/teachers')->assertOk()->json('data'))->pluck('id');
        $studentIds = collect($this->getJson('/api/school-admin/students')->assertOk()->json('data'))->pluck('id');

        $this->assertTrue($teacherIds->contains($this->mine['teacher']->id));
        $this->assertFalse($teacherIds->contains($this->other['teacher']->id));
        $this->assertTrue($studentIds->contains($this->mine['student']->id));
        $this->assertFalse($studentIds->contains($this->other['student']->id));
    }

    public function test_cannot_update_or_delete_teacher_or_student_of_another_school(): void
    {
        $payload = ['name' => 'Diretas', 'nomor_induk' => 'HACK01', 'email' => 'hack@example.com'];

        $this->putJson("/api/admin/teachers/{$this->other['teacher']->id}", $payload)->assertNotFound();
        $this->putJson("/api/admin/students/{$this->other['student']->id}", $payload)->assertNotFound();
        $this->deleteJson("/api/admin/students/{$this->other['student']->id}")->assertNotFound();
        $this->getJson("/api/admin/classrooms/{$this->other['classroom']->id}")->assertNotFound();

        $this->assertDatabaseMissing('users', ['name' => 'Diretas']);
    }

    public function test_cannot_assign_student_to_another_schools_classroom(): void
    {
        // via classroom_id pada data siswa
        $this->putJson("/api/admin/students/{$this->mine['student']->id}", [
            'name' => $this->mine['student']->name,
            'nomor_induk' => $this->mine['student']->nomor_induk,
            'email' => $this->mine['student']->email,
            'classroom_id' => $this->other['classroom']->id,
        ])->assertStatus(422)->assertJsonValidationErrors('classroom_id');

        $this->postJson('/api/admin/students', [
            'name' => 'Siswa Baru',
            'nomor_induk' => 'S-NEW-1',
            'email' => 'snew@example.com',
            'password' => 'rahasia-123',
            'classroom_id' => $this->other['classroom']->id,
        ])->assertStatus(422)->assertJsonValidationErrors('classroom_id');

        // via endpoint assign-student: siswa sekolah lain ditolak (422), kelas sekolah lain tidak ditemukan (404)
        $this->postJson("/api/admin/classrooms/{$this->mine['classroom']->id}/assign-student", [
            'student_id' => $this->other['student']->id,
        ])->assertStatus(422)->assertJsonValidationErrors('student_id');

        $this->postJson("/api/admin/classrooms/{$this->other['classroom']->id}/assign-student", [
            'student_id' => $this->mine['student']->id,
        ])->assertNotFound();

        $this->assertSame($this->mine['classroom']->id, $this->mine['student']->fresh()->classroom_id);
    }

    public function test_create_teacher_requires_password(): void
    {
        $this->postJson('/api/admin/teachers', [
            'name' => 'Guru Baru',
            'nomor_induk' => 'G-NEW-1',
            'email' => 'gnew@example.com',
        ])->assertStatus(422)->assertJsonValidationErrors('password');

        $this->postJson('/api/admin/teachers', [
            'name' => 'Guru Baru',
            'nomor_induk' => 'G-NEW-1',
            'email' => 'gnew@example.com',
            'password' => 'pendek',
        ])->assertStatus(422)->assertJsonValidationErrors('password');

        $this->postJson('/api/admin/teachers', [
            'name' => 'Guru Baru',
            'nomor_induk' => 'G-NEW-1',
            'email' => 'gnew@example.com',
            'password' => 'rahasia-123',
        ])->assertCreated()->assertJsonPath('data.school_id', $this->mine['school']->id);
    }

    public function test_create_student_requires_password(): void
    {
        $this->postJson('/api/admin/students', [
            'name' => 'Siswa Baru',
            'nomor_induk' => 'S-NEW-2',
            'email' => 'snew2@example.com',
        ])->assertStatus(422)->assertJsonValidationErrors('password');
    }

    public function test_updating_password_revokes_user_tokens(): void
    {
        $teacher = $this->mine['teacher'];
        $teacher->createToken('lama');

        $this->putJson("/api/admin/teachers/{$teacher->id}", [
            'name' => $teacher->name,
            'nomor_induk' => $teacher->nomor_induk,
            'email' => $teacher->email,
            'password' => 'kata-sandi-baru',
        ])->assertOk();

        $this->assertSame(0, $teacher->tokens()->count());
    }

    public function test_delete_teacher_with_quizzes_or_materials_is_refused(): void
    {
        $this->createQuiz($this->mine);

        $response = $this->deleteJson("/api/admin/teachers/{$this->mine['teacher']->id}")
            ->assertStatus(422);

        $this->assertStringContainsString('kuis', $response->json('message'));
        $this->assertDatabaseHas('users', ['id' => $this->mine['teacher']->id]);
    }

    public function test_delete_teacher_without_dependencies_succeeds(): void
    {
        $free = User::factory()->guru()->create(['school_id' => $this->mine['school']->id]);

        $this->deleteJson("/api/admin/teachers/{$free->id}")->assertOk();
        $this->assertDatabaseMissing('users', ['id' => $free->id]);
    }

    public function test_classroom_code_is_unique_per_school(): void
    {
        $this->postJson('/api/admin/classrooms', [
            'name' => 'Duplikat',
            'code' => $this->mine['classroom']->code,
        ])->assertStatus(422)->assertJsonValidationErrors('code');

        // kode yang sama dengan kelas sekolah lain tetap boleh
        $this->postJson('/api/admin/classrooms', [
            'name' => 'Kelas Kembar',
            'code' => $this->other['classroom']->code,
        ])->assertCreated();
    }

    public function test_classroom_homeroom_teacher_must_belong_to_school(): void
    {
        $this->postJson('/api/admin/classrooms', [
            'name' => 'Kelas X',
            'code' => 'X-1',
            'homeroom_teacher_id' => $this->other['teacher']->id,
        ])->assertStatus(422)->assertJsonValidationErrors('homeroom_teacher_id');
    }

    public function test_course_code_is_optional_and_instructor_must_belong_to_school(): void
    {
        $this->postJson('/api/admin/courses', [
            'title' => 'Fisika',
            'instructor_id' => $this->mine['teacher']->id,
        ])->assertCreated();

        $this->postJson('/api/admin/courses', [
            'title' => 'Kimia',
            'code' => 'KIM',
            'instructor_id' => $this->other['teacher']->id,
        ])->assertStatus(422)->assertJsonValidationErrors('instructor_id');
    }

    public function test_assignment_validates_school_and_duplicates(): void
    {
        $url = "/api/admin/classrooms/{$this->mine['classroom']->id}/assignments";

        // sudah ada plotting untuk mapel ini di kelas ini
        $this->postJson($url, [
            'course_id' => $this->mine['course']->id,
            'teacher_id' => $this->mine['teacher']->id,
        ])->assertStatus(422)->assertJsonValidationErrors('course_id');

        $this->postJson($url, [
            'course_id' => $this->other['course']->id,
            'teacher_id' => $this->mine['teacher']->id,
        ])->assertStatus(422)->assertJsonValidationErrors('course_id');

        $newClass = Classroom::factory()->create(['school_id' => $this->mine['school']->id]);
        $this->postJson("/api/admin/classrooms/{$newClass->id}/assignments", [
            'course_id' => $this->mine['course']->id,
            'teacher_id' => $this->other['teacher']->id,
        ])->assertStatus(422)->assertJsonValidationErrors('teacher_id');

        $this->postJson("/api/admin/classrooms/{$newClass->id}/assignments", [
            'course_id' => $this->mine['course']->id,
            'teacher_id' => $this->mine['teacher']->id,
        ])->assertCreated()->assertJsonPath('data.schedule_day', null);
    }

    public function test_overview_has_no_fake_health_strings(): void
    {
        $this->getJson('/api/admin/overview')
            ->assertOk()
            ->assertJsonPath('data.total_teachers', 1)
            ->assertJsonPath('data.total_students', 1)
            ->assertJsonMissingPath('data.server_status')
            ->assertJsonMissingPath('data.database_status');
    }

    public function test_school_learning_analytics_uses_material_accesses(): void
    {
        $material = $this->createMaterial($this->mine, ['content_type' => 'audio']);
        MaterialAccess::create([
            'user_id' => $this->mine['student']->id,
            'learning_material_id' => $material->id,
            'content_type' => 'audio',
            'accessed_at' => now(),
        ]);

        $this->getJson('/api/admin/learning-analytics')
            ->assertOk()
            ->assertJsonPath('data.summary.total_students_analyzed', 1)
            ->assertJsonPath('data.summary.audio_percentage', 100)
            ->assertJsonPath('data.students.0.audio_access_count', 1)
            ->assertJsonPath('data.students.0.dominant_style', 'Auditori (Audio Suara Guru)');
    }

    public function test_master_admin_must_pick_school(): void
    {
        Sanctum::actingAs(User::factory()->masterAdmin()->create());

        $this->getJson('/api/admin/teachers')
            ->assertStatus(422)
            ->assertJsonPath('message', 'Pilih sekolah terlebih dahulu.');

        $this->getJson('/api/admin/teachers?school_id=999999')->assertStatus(422);

        $ids = collect($this->getJson("/api/admin/teachers?school_id={$this->other['school']->id}")->assertOk()->json('data'))->pluck('id');
        $this->assertEquals([$this->other['teacher']->id], $ids->all());

        $this->postJson('/api/admin/classrooms', [
            'school_id' => $this->other['school']->id,
            'name' => 'Kelas Pusat',
            'code' => 'PUSAT-1',
        ])->assertCreated()->assertJsonPath('data.school_id', $this->other['school']->id);
    }
}
