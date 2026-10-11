<?php

namespace Tests\Feature;

use App\Models\ClassSubjectAssignment;
use App\Models\Course;
use App\Models\MaterialAccess;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\LmsFixtures;
use Tests\TestCase;

class StudentDashboardTest extends TestCase
{
    use LmsFixtures, RefreshDatabase;

    public function test_overview_returns_real_student_data(): void
    {
        $world = $this->createSchoolWorld();
        $material = $this->createMaterial($world);
        $this->createMaterial($world, ['content_type' => 'audio']);
        MaterialAccess::create([
            'user_id' => $world['student']->id,
            'learning_material_id' => $material->id,
            'content_type' => 'document',
            'accessed_at' => now()->subHour(),
        ]);
        MaterialAccess::create([
            'user_id' => $world['student']->id,
            'learning_material_id' => $material->id,
            'content_type' => 'document',
            'accessed_at' => now(),
        ]);

        $done = $this->createQuiz($world, ['title' => 'Kuis Selesai']);
        $this->createAttempt($done, $world['student'], ['score' => 90]);
        $open = $this->createQuiz($world, ['title' => 'Kuis Terbuka', 'starts_at' => now()->subHour(), 'ends_at' => now()->addDay()]);
        $upcoming = $this->createQuiz($world, ['title' => 'Kuis Mendatang', 'starts_at' => now()->addDay()]);
        $this->createQuiz($world, ['title' => 'Kuis Ditutup', 'ends_at' => now()->subDay()]);
        $this->createQuiz($world, ['title' => 'Kuis Nonaktif', 'is_active' => false]);

        Sanctum::actingAs($world['student']);

        $response = $this->getJson('/api/student/overview')
            ->assertOk()
            ->assertJsonPath('data.student.id', $world['student']->id)
            ->assertJsonPath('data.student.classroom.id', $world['classroom']->id)
            ->assertJsonPath('data.summary.materials_available', 2)
            ->assertJsonPath('data.summary.materials_accessed', 1)
            ->assertJsonPath('data.summary.quizzes_available', 4)
            ->assertJsonPath('data.summary.quizzes_completed', 1)
            ->assertJsonPath('data.summary.quizzes_pending', 1)
            ->assertJsonPath('data.summary.average_score', 90)
            ->assertJsonPath('data.recent_attempts.0.quiz_title', 'Kuis Selesai')
            ->assertJsonPath('data.recent_attempts.0.course_title', $world['course']->title)
            ->assertJsonPath('data.recent_attempts.0.is_passed', true);

        $upcomingIds = collect($response->json('data.upcoming_quizzes'))->pluck('id')->all();
        $this->assertEquals([$open->id, $upcoming->id], $upcomingIds);
        $response->assertJsonStructure(['data' => ['upcoming_quizzes' => [['id', 'title', 'course_title', 'starts_at', 'ends_at', 'duration_minutes']]]]);
    }

    public function test_grades_hide_score_when_results_are_not_shown_immediately(): void
    {
        $world = $this->createSchoolWorld();
        $visibleQuiz = $this->createQuiz($world, ['passing_score' => 70]);
        $hiddenQuiz = $this->createQuiz($world, ['show_result_immediately' => false]);
        $inProgressQuiz = $this->createQuiz($world);

        $this->createAttempt($visibleQuiz, $world['student'], ['score' => 60, 'total_correct' => 3]);
        $hidden = $this->createAttempt($hiddenQuiz, $world['student'], ['score' => 100, 'total_correct' => 5, 'status' => 'timed_out']);
        $this->createAttempt($inProgressQuiz, $world['student'], ['score' => null, 'status' => 'in_progress', 'submitted_at' => null]);
        // attempt siswa lain tidak boleh terlihat
        $this->createAttempt($visibleQuiz, User::factory()->murid()->create(['classroom_id' => $world['classroom']->id]));

        Sanctum::actingAs($world['student']);

        $response = $this->getJson('/api/student/grades')
            ->assertOk()
            ->assertJsonPath('data.summary.total_attempts', 2)
            ->assertJsonPath('data.summary.average_score', 60)
            ->assertJsonPath('data.summary.passed', 0)
            ->assertJsonPath('data.summary.failed', 1)
            ->assertJsonCount(2, 'data.attempts');

        $hiddenRow = collect($response->json('data.attempts'))->firstWhere('id', $hidden->id);
        $this->assertNull($hiddenRow['score']);
        $this->assertNull($hiddenRow['is_passed']);
        $this->assertNull($hiddenRow['total_correct']);
        $this->assertSame(5, $hiddenRow['total_questions']);
        $this->assertSame('timed_out', $hiddenRow['status']);

        $visibleRow = collect($response->json('data.attempts'))->firstWhere('quiz_id', $visibleQuiz->id);
        $this->assertEquals(60, $visibleRow['score']);
        $this->assertFalse($visibleRow['is_passed']);
        $this->assertSame(70, $visibleRow['passing_score']);
    }

    public function test_schedule_shape_and_weekday_order(): void
    {
        $world = $this->createSchoolWorld();
        $world['assignment']->update(['schedule_day' => 'Rabu', 'schedule_time' => '10:00 - 12:00', 'room' => 'Lab 1']);

        $extra = [
            ['Senin', '13:00 - 14:00'],
            ['Senin', '07:00 - 08:00'],
            ['Jumat', '08:00 - 09:00'],
        ];
        foreach ($extra as [$day, $time]) {
            ClassSubjectAssignment::factory()->create([
                'classroom_id' => $world['classroom']->id,
                'course_id' => Course::factory()->create(['school_id' => $world['school']->id])->id,
                'teacher_id' => $world['teacher']->id,
                'schedule_day' => $day,
                'schedule_time' => $time,
            ]);
        }
        // jadwal kelas lain tidak boleh ikut
        $this->createSchoolWorld();

        Sanctum::actingAs($world['student']);

        $response = $this->getJson('/api/student/schedule')
            ->assertOk()
            ->assertJsonPath('data.classroom.id', $world['classroom']->id)
            ->assertJsonPath('data.classroom.code', $world['classroom']->code)
            ->assertJsonStructure(['data' => ['schedule' => [['id', 'course_title', 'teacher_name', 'schedule_day', 'schedule_time', 'room']]]])
            ->assertJsonCount(4, 'data.schedule');

        $order = collect($response->json('data.schedule'))->map(fn ($row) => $row['schedule_day'] . ' ' . $row['schedule_time'])->all();
        $this->assertSame(['Senin 07:00 - 08:00', 'Senin 13:00 - 14:00', 'Rabu 10:00 - 12:00', 'Jumat 08:00 - 09:00'], $order);
        $response->assertJsonPath('data.schedule.2.teacher_name', $world['teacher']->name)
            ->assertJsonPath('data.schedule.2.room', 'Lab 1');
    }

    public function test_schedule_without_classroom(): void
    {
        $student = User::factory()->murid()->create(['classroom_id' => null]);
        Sanctum::actingAs($student);

        $this->getJson('/api/student/schedule')
            ->assertOk()
            ->assertJsonPath('data.classroom', null)
            ->assertJsonCount(0, 'data.schedule');
    }
}
