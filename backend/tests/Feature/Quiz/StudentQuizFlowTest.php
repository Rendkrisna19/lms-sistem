<?php

namespace Tests\Feature\Quiz;

use App\Models\QuizAttempt;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StudentQuizFlowTest extends TestCase
{
    use RefreshDatabase;
    use QuizFixtures;

    public function test_list_shows_only_active_quizzes_of_own_classroom(): void
    {
        $setup = $this->makeTeachingSetup();
        $other = $this->makeTeachingSetup($setup['school']);
        $mine = $this->makeQuiz($setup);
        $this->makeQuiz($setup, ['is_active' => false]);
        $this->makeQuiz($other);

        Sanctum::actingAs($setup['student']);
        $response = $this->getJson('/api/student/quizzes')->assertOk();

        $this->assertSame([$mine->id], array_column($response->json('data.quizzes'), 'id'));
        $this->assertTrue($response->json('data.quizzes.0.can_start'));
        $this->assertNull($response->json('data.quizzes.0.attempt'));
    }

    public function test_start_hides_answer_keys_and_resumes_same_attempt(): void
    {
        $setup = $this->makeTeachingSetup();
        $quiz = $this->makeQuiz($setup);
        Sanctum::actingAs($setup['student']);

        $first = $this->postJson("/api/student/quizzes/{$quiz->id}/start")->assertCreated();
        $raw = $first->getContent();
        $this->assertStringNotContainsString('is_correct', $raw);
        $this->assertStringNotContainsString('Pembahasan rahasia', $raw);
        $this->assertCount(2, $first->json('data.questions'));
        $this->assertNotNull($first->json('data.attempt.deadline_at'));

        $second = $this->postJson("/api/student/quizzes/{$quiz->id}/start")->assertOk();
        $this->assertSame($first->json('data.attempt.id'), $second->json('data.attempt.id'));
        $this->assertSame(1, QuizAttempt::count());
    }

    public function test_cannot_start_quiz_of_other_classroom_inactive_or_outside_schedule(): void
    {
        $setup = $this->makeTeachingSetup();
        $other = $this->makeTeachingSetup($setup['school']);
        Sanctum::actingAs($setup['student']);

        $this->postJson('/api/student/quizzes/' . $this->makeQuiz($other)->id . '/start')->assertNotFound();
        $this->postJson('/api/student/quizzes/' . $this->makeQuiz($setup, ['is_active' => false])->id . '/start')->assertNotFound();
        $this->postJson('/api/student/quizzes/' . $this->makeQuiz($setup, ['starts_at' => now()->addHour()])->id . '/start')->assertForbidden();
        $this->postJson('/api/student/quizzes/' . $this->makeQuiz($setup, ['ends_at' => now()->subMinute()])->id . '/start')->assertForbidden();
        $this->postJson('/api/student/quizzes/' . $this->makeQuiz($setup, [], [])->id . '/start')->assertUnprocessable();

        $this->assertSame(0, QuizAttempt::count());
    }

    public function test_full_flow_scores_on_server(): void
    {
        $setup = $this->makeTeachingSetup();
        $quiz = $this->makeQuiz($setup);
        [$q1, $q2] = $quiz->questions->all();
        Sanctum::actingAs($setup['student']);

        $attemptId = $this->postJson("/api/student/quizzes/{$quiz->id}/start")->json('data.attempt.id');

        // Soal 1 benar (60 poin), soal 2 salah
        $save = $this->postJson("/api/student/attempts/{$attemptId}/answers", [
            'question_id' => $q1->id,
            'selected_option_id' => $this->wrongOptionId($q1),
        ])->assertOk();
        $this->assertArrayNotHasKey('is_correct', $save->json('data'));

        // Ganti jawaban (upsert, tidak menggandakan baris)
        $this->postJson("/api/student/attempts/{$attemptId}/answers", [
            'question_id' => $q1->id,
            'selected_option_id' => $this->correctOptionId($q1),
        ])->assertOk();
        $this->postJson("/api/student/attempts/{$attemptId}/answers", [
            'question_id' => $q2->id,
            'selected_option_id' => $this->wrongOptionId($q2),
        ])->assertOk();
        $this->assertDatabaseCount('quiz_answers', 2);

        // Jawaban tersimpan dikembalikan saat melanjutkan
        $resume = $this->postJson("/api/student/quizzes/{$quiz->id}/start")->assertOk();
        $this->assertEquals($this->correctOptionId($q1), $resume->json("data.answers.{$q1->id}"));

        $submit = $this->postJson("/api/student/attempts/{$attemptId}/submit")->assertOk();
        $this->assertEquals(60.0, $submit->json('data.attempt.score'));
        $this->assertSame(1, $submit->json('data.attempt.total_correct'));
        $this->assertFalse($submit->json('data.attempt.is_passed'));
        $this->assertSame('submitted', $submit->json('data.attempt.status'));

        // Idempoten & tidak bisa mengulang
        $this->postJson("/api/student/attempts/{$attemptId}/submit")->assertOk()->assertJsonPath('data.attempt.score', 60);
        $this->postJson("/api/student/quizzes/{$quiz->id}/start")->assertStatus(409);
        $this->postJson("/api/student/attempts/{$attemptId}/answers", [
            'question_id' => $q2->id,
            'selected_option_id' => $this->correctOptionId($q2),
        ])->assertStatus(409);

        $list = $this->getJson('/api/student/quizzes')->assertOk();
        $this->assertFalse($list->json('data.quizzes.0.can_start'));
        $this->assertEquals(60, $list->json('data.quizzes.0.attempt.score'));
    }

    public function test_answers_must_belong_to_the_attempt_quiz(): void
    {
        $setup = $this->makeTeachingSetup();
        $quiz = $this->makeQuiz($setup);
        $otherQuiz = $this->makeQuiz($setup);
        [$q1, $q2] = $quiz->questions->all();
        $foreign = $otherQuiz->questions->first();
        Sanctum::actingAs($setup['student']);

        $attemptId = $this->postJson("/api/student/quizzes/{$quiz->id}/start")->json('data.attempt.id');

        // Soal dari ujian lain
        $this->postJson("/api/student/attempts/{$attemptId}/answers", [
            'question_id' => $foreign->id,
            'selected_option_id' => $this->correctOptionId($foreign),
        ])->assertUnprocessable();

        // Opsi milik soal lain (dulu bisa dipakai untuk mengulang satu opsi benar di semua soal)
        $this->postJson("/api/student/attempts/{$attemptId}/answers", [
            'question_id' => $q2->id,
            'selected_option_id' => $this->correctOptionId($q1),
        ])->assertUnprocessable();

        $this->assertDatabaseCount('quiz_answers', 0);
    }

    public function test_attempt_of_another_student_is_not_accessible(): void
    {
        $setup = $this->makeTeachingSetup();
        $quiz = $this->makeQuiz($setup);
        $classmate = $this->makeUser('murid', $setup['school'], $setup['classroom']);

        Sanctum::actingAs($setup['student']);
        $attemptId = $this->postJson("/api/student/quizzes/{$quiz->id}/start")->json('data.attempt.id');

        Sanctum::actingAs($classmate);
        $q1 = $quiz->questions->first();
        $this->postJson("/api/student/attempts/{$attemptId}/answers", [
            'question_id' => $q1->id,
            'selected_option_id' => $this->correctOptionId($q1),
        ])->assertNotFound();
        $this->postJson("/api/student/attempts/{$attemptId}/submit")->assertNotFound();
        $this->getJson("/api/student/attempts/{$attemptId}")->assertNotFound();
    }

    public function test_time_limit_is_enforced_by_server(): void
    {
        $setup = $this->makeTeachingSetup();
        $quiz = $this->makeQuiz($setup, ['duration_minutes' => 10]);
        $q1 = $quiz->questions->first();
        Sanctum::actingAs($setup['student']);

        $attemptId = $this->postJson("/api/student/quizzes/{$quiz->id}/start")->json('data.attempt.id');
        $this->postJson("/api/student/attempts/{$attemptId}/answers", [
            'question_id' => $q1->id,
            'selected_option_id' => $this->correctOptionId($q1),
        ])->assertOk();

        $this->travel(11)->minutes();

        $this->postJson("/api/student/attempts/{$attemptId}/answers", [
            'question_id' => $quiz->questions->last()->id,
            'selected_option_id' => $this->correctOptionId($quiz->questions->last()),
        ])->assertStatus(409)->assertJsonPath('status', 'time_up');

        $attempt = QuizAttempt::find($attemptId);
        $this->assertSame('timed_out', $attempt->status);
        $this->assertEquals(60.0, $attempt->score);
    }

    public function test_deadline_never_exceeds_quiz_closing_time(): void
    {
        $setup = $this->makeTeachingSetup();
        $quiz = $this->makeQuiz($setup, ['duration_minutes' => 60, 'ends_at' => now()->addMinutes(15)]);
        Sanctum::actingAs($setup['student']);

        $deadline = $this->postJson("/api/student/quizzes/{$quiz->id}/start")->json('data.attempt.deadline_at');
        $this->assertTrue(now()->addMinutes(15)->addSecond()->greaterThanOrEqualTo(\Carbon\Carbon::parse($deadline)));
    }

    public function test_score_hidden_when_result_not_shown_immediately(): void
    {
        $setup = $this->makeTeachingSetup();
        $quiz = $this->makeQuiz($setup, ['show_result_immediately' => false]);
        Sanctum::actingAs($setup['student']);

        $attemptId = $this->postJson("/api/student/quizzes/{$quiz->id}/start")->json('data.attempt.id');
        $submit = $this->postJson("/api/student/attempts/{$attemptId}/submit")->assertOk();

        $this->assertNull($submit->json('data.attempt.score'));
        $this->assertNull($submit->json('data.attempt.is_passed'));
        $this->assertFalse($submit->json('data.attempt.result_visible'));
        $this->assertSame('submitted', QuizAttempt::find($attemptId)->status);
    }

    public function test_teachers_cannot_use_student_exam_endpoints(): void
    {
        $setup = $this->makeTeachingSetup();
        $quiz = $this->makeQuiz($setup);
        Sanctum::actingAs($setup['teacher']);

        $this->getJson('/api/student/quizzes')->assertForbidden();
        $this->postJson("/api/student/quizzes/{$quiz->id}/start")->assertForbidden();
    }
}
