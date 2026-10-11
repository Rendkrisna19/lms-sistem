<?php

namespace Database\Factories;

use App\Models\ClassSubjectAssignment;
use App\Models\Classroom;
use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ClassSubjectAssignment>
 */
class ClassSubjectAssignmentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'classroom_id' => Classroom::factory(),
            'course_id' => Course::factory(),
            'teacher_id' => User::factory()->guru(),
            'schedule_day' => 'Senin',
            'schedule_time' => '08:00 - 10:00',
            'room' => 'Ruang ' . fake()->numberBetween(1, 30),
        ];
    }
}
