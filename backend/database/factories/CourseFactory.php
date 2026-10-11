<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\School;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Course>
 */
class CourseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'title' => 'Mapel ' . fake()->unique()->words(2, true),
            'description' => fake()->sentence(),
            'instructor_id' => fn (array $attributes) => User::factory()->guru()->create([
                'school_id' => $attributes['school_id'],
            ])->id,
        ];
    }
}
