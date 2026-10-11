<?php

namespace Tests\Feature;

use App\Models\Lesson;
use App\Models\LessonContent;
use App\Models\StudentLessonProgress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\LmsFixtures;
use Tests\TestCase;

class LessonAccessTest extends TestCase
{
    use LmsFixtures, RefreshDatabase;

    private array $mine;

    private array $other;

    private Lesson $myLesson;

    private Lesson $otherLesson;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mine = $this->createSchoolWorld();
        $this->other = $this->createSchoolWorld();
        $this->myLesson = Lesson::create(['course_id' => $this->mine['course']->id, 'title' => 'Pertemuan 1', 'order_index' => 1]);
        $this->otherLesson = Lesson::create(['course_id' => $this->other['course']->id, 'title' => 'Pertemuan Lain', 'order_index' => 1]);
    }

    public function test_student_only_sees_lessons_of_own_classroom_courses(): void
    {
        Sanctum::actingAs($this->mine['student']);

        $ids = collect($this->getJson('/api/lessons')->assertOk()->json('data'))->pluck('id');
        $this->assertEquals([$this->myLesson->id], $ids->all());

        // filter course_id tidak bisa dipakai untuk menembus batas kelas
        $this->assertCount(0, $this->getJson("/api/lessons?course_id={$this->other['course']->id}")->json('data'));

        $this->getJson("/api/lessons/{$this->otherLesson->id}")->assertNotFound();
        $this->postJson("/api/lessons/{$this->otherLesson->id}/progress")->assertNotFound();

        $this->getJson("/api/lessons/{$this->myLesson->id}")->assertOk();
        $this->postJson("/api/lessons/{$this->myLesson->id}/progress")->assertOk();
        $this->assertDatabaseHas('student_lesson_progress', ['user_id' => $this->mine['student']->id, 'lesson_id' => $this->myLesson->id, 'is_completed' => true]);

        $this->getJson('/api/lessons')->assertJsonPath('data.0.is_completed', true);
    }

    public function test_teacher_show_does_not_write_progress(): void
    {
        Sanctum::actingAs($this->mine['teacher']);

        $this->getJson("/api/lessons/{$this->myLesson->id}")->assertOk()->assertJsonPath('data.progress', null);
        $this->getJson("/api/lessons/{$this->otherLesson->id}")->assertNotFound();
        $this->assertSame(0, StudentLessonProgress::count());
    }

    public function test_teacher_can_only_create_lessons_and_contents_for_own_courses(): void
    {
        Storage::fake('public');
        Sanctum::actingAs($this->mine['teacher']);

        $this->postJson('/api/lessons', ['course_id' => $this->other['course']->id, 'title' => 'Bukan Milik'])
            ->assertStatus(422)->assertJsonValidationErrors('course_id');
        $this->postJson('/api/lessons', ['course_id' => $this->mine['course']->id, 'title' => 'Milik Sendiri'])
            ->assertCreated();

        $this->post("/api/lessons/{$this->otherLesson->id}/contents", [
            'content_type' => 'document',
            'title' => 'Modul',
            'file' => UploadedFile::fake()->create('modul.pdf', 10, 'application/pdf'),
        ], ['Accept' => 'application/json'])->assertNotFound();

        $this->post("/api/lessons/{$this->myLesson->id}/contents", [
            'content_type' => 'audio',
            'title' => 'Audio palsu',
            'file' => UploadedFile::fake()->create('audio.mp3', 10, 'text/html'),
        ], ['Accept' => 'application/json'])->assertStatus(422)->assertJsonValidationErrors('file');

        $this->post("/api/lessons/{$this->myLesson->id}/contents", [
            'content_type' => 'document',
            'title' => 'Modul',
            'file' => UploadedFile::fake()->create('modul.pdf', 10, 'application/pdf'),
        ], ['Accept' => 'application/json'])->assertCreated();

        $content = LessonContent::firstOrFail();
        $this->assertMatchesRegularExpression('#^lessons/documents/[A-Za-z0-9]{40}\.pdf$#', $content->file_path);
    }

    public function test_progress_report_is_scoped_to_teacher(): void
    {
        StudentLessonProgress::create([
            'user_id' => $this->mine['student']->id,
            'lesson_id' => $this->myLesson->id,
            'is_completed' => true,
            'completed_at' => now(),
            'last_accessed_at' => now(),
        ]);
        Lesson::create(['course_id' => $this->mine['course']->id, 'title' => 'Pertemuan 2', 'order_index' => 2]);

        Sanctum::actingAs($this->mine['teacher']);

        $this->getJson('/api/teacher/progress-report')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $this->mine['student']->id)
            ->assertJsonPath('data.0.completed_lessons', 1)
            ->assertJsonPath('data.0.total_lessons', 2)
            ->assertJsonPath('data.0.progress_percentage', 50);
    }
}
