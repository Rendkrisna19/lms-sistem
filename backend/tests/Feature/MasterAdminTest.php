<?php

namespace Tests\Feature;

use App\Models\MaterialAccess;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\LmsFixtures;
use Tests\TestCase;

class MasterAdminTest extends TestCase
{
    use LmsFixtures, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->masterAdmin()->create());
    }

    public function test_overview_without_attempts_returns_zero_instead_of_fake_numbers(): void
    {
        $this->createSchoolWorld();

        $this->getJson('/api/master/overview')
            ->assertOk()
            ->assertJsonPath('data.total_schools', 1)
            ->assertJsonPath('data.average_score', 0)
            ->assertJsonPath('data.pass_rate', 0)
            ->assertJsonMissingPath('data.system_health');
    }

    public function test_overview_averages_ignore_in_progress_attempts(): void
    {
        $world = $this->createSchoolWorld();
        $quiz = $this->createQuiz($world, ['passing_score' => 70]);
        $other = User::factory()->murid()->create(['school_id' => $world['school']->id, 'classroom_id' => $world['classroom']->id]);
        $third = User::factory()->murid()->create(['school_id' => $world['school']->id, 'classroom_id' => $world['classroom']->id]);

        $this->createAttempt($quiz, $world['student'], ['score' => 90]);
        $this->createAttempt($quiz, $other, ['score' => 50, 'status' => 'timed_out']);
        $this->createAttempt($quiz, $third, ['score' => 0, 'status' => 'in_progress', 'submitted_at' => null]);

        $this->getJson('/api/master/overview')
            ->assertOk()
            ->assertJsonPath('data.average_score', 70)
            ->assertJsonPath('data.pass_rate', 50)
            ->assertJsonPath('data.total_exam_attempts', 2);

        $this->getJson("/api/admin/schools/{$world['school']->id}/analytics")
            ->assertOk()
            ->assertJsonPath('data.summary.average_exam_score', 70)
            ->assertJsonPath('data.summary.pass_rate_percentage', 50);
    }

    public function test_learning_analytics_reflects_material_accesses_and_school_filter(): void
    {
        $a = $this->createSchoolWorld();
        $b = $this->createSchoolWorld();

        $pdf = $this->createMaterial($a, ['content_type' => 'document']);
        $video = $this->createMaterial($a, ['content_type' => 'video']);

        foreach ([$pdf, $pdf, $video] as $i => $material) {
            MaterialAccess::create([
                'user_id' => $a['student']->id,
                'learning_material_id' => $material->id,
                'content_type' => $material->content_type,
                'accessed_at' => now()->subHours($i * 2),
            ]);
        }

        $all = $this->getJson('/api/master/learning-analytics')->assertOk();
        $all->assertJsonPath('data.summary.total_students_analyzed', 2)
            ->assertJsonPath('data.summary.total_media_interactions', 3);

        $filtered = $this->getJson("/api/master/learning-analytics?school_id={$a['school']->id}")->assertOk();
        $filtered->assertJsonPath('data.summary.total_students_analyzed', 1)
            ->assertJsonPath('data.summary.pdf_percentage', 66.7)
            ->assertJsonPath('data.summary.video_percentage', 33.3)
            ->assertJsonPath('data.summary.audio_percentage', 0)
            ->assertJsonPath('data.students.0.pdf_access_count', 2)
            ->assertJsonPath('data.students.0.video_access_count', 1)
            ->assertJsonPath('data.students.0.total_access', 3)
            ->assertJsonPath('data.students.0.dominant_style', 'Visual (Dokumen PDF)')
            ->assertJsonPath('data.students.0.school_name', $a['school']->name);

        $empty = $this->getJson("/api/master/learning-analytics?school_id={$b['school']->id}")->assertOk();
        $empty->assertJsonPath('data.summary.total_media_interactions', 0)
            ->assertJsonPath('data.summary.pdf_percentage', 0)
            ->assertJsonPath('data.students.0.dominant_style', 'Belum Ada Aktivitas')
            ->assertJsonPath('data.students.0.learning_pace', '-');
    }

    public function test_creating_school_admin_requires_password(): void
    {
        $this->postJson('/api/admin/schools', [
            'name' => 'SMA Baru',
            'admin_email' => 'admin.baru@example.com',
        ])->assertStatus(422)->assertJsonValidationErrors('admin_password');

        $this->assertDatabaseMissing('schools', ['name' => 'SMA Baru']);

        $this->postJson('/api/admin/schools', [
            'name' => 'SMA Baru',
            'admin_email' => 'admin.baru@example.com',
            'admin_password' => 'rahasia-123',
        ])->assertCreated()->assertJsonPath('data.admin.email', 'admin.baru@example.com');

        $this->postJson('/api/login', ['nomor_induk' => 'admin.baru@example.com', 'password' => 'password123'])
            ->assertStatus(422);
    }

    public function test_updating_school_admin_password_revokes_tokens(): void
    {
        $world = $this->createSchoolWorld();
        $world['admin']->createToken('lama');

        $this->putJson("/api/admin/schools/{$world['school']->id}", [
            'name' => $world['school']->name,
            'admin_email' => $world['admin']->email,
            'admin_password' => 'pendek',
        ])->assertStatus(422);

        $this->putJson("/api/admin/schools/{$world['school']->id}", [
            'name' => $world['school']->name,
            'admin_email' => $world['admin']->email,
            'admin_password' => 'kata-sandi-baru',
        ])->assertOk();

        $this->assertSame(0, $world['admin']->tokens()->count());
    }
}
