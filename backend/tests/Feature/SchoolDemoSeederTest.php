<?php

namespace Tests\Feature;

use App\Models\Classroom;
use App\Models\School;
use App\Models\User;
use Database\Seeders\SchoolDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Seeder demo: 10 sekolah, masing-masing 20 siswa, dan aman dijalankan berulang.
 */
class SchoolDemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeder_creates_ten_schools_with_twenty_students_each_and_is_idempotent(): void
    {
        $this->seed(SchoolDemoSeeder::class);
        $this->seed(SchoolDemoSeeder::class);

        $this->assertSame(10, School::count());
        foreach (School::all() as $school) {
            $this->assertSame(20, User::where('role', 'murid')->where('school_id', $school->id)->count(), $school->name);
            $this->assertSame(4, User::where('role', 'guru')->where('school_id', $school->id)->count(), $school->name);
            $this->assertSame(2, Classroom::where('school_id', $school->id)->count(), $school->name);
            $this->assertSame(1, User::where('role', 'admin')->where('school_id', $school->id)->count(), $school->name);
        }
    }
}
