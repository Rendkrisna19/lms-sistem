<?php

namespace Database\Factories;

use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<School>
 */
class SchoolFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => 'SMA ' . fake()->unique()->city(),
            'npsn' => (string) fake()->unique()->numerify('########'),
            'jenjang' => 'SMA',
            'address' => fake()->address(),
            'phone' => fake()->numerify('0###-#####'),
            'email' => fake()->unique()->safeEmail(),
            'status' => 'active',
        ];
    }
}
