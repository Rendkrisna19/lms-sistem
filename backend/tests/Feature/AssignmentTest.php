<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\LmsFixtures;
use Tests\TestCase;

/**
 * Penugasan: batas waktu, pengumpulan terlambat, penilaian, dan isolasi antar kelas.
 */
class AssignmentTest extends TestCase
{
    use LmsFixtures, RefreshDatabase;

    private function makeAssignment(array $world, array $attributes = []): Assignment
    {
        return Assignment::create($attributes + [
            'school_id' => $world['school']->id,
            'teacher_id' => $world['teacher']->id,
            'classroom_id' => $world['classroom']->id,
            'course_id' => $world['course']->id,
            'title' => 'Latihan ' . fake()->word(),
            'instructions' => 'Kerjakan soal 1 sampai 5.',
            'due_at' => now()->addDays(2),
            'allow_late' => false,
            'max_score' => 100,
            'is_active' => true,
        ]);
    }

    public function test_teacher_creates_assignment_with_deadline_and_student_sees_it(): void
    {
        Storage::fake('public');
        $world = $this->createSchoolWorld();
        $due = now()->addDays(3)->startOfMinute();

        Sanctum::actingAs($world['teacher']);
        $this->postJson('/api/teacher/assignments', [
            'classroom_id' => $world['classroom']->id,
            'course_id' => $world['course']->id,
            'title' => 'Tugas Bab 2',
            'instructions' => 'Tulis ringkasan.',
            'due_at' => $due->toIso8601String(),
            'allow_late' => false,
            'max_score' => 100,
            'is_active' => true,
            'attachment' => UploadedFile::fake()->create('soal.pdf', 120, 'application/pdf'),
        ])->assertCreated()
            ->assertJsonPath('data.title', 'Tugas Bab 2')
            ->assertJsonPath('data.status_state', 'open');

        Storage::disk('public')->assertExists(Assignment::first()->attachment_path);

        Sanctum::actingAs($world['student']);
        $this->getJson('/api/student/assignments')
            ->assertOk()
            ->assertJsonPath('data.assignments.0.title', 'Tugas Bab 2')
            ->assertJsonPath('data.assignments.0.can_submit', true)
            ->assertJsonPath('data.assignments.0.submission', null);
    }

    public function test_teacher_cannot_create_assignment_for_course_they_do_not_teach(): void
    {
        $world = $this->createSchoolWorld();
        $otherCourse = $this->createSchoolWorld()["course"];

        Sanctum::actingAs($world['teacher']);
        $this->postJson('/api/teacher/assignments', [
            'classroom_id' => $world['classroom']->id,
            'course_id' => $otherCourse->id,
            'title' => 'Tidak sah',
            'due_at' => now()->addDay()->toIso8601String(),
            'allow_late' => false,
            'max_score' => 100,
            'is_active' => true,
        ])->assertStatus(422);
    }

    public function test_student_submission_on_time_is_not_late(): void
    {
        $world = $this->createSchoolWorld();
        $assignment = $this->makeAssignment($world);

        Sanctum::actingAs($world['student']);
        $this->postJson("/api/student/assignments/{$assignment->id}/submit", [
            'answer_text' => 'Jawaban saya.',
        ])->assertOk()
            ->assertJsonPath('data.submission.state', 'submitted')
            ->assertJsonPath('data.submission.is_late', false);

        $this->getJson("/api/student/assignments/{$assignment->id}")
            ->assertOk()
            ->assertJsonPath('data.submission.answer_text', 'Jawaban saya.');
    }

    public function test_late_submission_is_accepted_only_when_teacher_allows_it(): void
    {
        $world = $this->createSchoolWorld();
        $strict = $this->makeAssignment($world, ['due_at' => now()->subHour(), 'allow_late' => false]);
        $lenient = $this->makeAssignment($world, ['due_at' => now()->subHour(), 'allow_late' => true]);

        Sanctum::actingAs($world['student']);
        $this->postJson("/api/student/assignments/{$strict->id}/submit", ['answer_text' => 'Telat'])
            ->assertStatus(422);

        $this->postJson("/api/student/assignments/{$lenient->id}/submit", ['answer_text' => 'Telat tapi boleh'])
            ->assertOk()
            ->assertJsonPath('data.submission.state', 'late')
            ->assertJsonPath('data.submission.is_late', true);
    }

    public function test_submission_requires_text_or_file_and_graded_work_is_locked(): void
    {
        Storage::fake('public');
        $world = $this->createSchoolWorld();
        $assignment = $this->makeAssignment($world);

        Sanctum::actingAs($world['student']);
        $this->postJson("/api/student/assignments/{$assignment->id}/submit", ['answer_text' => '   '])
            ->assertStatus(422);

        $this->post("/api/student/assignments/{$assignment->id}/submit", [
            'file' => UploadedFile::fake()->create('jawaban.docx', 80, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
        ], ['Accept' => 'application/json'])->assertOk();

        $submission = AssignmentSubmission::where('assignment_id', $assignment->id)->first();
        Storage::disk('public')->assertExists($submission->file_path);

        Sanctum::actingAs($world['teacher']);
        $this->putJson("/api/teacher/assignments/{$assignment->id}/submissions/{$submission->id}", ['score' => 150])
            ->assertStatus(422);
        $this->putJson("/api/teacher/assignments/{$assignment->id}/submissions/{$submission->id}", [
            'score' => 85,
            'feedback' => 'Bagus, perbaiki bagian kesimpulan.',
        ])->assertOk()->assertJsonPath('data.submission.is_graded', true);

        Sanctum::actingAs($world['student']);
        $this->postJson("/api/student/assignments/{$assignment->id}/submit", ['answer_text' => 'Revisi'])
            ->assertStatus(409);
    }

    public function test_teacher_overview_counts_submissions_and_students_not_yet_submitted(): void
    {
        $world = $this->createSchoolWorld();
        $assignment = $this->makeAssignment($world);
        $classmate = User::factory()->murid()->create([
            'school_id' => $world['school']->id,
            'classroom_id' => $world['classroom']->id,
        ]);
        AssignmentSubmission::create([
            'assignment_id' => $assignment->id,
            'user_id' => $world['student']->id,
            'answer_text' => 'Sudah',
            'submitted_at' => now(),
        ]);

        Sanctum::actingAs($world['teacher']);
        $this->getJson("/api/teacher/assignments/{$assignment->id}")
            ->assertOk()
            ->assertJsonPath('data.summary.total_students', 2)
            ->assertJsonPath('data.summary.submitted', 1)
            ->assertJsonPath('data.summary.not_submitted', 1);

        $this->getJson('/api/teacher/assignments')
            ->assertOk()
            ->assertJsonPath('data.assignments.0.student_count', 2)
            ->assertJsonPath('data.assignments.0.submitted_count', 1);

        $this->assertNotNull($classmate->id);
    }

    public function test_student_of_another_classroom_cannot_see_or_submit(): void
    {
        $world = $this->createSchoolWorld();
        $assignment = $this->makeAssignment($world);
        $outsider = $this->createSchoolWorld()["student"];

        Sanctum::actingAs($outsider);
        $this->getJson('/api/student/assignments')
            ->assertOk()
            ->assertJsonCount(0, 'data.assignments');
        $this->getJson("/api/student/assignments/{$assignment->id}")->assertNotFound();
        $this->postJson("/api/student/assignments/{$assignment->id}/submit", ['answer_text' => 'Curang'])
            ->assertNotFound();
    }

    public function test_inactive_assignment_is_hidden_from_student(): void
    {
        $world = $this->createSchoolWorld();
        $assignment = $this->makeAssignment($world, ['is_active' => false]);

        Sanctum::actingAs($world['student']);
        $this->getJson("/api/student/assignments/{$assignment->id}")->assertNotFound();
    }
}
