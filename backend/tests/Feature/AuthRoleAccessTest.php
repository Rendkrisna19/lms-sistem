<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\LmsFixtures;
use Tests\TestCase;

class AuthRoleAccessTest extends TestCase
{
    use LmsFixtures, RefreshDatabase;

    public function test_guest_gets_401(): void
    {
        $this->getJson('/api/me')->assertStatus(401);
        $this->getJson('/api/student/overview')->assertStatus(401);
    }

    public function test_student_is_forbidden_from_teacher_admin_and_master_routes(): void
    {
        $world = $this->createSchoolWorld();
        Sanctum::actingAs($world['student']);

        foreach (['/api/teacher/overview', '/api/teacher/materials', '/api/admin/teachers', '/api/school-admin/overview', '/api/master/overview', '/api/admin/schools'] as $uri) {
            $this->getJson($uri)->assertStatus(403);
        }
    }

    public function test_teacher_is_forbidden_from_school_management_and_student_routes(): void
    {
        $world = $this->createSchoolWorld();
        Sanctum::actingAs($world['teacher']);

        $this->getJson('/api/admin/schools')->assertStatus(403);
        $this->postJson('/api/admin/schools', ['name' => 'X'])->assertStatus(403);
        $this->getJson('/api/admin/teachers')->assertStatus(403);
        $this->getJson('/api/student/grades')->assertStatus(403);
    }

    public function test_school_admin_cannot_manage_schools(): void
    {
        $world = $this->createSchoolWorld();
        Sanctum::actingAs($world['admin']);

        $this->getJson('/api/admin/schools')->assertStatus(403);
        $this->getJson('/api/master/overview')->assertStatus(403);
    }

    public function test_school_admin_without_school_gets_403(): void
    {
        Sanctum::actingAs(User::factory()->schoolAdmin()->create(['school_id' => null]));

        $this->getJson('/api/admin/teachers')->assertStatus(403);
    }
}
