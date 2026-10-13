<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\LmsFixtures;
use Tests\TestCase;

/**
 * Aktivitas belajar siswa (membuka materi) harus tercermin di dashboard siswa
 * dan di analitik keaktifan guru, admin sekolah, serta admin master.
 */
class StudentLearningActivityTest extends TestCase
{
    use LmsFixtures, RefreshDatabase;

    public function test_material_list_marks_materials_opened_by_the_student(): void
    {
        $world = $this->createSchoolWorld();
        $opened = $this->createMaterial($world, ['content_type' => 'document']);
        $unopened = $this->createMaterial($world, ['content_type' => 'audio']);

        Sanctum::actingAs($world['student']);
        $this->postJson("/api/student/materials/{$opened->id}/access")->assertOk();

        $materials = collect($this->getJson('/api/student/materials')->assertOk()->json('data.materials'))->keyBy('id');

        $this->assertSame(1, $materials[$opened->id]['my_access_count']);
        $this->assertNotNull($materials[$opened->id]['my_last_accessed_at']);
        $this->assertSame(0, $materials[$unopened->id]['my_access_count']);
        $this->assertSame($world['classroom']->id, $materials[$opened->id]['classroom']['id']);

        // Akses siswa lain tidak boleh terhitung sebagai akses siswa ini
        $classmate = User::factory()->murid()->create(['school_id' => $world['school']->id, 'classroom_id' => $world['classroom']->id]);
        Sanctum::actingAs($classmate);
        $this->postJson("/api/student/materials/{$unopened->id}/access")->assertOk();

        Sanctum::actingAs($world['student']);
        $materials = collect($this->getJson('/api/student/materials')->json('data.materials'))->keyBy('id');
        $this->assertSame(0, $materials[$unopened->id]['my_access_count']);
    }

    public function test_overview_progress_media_usage_and_recent_materials(): void
    {
        $world = $this->createSchoolWorld();
        $pdf = $this->createMaterial($world, ['content_type' => 'document']);
        $this->createMaterial($world, ['content_type' => 'audio']);
        $this->createMaterial($world, ['content_type' => 'video']);
        $video = $this->createMaterial($world, ['content_type' => 'video']);

        Sanctum::actingAs($world['student']);
        $this->postJson("/api/student/materials/{$pdf->id}/access")->assertOk();
        $this->postJson("/api/student/materials/{$video->id}/access")->assertOk();

        $response = $this->getJson('/api/student/overview')
            ->assertOk()
            ->assertJsonPath('data.summary.materials_available', 4)
            ->assertJsonPath('data.summary.materials_accessed', 2)
            ->assertJsonPath('data.summary.learning_progress_pct', 50)
            ->assertJsonPath('data.summary.latest_score', null)
            ->assertJsonPath('data.media_usage.pdf', 1)
            ->assertJsonPath('data.media_usage.audio', 0)
            ->assertJsonPath('data.media_usage.video', 1)
            ->assertJsonPath('data.media_usage.total', 2)
            ->assertJsonPath('data.enrolled_courses.0.teacher_name', $world['teacher']->name);

        $recent = collect($response->json('data.recent_materials'))->keyBy('id');
        $this->assertCount(4, $recent);
        $this->assertTrue($recent[$pdf->id]['is_accessed']);
        $this->assertTrue($recent[$video->id]['is_accessed']);
        $this->assertSame(2, $recent->where('is_accessed', false)->count());
    }

    public function test_overview_latest_score_and_today_schedule(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-14 09:00:00')); // Rabu

        $world = $this->createSchoolWorld();
        $world['assignment']->update(['schedule_day' => 'Rabu', 'schedule_time' => '08:00 - 10:00', 'room' => 'Lab 2']);

        $older = $this->createQuiz($world);
        $this->createAttempt($older, $world['student'], ['score' => 90, 'submitted_at' => now()->subDay()]);
        $latest = $this->createQuiz($world, ['passing_score' => 75]);
        $this->createAttempt($latest, $world['student'], ['score' => 60, 'submitted_at' => now()->subHour()]);

        Sanctum::actingAs($world['student']);

        $this->getJson('/api/student/overview')
            ->assertOk()
            ->assertJsonPath('data.summary.latest_score', 60)
            ->assertJsonPath('data.summary.latest_is_passed', false)
            ->assertJsonPath('data.today', 'Rabu')
            ->assertJsonCount(1, 'data.today_schedule')
            ->assertJsonPath('data.today_schedule.0.course_title', $world['course']->title)
            ->assertJsonPath('data.today_schedule.0.room', 'Lab 2');

        Carbon::setTestNow();
    }

    public function test_student_access_is_visible_to_teacher_school_admin_and_master_analytics(): void
    {
        $world = $this->createSchoolWorld();
        $audio = $this->createMaterial($world, ['content_type' => 'audio']);

        Sanctum::actingAs($world['student']);
        $this->postJson("/api/student/materials/{$audio->id}/access")->assertOk();

        $endpoints = [
            [$world['teacher'], '/api/teacher/learning-analytics'],
            [$world['admin'], '/api/admin/learning-analytics'],
            [User::factory()->masterAdmin()->create(), "/api/master/learning-analytics?school_id={$world['school']->id}"],
        ];

        foreach ($endpoints as [$viewer, $url]) {
            Sanctum::actingAs($viewer);
            $row = collect($this->getJson($url)->assertOk()->json('data.students'))
                ->firstWhere('id', $world['student']->id);

            $this->assertNotNull($row, "Siswa tidak muncul di {$url}");
            $this->assertSame(1, $row['audio_access_count'], $url);
            $this->assertSame(1, $row['total_access'], $url);
            $this->assertSame('Auditori (Audio Suara Guru)', $row['dominant_style'], $url);
        }
    }
}
