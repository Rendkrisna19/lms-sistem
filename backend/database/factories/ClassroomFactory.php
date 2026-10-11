<?php

namespace Database\Factories;

use App\Models\Classroom;
use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Classroom>
 */
class ClassroomFactory extends Factory
{
    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'name' => 'Kelas ' . fake()->unique()->bothify('?? - ##'),
            'code' => strtoupper(fake()->unique()->bothify('??-###')),
            'homeroom_teacher_id' => null,
            'academic_year' => '2026/2027',
        ];
    }
}
