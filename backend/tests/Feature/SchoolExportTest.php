<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\LmsFixtures;
use Tests\TestCase;

/**
 * Ekspor daftar sekolah hanya untuk admin master.
 */
class SchoolExportTest extends TestCase
{
    use LmsFixtures, RefreshDatabase;

    public function test_master_can_export_schools_as_xlsx_and_pdf(): void
    {
        $world = $this->createSchoolWorld();
        Sanctum::actingAs(\App\Models\User::factory()->masterAdmin()->create());

        $this->postJson('/api/admin/schools/export', ['format' => 'xlsx', 'ids' => [$world['school']->id]])
            ->assertOk()
            ->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        $this->postJson('/api/admin/schools/export', ['format' => 'pdf'])
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_school_admin_cannot_export_schools(): void
    {
        $world = $this->createSchoolWorld();
        Sanctum::actingAs($world['admin']);

        $this->postJson('/api/admin/schools/export', ['format' => 'xlsx'])->assertForbidden();
    }
}
