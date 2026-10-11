<?php

namespace Tests\Feature;

use App\Models\Classroom;
use App\Models\LearningMaterial;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\LmsFixtures;
use Tests\TestCase;

class TeacherMaterialTest extends TestCase
{
    use LmsFixtures, RefreshDatabase;

    private array $world;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        $this->world = $this->createSchoolWorld();
    }

    private function teacherB(): User
    {
        return User::factory()->guru()->create(['school_id' => $this->world['school']->id]);
    }

    public function test_x_teacher_id_header_and_param_are_ignored(): void
    {
        $teacherB = $this->teacherB();
        $mine = $this->createMaterial($this->world);
        $theirs = $this->createMaterial($this->world, ['teacher_id' => $teacherB->id]);

        Sanctum::actingAs($this->world['teacher']);

        $response = $this->withHeader('X-Teacher-Id', (string) $teacherB->id)
            ->getJson("/api/teacher/materials?teacher_id={$teacherB->id}")
            ->assertOk()
            ->assertJsonPath('data.teacher.id', $this->world['teacher']->id)
            ->assertJsonPath('data.summary.total', 1);

        $ids = collect($response->json('data.materials'))->pluck('id');
        $this->assertTrue($ids->contains($mine->id));
        $this->assertFalse($ids->contains($theirs->id));

        $this->withHeader('X-Teacher-Id', (string) $teacherB->id)
            ->getJson('/api/teacher/overview')
            ->assertOk()
            ->assertJsonPath('data.teacher.id', $this->world['teacher']->id);
    }

    public function test_store_requires_teacher_assignment_for_classroom_and_course(): void
    {
        $otherClass = Classroom::factory()->create(['school_id' => $this->world['school']->id]);
        Sanctum::actingAs($this->world['teacher']);

        $this->post('/api/teacher/materials', [
            'classroom_id' => $otherClass->id,
            'course_id' => $this->world['course']->id,
            'title' => 'Tidak Boleh',
            'content_type' => 'document',
            'file' => UploadedFile::fake()->create('modul.pdf', 100, 'application/pdf'),
        ], ['Accept' => 'application/json'])->assertStatus(422)->assertJsonValidationErrors('classroom_id');

        $this->assertSame(0, LearningMaterial::count());
    }

    public function test_store_pdf_uses_random_filename_and_safe_extension(): void
    {
        Sanctum::actingAs($this->world['teacher']);

        $response = $this->post('/api/teacher/materials', [
            'classroom_id' => $this->world['classroom']->id,
            'course_id' => $this->world['course']->id,
            'title' => 'Modul 1',
            'content_type' => 'document',
            'is_active' => 'true',
            'file' => UploadedFile::fake()->create('Modul Saya.pdf', 200, 'application/pdf'),
        ], ['Accept' => 'application/json'])->assertCreated();

        $material = LearningMaterial::firstOrFail();
        $this->assertSame($this->world['teacher']->id, $material->teacher_id);
        $this->assertSame($this->world['school']->id, $material->school_id);
        $this->assertSame('Modul Saya.pdf', $material->file_name_original);
        $this->assertMatchesRegularExpression('#^materials/documents/[A-Za-z0-9]{40}\.pdf$#', $material->file_path);
        Storage::disk('public')->assertExists($material->file_path);
        $response->assertJsonPath('data.is_active', true);
    }

    public function test_store_rejects_html_disguised_as_pdf_and_oversized_files(): void
    {
        Sanctum::actingAs($this->world['teacher']);
        $base = [
            'classroom_id' => $this->world['classroom']->id,
            'course_id' => $this->world['course']->id,
            'title' => 'Berbahaya',
        ];

        $this->post('/api/teacher/materials', $base + [
            'content_type' => 'document',
            'file' => UploadedFile::fake()->create('evil.pdf', 1, 'text/html'),
        ], ['Accept' => 'application/json'])->assertStatus(422)->assertJsonValidationErrors('file');

        $this->post('/api/teacher/materials', $base + [
            'content_type' => 'document',
            'file' => UploadedFile::fake()->create('gambar.svg', 1, 'image/svg+xml'),
        ], ['Accept' => 'application/json'])->assertStatus(422)->assertJsonValidationErrors('file');

        $this->post('/api/teacher/materials', $base + [
            'content_type' => 'audio',
            'file' => UploadedFile::fake()->create('besar.mp3', 51201, 'audio/mpeg'),
        ], ['Accept' => 'application/json'])->assertStatus(422)->assertJsonValidationErrors('file');

        $this->post('/api/teacher/materials', $base + [
            'content_type' => 'video',
            'video_source_type' => 'upload',
            'file' => UploadedFile::fake()->create('video.mov', 100, 'video/quicktime'),
        ], ['Accept' => 'application/json'])->assertStatus(422)->assertJsonValidationErrors('file');

        $this->assertSame(0, LearningMaterial::count());
    }

    public function test_store_video_link_requires_url(): void
    {
        Sanctum::actingAs($this->world['teacher']);
        $base = [
            'classroom_id' => $this->world['classroom']->id,
            'course_id' => $this->world['course']->id,
            'title' => 'Video',
            'content_type' => 'video',
            'video_source_type' => 'youtube',
        ];

        $this->postJson('/api/teacher/materials', $base)->assertStatus(422)->assertJsonValidationErrors('external_url');
        $this->postJson('/api/teacher/materials', $base + ['external_url' => 'javascript:alert(1)'])->assertStatus(422);
        $this->postJson('/api/teacher/materials', $base + ['external_url' => 'https://www.youtube.com/watch?v=abc'])->assertCreated();
    }

    public function test_toggle_and_destroy_only_own_materials(): void
    {
        $theirs = $this->createMaterial($this->world, ['teacher_id' => $this->teacherB()->id]);
        $mine = $this->createMaterial($this->world);
        Sanctum::actingAs($this->world['teacher']);

        $this->patchJson("/api/teacher/materials/{$theirs->id}/toggle-status")->assertNotFound();
        $this->deleteJson("/api/teacher/materials/{$theirs->id}")->assertNotFound();
        $this->assertDatabaseHas('learning_materials', ['id' => $theirs->id, 'is_active' => true]);

        $this->patchJson("/api/teacher/materials/{$mine->id}/toggle-status")->assertOk()->assertJsonPath('data.is_active', false);
        $this->deleteJson("/api/teacher/materials/{$mine->id}")->assertOk();
        $this->assertDatabaseMissing('learning_materials', ['id' => $mine->id]);
    }
}
