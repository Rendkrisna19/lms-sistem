<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_update_profile(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->putJson('/api/me/profile', ['name' => 'Nama Baru', 'email' => 'baru@example.com'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Nama Baru')
            ->assertJsonPath('data.email', 'baru@example.com')
            ->assertJsonStructure(['data' => ['id', 'name', 'email', 'role', 'school_id', 'school', 'classroom_id', 'classroom', 'nomor_induk']]);

        $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'Nama Baru', 'email' => 'baru@example.com']);
    }

    public function test_profile_email_must_be_unique(): void
    {
        $other = User::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->putJson('/api/me/profile', ['name' => 'X', 'email' => $other->email])
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    public function test_password_update_requires_correct_current_password(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->putJson('/api/me/password', [
            'current_password' => 'keliru',
            'password' => 'rahasia-baru-123',
            'password_confirmation' => 'rahasia-baru-123',
        ])->assertStatus(422)->assertJsonValidationErrors('current_password');
    }

    public function test_password_update_requires_confirmation_and_min_length(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->putJson('/api/me/password', [
            'current_password' => 'password',
            'password' => 'pendek',
            'password_confirmation' => 'beda',
        ])->assertStatus(422)->assertJsonValidationErrors('password');
    }

    public function test_password_update_revokes_other_tokens_but_keeps_current(): void
    {
        $user = User::factory()->create();
        $current = $user->createToken('current')->plainTextToken;
        $user->createToken('laptop');
        $user->createToken('hp');

        $this->withToken($current)->putJson('/api/me/password', [
            'current_password' => 'password',
            'password' => 'rahasia-baru-123',
            'password_confirmation' => 'rahasia-baru-123',
        ])->assertOk();

        $user->refresh();
        $this->assertTrue(Hash::check('rahasia-baru-123', $user->password));
        $this->assertSame(1, $user->tokens()->count());
        $this->assertSame('current', $user->tokens()->first()->name);
    }
}
