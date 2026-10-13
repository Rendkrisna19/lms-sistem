<?php

namespace Tests\Feature\Quiz;

use App\Models\QuizAttempt;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Ujian ulang (remedial): guru membuka akses hanya untuk siswa yang belum lulus KKM,
 * dan siswa dapat mengerjakan ulang hanya setelah akses dibuka.
 */
class QuizRetakeTest extends TestCase
{
    use RefreshDatabase;
    use QuizFixtures;

    private function failedAttempt(array $setup, int $score = 40): array
    {
        $quiz = $this->makeQuiz($setup, ['passing_score' => 70]);
        $attempt = QuizAttempt::create([
            'quiz_id' => $quiz->id,
            'user_id' => $setup['student']->id,
            'attempt_no' => 1,
            'started_at' => now()->subHour(),
            'deadline_at' => now()->subMinutes(30),
            'submitted_at' => now()->subMinutes(35),
            'score' => $score,
            'total_correct' => 1,
            'total_questions' => 2,
            'status' => 'submitted',
        ]);

        return [$quiz, $attempt];
    }

    public function test_teacher_can_grant_retake_only_for_remedial_student(): void
    {
        $setup = $this->makeTeachingSetup();
        [$quiz] = $this->failedAttempt($setup);

        Sanctum::actingAs($setup['teacher']);
        $this->postJson("/api/teacher/quizzes/{$quiz->id}/students/{$setup['student']->id}/retake")
            ->assertOk()
            ->assertJsonPath('data.retake_granted', true);

        $this->assertNotNull(QuizAttempt::where('quiz_id', $quiz->id)->first()->retake_granted_at);
    }

    public function test_grant_is_rejected_for_passing_student(): void
    {
        $setup = $this->makeTeachingSetup();
        [$quiz] = $this->failedAttempt($setup, 90);

        Sanctum::actingAs($setup['teacher']);
        $this->postJson("/api/teacher/quizzes/{$quiz->id}/students/{$setup['student']->id}/retake")
            ->assertStatus(422);
    }

    public function test_student_cannot_start_again_without_grant(): void
    {
        $setup = $this->makeTeachingSetup();
        [$quiz] = $this->failedAttempt($setup);

        Sanctum::actingAs($setup['student']);
        $this->postJson("/api/student/quizzes/{$quiz->id}/start")->assertStatus(409);
        $this->getJson('/api/student/quizzes')
            ->assertOk()
            ->assertJsonPath('data.quizzes.0.can_start', false);
    }

    public function test_granted_student_starts_a_new_attempt_numbered_two(): void
    {
        $setup = $this->makeTeachingSetup();
        [$quiz, $first] = $this->failedAttempt($setup);
        $first->update(['retake_granted_at' => now(), 'retake_granted_by' => $setup['teacher']->id]);

        Sanctum::actingAs($setup['student']);
        $this->getJson('/api/student/quizzes')
            ->assertOk()
            ->assertJsonPath('data.quizzes.0.can_start', true);

        $this->postJson("/api/student/quizzes/{$quiz->id}/start")
            ->assertStatus(201)
            ->assertJsonPath('data.attempt.status', 'in_progress');

        $attempts = QuizAttempt::where('quiz_id', $quiz->id)->orderBy('attempt_no')->get();
        $this->assertCount(2, $attempts);
        $this->assertSame(2, $attempts->last()->attempt_no);
        $this->assertSame('in_progress', $attempts->last()->status);

        // Setelah dimulai, akses ulang sudah terpakai: attempt aktif adalah yang baru
        $this->postJson("/api/student/quizzes/{$quiz->id}/start")->assertOk();
    }

    public function test_teacher_can_revoke_unused_grant_and_grades_show_latest_attempt(): void
    {
        $setup = $this->makeTeachingSetup();
        [$quiz, $first] = $this->failedAttempt($setup);

        Sanctum::actingAs($setup['teacher']);
        $this->postJson("/api/teacher/quizzes/{$quiz->id}/students/{$setup['student']->id}/retake")->assertOk();
        $this->deleteJson("/api/teacher/quizzes/{$quiz->id}/students/{$setup['student']->id}/retake")
            ->assertOk()
            ->assertJsonPath('data.retake_granted', false);

        $grades = $this->getJson("/api/teacher/quizzes/{$quiz->id}/grades")->assertOk();
        $row = collect($grades->json('data.students'))->firstWhere('student_id', $setup['student']->id);
        $this->assertSame(1, $row['attempt_no']);
        $this->assertTrue($row['can_grant_retake']);
        $this->assertFalse($row['retake_granted']);
    }

    public function test_teacher_cannot_manage_retake_for_student_outside_classroom(): void
    {
        $setup = $this->makeTeachingSetup();
        [$quiz] = $this->failedAttempt($setup);
        $outsider = $this->makeTeachingSetup($setup['school'])['student'];

        Sanctum::actingAs($setup['teacher']);
        $this->postJson("/api/teacher/quizzes/{$quiz->id}/students/{$outsider->id}/retake")->assertNotFound();
    }
}
