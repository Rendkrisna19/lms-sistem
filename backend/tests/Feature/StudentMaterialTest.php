<?php

namespace Tests\Feature;

use App\Models\MaterialAccess;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\LmsFixtures;
use Tests\TestCase;

class StudentMaterialTest extends TestCase
{
    use LmsFixtures, RefreshDatabase;

    public function test_student_only_sees_active_unexpired_materials_of_own_classroom(): void
    {
        $world = $this->createSchoolWorld();
        $other = $this->createSchoolWorld();

        $visible = $this->createMaterial($world);
        $this->createMaterial($world, ['is_active' => false]);
        $this->createMaterial($world, ['expires_at' => now()->subDay()]);
        $foreign = $this->createMaterial($other);

        Sanctum::actingAs($world['student']);

        $response = $this->getJson('/api/student/materials')
            ->assertOk()
            ->assertJsonPath('data.classroom.id', $world['classroom']->id);

        $ids = collect($response->json('data.materials'))->pluck('id');
        $this->assertEquals([$visible->id], $ids->all());
        $this->assertNotContains($foreign->id, $ids);
    }

    public function test_student_without_classroom_gets_empty_list(): void
    {
        $world = $this->createSchoolWorld();
        $world['student']->update(['classroom_id' => null]);
        $this->createMaterial($world);

        Sanctum::actingAs($world['student']->fresh());

        $this->getJson('/api/student/materials')
            ->assertOk()
            ->assertJsonPath('data.classroom', null)
            ->assertJsonCount(0, 'data.materials');
    }

    public function test_record_access_for_other_classroom_material_is_not_found(): void
    {
        $world = $this->createSchoolWorld();
        $other = $this->createSchoolWorld();
        $foreign = $this->createMaterial($other);
        $inactive = $this->createMaterial($world, ['is_active' => false]);

        Sanctum::actingAs($world['student']);

        $this->postJson("/api/student/materials/{$foreign->id}/access")->assertNotFound();
        $this->postJson("/api/student/materials/{$inactive->id}/access")->assertNotFound();
        $this->assertSame(0, MaterialAccess::count());
    }

    public function test_record_access_logs_once_per_five_minutes(): void
    {
        $world = $this->createSchoolWorld();
        $material = $this->createMaterial($world, ['content_type' => 'video']);
        Sanctum::actingAs($world['student']);

        $this->postJson("/api/student/materials/{$material->id}/access")
            ->assertOk()
            ->assertExactJson(['status' => 'success']);
        $this->postJson("/api/student/materials/{$material->id}/access")->assertOk();

        $this->assertSame(1, MaterialAccess::count());
        $this->assertDatabaseHas('material_accesses', [
            'user_id' => $world['student']->id,
            'learning_material_id' => $material->id,
            'content_type' => 'video',
        ]);

        $this->travel(6)->minutes();
        $this->postJson("/api/student/materials/{$material->id}/access")->assertOk();
        $this->assertSame(2, MaterialAccess::count());
    }

    public function test_teacher_cannot_record_access(): void
    {
        $world = $this->createSchoolWorld();
        $material = $this->createMaterial($world);
        Sanctum::actingAs($world['teacher']);

        $this->postJson("/api/student/materials/{$material->id}/access")->assertForbidden();
    }
}
