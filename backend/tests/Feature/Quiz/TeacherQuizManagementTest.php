<?php

namespace Tests\Feature\Quiz;

use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TeacherQuizManagementTest extends TestCase
{
    use RefreshDatabase;
    use QuizFixtures;

    public function test_teacher_can_create_quiz_with_sanitized_rich_text(): void
    {
        $setup = $this->makeTeachingSetup();
        Sanctum::actingAs($setup['teacher']);

        $payload = $this->quizPayload($setup['classroom'], $setup['course']);
        $payload['questions'][0]['question_text'] =
            '<p onclick="alert(1)">Apa itu 1NF?</p><script>alert(1)</script><img src="javascript:alert(1)"><img src="https://example.test/a.png" onerror="alert(1)">';

        $response = $this->postJson('/api/teacher/quizzes', $payload)->assertCreated();

        $question = $response->json('data.questions.0');
        $this->assertStringNotContainsString('script', $question['question_text']);
        $this->assertStringNotContainsString('onclick', $question['question_text']);
        $this->assertStringNotContainsString('onerror', $question['question_text']);
        $this->assertStringNotContainsString('javascript:', $question['question_text']);
        $this->assertStringContainsString('https://example.test/a.png', $question['question_text']);

        $this->assertSame(['A', 'B', 'C'], array_column($question['options'], 'option_label'));
        $this->assertSame('https://example.test/gambar.png', $question['options'][2]['image_url']);
        $this->assertSame($setup['teacher']->id, Quiz::first()->teacher_id);
    }

    public function test_quiz_validation_rules(): void
    {
        $setup = $this->makeTeachingSetup();
        $other = $this->makeTeachingSetup($setup['school']);
        Sanctum::actingAs($setup['teacher']);

        // Kelas milik guru lain
        $this->postJson('/api/teacher/quizzes', $this->quizPayload($other['classroom'], $other['course']))
            ->assertUnprocessable()->assertJsonValidationErrors('classroom_id');

        // Dua kunci jawaban
        $payload = $this->quizPayload($setup['classroom'], $setup['course']);
        $payload['questions'][1]['options'][0]['is_correct'] = true;
        $this->postJson('/api/teacher/quizzes', $payload)
            ->assertUnprocessable()->assertJsonValidationErrors('questions.1.options');

        // Opsi kosong tanpa gambar
        $payload = $this->quizPayload($setup['classroom'], $setup['course']);
        $payload['questions'][1]['options'][0]['option_text'] = '<p>  </p>';
        $this->postJson('/api/teacher/quizzes', $payload)
            ->assertUnprocessable()->assertJsonValidationErrors('questions.1.options.0.option_text');

        // Jadwal tutup sebelum buka
        $payload = $this->quizPayload($setup['classroom'], $setup['course'], [
            'starts_at' => now()->addDay()->toIso8601String(),
            'ends_at' => now()->toIso8601String(),
        ]);
        $this->postJson('/api/teacher/quizzes', $payload)
            ->assertUnprocessable()->assertJsonValidationErrors('ends_at');

        // Lebih dari 5 opsi
        $payload = $this->quizPayload($setup['classroom'], $setup['course']);
        $payload['questions'][1]['options'] = array_fill(0, 6, ['option_text' => 'x', 'is_correct' => false]);
        $this->postJson('/api/teacher/quizzes', $payload)->assertUnprocessable();

        $this->assertSame(0, Quiz::count());
    }

    public function test_schedule_is_stored_in_app_timezone(): void
    {
        $setup = $this->makeTeachingSetup();
        Sanctum::actingAs($setup['teacher']);

        // 01:00 UTC = 08:00 WIB
        $payload = $this->quizPayload($setup['classroom'], $setup['course'], [
            'starts_at' => '2030-01-10T01:00:00.000Z',
            'ends_at' => '2030-01-10T03:00:00+00:00',
        ]);

        $this->postJson('/api/teacher/quizzes', $payload)->assertCreated();

        $quiz = Quiz::first();
        $this->assertSame('2030-01-10 08:00', $quiz->starts_at->format('Y-m-d H:i'));
        $this->assertSame('2030-01-10 10:00', $quiz->ends_at->format('Y-m-d H:i'));
    }

    public function test_teacher_cannot_touch_quizzes_of_other_teachers_even_with_header(): void
    {
        $owner = $this->makeTeachingSetup();
        $intruder = $this->makeTeachingSetup($owner['school']);
        $quiz = $this->makeQuiz($owner);

        Sanctum::actingAs($intruder['teacher']);
        $headers = ['X-Teacher-Id' => $owner['teacher']->id];

        $this->getJson("/api/teacher/quizzes/{$quiz->id}", $headers)->assertNotFound();
        $this->getJson("/api/teacher/quizzes/{$quiz->id}?teacher_id={$owner['teacher']->id}")->assertNotFound();
        $this->putJson("/api/teacher/quizzes/{$quiz->id}", $this->quizPayload($intruder['classroom'], $intruder['course']), $headers)->assertNotFound();
        $this->patchJson("/api/teacher/quizzes/{$quiz->id}/toggle-status", [], $headers)->assertNotFound();
        $this->deleteJson("/api/teacher/quizzes/{$quiz->id}", [], $headers)->assertNotFound();
        $this->getJson("/api/teacher/quizzes/{$quiz->id}/grades", $headers)->assertNotFound();

        $list = $this->getJson('/api/teacher/quizzes', $headers)->assertOk();
        $this->assertCount(0, $list->json('data.quizzes'));
        $this->assertDatabaseHas('quizzes', ['id' => $quiz->id, 'is_active' => true]);
    }

    public function test_students_and_admins_cannot_use_teacher_quiz_endpoints(): void
    {
        $setup = $this->makeTeachingSetup();
        $quiz = $this->makeQuiz($setup);
        $admin = $this->makeUser('admin', $setup['school']);

        foreach ([$setup['student'], $admin] as $user) {
            Sanctum::actingAs($user);
            $this->getJson('/api/teacher/quizzes')->assertForbidden();
            $this->getJson("/api/teacher/quizzes/{$quiz->id}")->assertForbidden();
            $this->postJson('/api/teacher/quizzes', $this->quizPayload($setup['classroom'], $setup['course']))->assertForbidden();
        }
    }

    public function test_update_keeps_question_ids_and_existing_student_answers(): void
    {
        $setup = $this->makeTeachingSetup();
        $quiz = $this->makeQuiz($setup);
        [$first, $second] = $quiz->questions->all();

        $attempt = QuizAttempt::create([
            'quiz_id' => $quiz->id,
            'user_id' => $setup['student']->id,
            'started_at' => now(),
            'deadline_at' => now()->addMinutes(30),
            'status' => 'in_progress',
        ]);
        QuizAnswer::create(['attempt_id' => $attempt->id, 'question_id' => $first->id, 'selected_option_id' => $this->correctOptionId($first)]);

        Sanctum::actingAs($setup['teacher']);
        $detail = $this->getJson("/api/teacher/quizzes/{$quiz->id}")->assertOk()->json('data');

        // Ubah teks soal pertama, hapus soal kedua, tambah soal baru
        $questions = [$detail['questions'][0]];
        $questions[0]['question_text'] = '<p>Soal 1 (revisi)</p>';
        $questions[] = [
            'question_text' => '<p>Soal baru</p>',
            'points' => 10,
            'options' => [
                ['option_text' => 'Ya', 'is_correct' => true],
                ['option_text' => 'Tidak', 'is_correct' => false],
            ],
        ];

        $payload = $this->quizPayload($setup['classroom'], $setup['course'], ['title' => 'Judul Baru', 'questions' => $questions]);
        $response = $this->putJson("/api/teacher/quizzes/{$quiz->id}", $payload)->assertOk();

        $this->assertSame($first->id, $response->json('data.questions.0.id'));
        $this->assertSame('<p>Soal 1 (revisi)</p>', $response->json('data.questions.0.question_text'));
        $this->assertCount(2, $response->json('data.questions'));
        $this->assertDatabaseMissing('quiz_questions', ['id' => $second->id]);
        $this->assertDatabaseHas('quiz_answers', ['attempt_id' => $attempt->id, 'question_id' => $first->id]);
        $this->assertSame(1, $response->json('data.attempts_count'));
    }

    public function test_index_returns_only_own_quizzes_with_summary(): void
    {
        $setup = $this->makeTeachingSetup();
        $other = $this->makeTeachingSetup($setup['school']);
        $this->makeQuiz($setup);
        $this->makeQuiz($setup, ['is_active' => false]);
        $this->makeQuiz($other);

        Sanctum::actingAs($setup['teacher']);
        $response = $this->getJson('/api/teacher/quizzes')->assertOk();

        $this->assertCount(2, $response->json('data.quizzes'));
        $this->assertSame(2, $response->json('data.summary.total'));
        $this->assertSame(1, $response->json('data.summary.total_inactive'));
        $this->assertSame(4, $response->json('data.summary.total_questions'));
        $this->assertCount(1, $response->json('data.assigned_options'));
    }

    public function test_image_upload_rejects_svg_and_accepts_png(): void
    {
        Storage::fake('public');
        $setup = $this->makeTeachingSetup();
        Sanctum::actingAs($setup['teacher']);

        $svg = UploadedFile::fake()->createWithContent('x.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
        $this->postJson('/api/teacher/quizzes/upload-image', ['image' => $svg])->assertUnprocessable();

        $png = UploadedFile::fake()->image('soal.png', 200, 120);
        $response = $this->postJson('/api/teacher/quizzes/upload-image', ['image' => $png])->assertOk();
        $this->assertStringContainsString('/storage/quiz_images/', $response->json('url'));
        $this->assertCount(1, Storage::disk('public')->files('quiz_images'));
    }

    public function test_grades_and_csv_export_for_own_quiz(): void
    {
        $setup = $this->makeTeachingSetup();
        $setup['student']->update(['name' => '=HYPERLINK("http://evil")']);
        $quiz = $this->makeQuiz($setup);
        QuizAttempt::create([
            'quiz_id' => $quiz->id,
            'user_id' => $setup['student']->id,
            'started_at' => now()->subMinutes(10),
            'submitted_at' => now(),
            'score' => 60,
            'total_correct' => 1,
            'total_questions' => 2,
            'status' => 'submitted',
        ]);

        Sanctum::actingAs($setup['teacher']);
        $grades = $this->getJson("/api/teacher/quizzes/{$quiz->id}/grades")->assertOk();
        $this->assertSame(1, $grades->json('data.summary.finished'));
        $this->assertSame(1, $grades->json('data.summary.failed'));
        $this->assertCount(2, $grades->json('data.item_analysis'));

        $csv = $this->get("/api/teacher/quizzes/{$quiz->id}/export-csv")->assertOk();
        $content = $csv->streamedContent();
        $this->assertStringContainsString('NAMA SISWA', $content);
        $this->assertStringContainsString("'=HYPERLINK", $content);
        $this->assertStringContainsString('REMEDIAL', $content);
    }
}
