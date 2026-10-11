<?php

namespace Database\Factories;

use App\Models\LearningMaterial;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Gunakan bersama ->for*() / atribut eksplisit: teacher_id, classroom_id, course_id, school_id.
 *
 * @extends Factory<LearningMaterial>
 */
class LearningMaterialFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => 'Materi ' . fake()->unique()->words(3, true),
            'description' => fake()->sentence(),
            'content_type' => 'document',
            'file_path' => 'materials/documents/' . fake()->uuid() . '.pdf',
            'file_name_original' => 'modul.pdf',
            'file_size_bytes' => 1024,
            'is_active' => true,
            'expires_at' => null,
        ];
    }

    public function ofType(string $contentType): static
    {
        return $this->state(fn () => ['content_type' => $contentType]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }

    public function expired(): static
    {
        return $this->state(fn () => ['expires_at' => now()->subDay()]);
    }
}
