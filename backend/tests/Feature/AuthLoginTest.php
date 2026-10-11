<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\LmsFixtures;
use Tests\TestCase;

class AuthLoginTest extends TestCase
{
    use LmsFixtures, RefreshDatabase;

    private const GENERIC_ERROR = 'Nomor induk atau kata sandi salah.';

    public function test_login_with_nomor_induk_returns_normalized_user_and_token(): void
    {
        $world = $this->createSchoolWorld();
        $student = $world['student'];

        $response = $this->postJson('/api/login', [
            'nomor_induk' => $student->nomor_induk,
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'data' => [
                    'user' => ['id', 'name', 'email', 'role', 'school_id', 'school' => ['id', 'name', 'npsn'], 'classroom_id', 'classroom' => ['id', 'name', 'code'], 'nomor_induk'],
                    'token',
                ],
            ])
            ->assertJsonPath('data.user.id', $student->id)
            ->assertJsonPath('data.user.classroom.id', $world['classroom']->id)
            ->assertJsonMissingPath('data.user.password');
    }

    public function test_login_with_email_works(): void
    {
        $user = User::factory()->guru()->create();

        $this->postJson('/api/login', ['nomor_induk' => $user->email, 'password' => 'password'])
            ->assertOk()
            ->assertJsonPath('data.user.school', null)
            ->assertJsonPath('data.user.classroom', null);
    }

    public function test_unknown_user_and_wrong_password_return_the_same_generic_error(): void
    {
        $user = User::factory()->create();

        $unknown = $this->postJson('/api/login', ['nomor_induk' => 'TIDAKADA', 'password' => 'password']);
        $wrongPassword = $this->postJson('/api/login', ['nomor_induk' => $user->nomor_induk, 'password' => 'salah-sekali']);

        foreach ([$unknown, $wrongPassword] as $response) {
            $response->assertStatus(422)
                ->assertJsonPath('errors.nomor_induk.0', self::GENERIC_ERROR)
                ->assertJsonMissingPath('errors.password');
        }
    }

    public function test_nim_nip_only_matches_when_nomor_induk_is_empty(): void
    {
        $legacy = User::factory()->create(['nomor_induk' => null, 'nim_nip' => 'LEGACY01']);
        User::factory()->create(['nomor_induk' => 'REAL01', 'nim_nip' => 'SHADOW01']);

        $this->postJson('/api/login', ['nomor_induk' => 'LEGACY01', 'password' => 'password'])
            ->assertOk()
            ->assertJsonPath('data.user.id', $legacy->id);

        $this->postJson('/api/login', ['nomor_induk' => 'SHADOW01', 'password' => 'password'])
            ->assertStatus(422);
    }

    public function test_sixth_failed_login_attempt_is_throttled(): void
    {
        $user = User::factory()->create();

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', ['nomor_induk' => $user->nomor_induk, 'password' => 'salah'])
                ->assertStatus(422);
        }

        $this->postJson('/api/login', ['nomor_induk' => $user->nomor_induk, 'password' => 'salah'])
            ->assertStatus(429);
    }

    public function test_me_returns_normalized_payload(): void
    {
        $world = $this->createSchoolWorld();
        $token = $world['teacher']->createToken('test')->plainTextToken;

        $this->withToken($token)->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('data.id', $world['teacher']->id)
            ->assertJsonPath('data.role', 'guru')
            ->assertJsonPath('data.school.id', $world['school']->id)
            ->assertJsonPath('data.classroom', null)
            ->assertJsonPath('data.nomor_induk', $world['teacher']->nomor_induk);
    }
}
