<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\UserPayload;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // Login menggunakan Nomor Induk (NIP untuk Guru, NIS untuk Siswa) atau email
        $request->validate([
            'nomor_induk' => 'required|string|max:255',
            'password' => 'required|string',
        ], [
            'nomor_induk.required' => 'Nomor Induk (NIP / NIS) wajib diisi.',
            'password.required' => 'Kata sandi wajib diisi.',
        ]);

        $identifier = trim($request->input('nomor_induk'));

        // nim_nip hanya dipakai sebagai cadangan untuk akun lama yang belum memiliki nomor_induk
        $user = User::where('nomor_induk', $identifier)
            ->orWhere('email', $identifier)
            ->orWhere(fn ($q) => $q->whereNull('nomor_induk')->where('nim_nip', $identifier))
            ->first();

        // Selalu jalankan pengecekan hash agar waktu respons tidak membocorkan keberadaan akun
        $passwordValid = Hash::check(
            $request->input('password'),
            $user?->password ?? '$2y$10$usesomesillystringfore7hnbRJHxXVLeakoG8K30oukPsA.ztMG'
        );

        if (!$user || !$passwordValid) {
            throw ValidationException::withMessages([
                'nomor_induk' => ['Nomor induk atau kata sandi salah.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Login berhasil.',
            'data' => [
                'user' => UserPayload::make($user),
                'token' => $token,
            ],
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'data' => UserPayload::make($request->user()),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
        ], [
            'name.required' => 'Nama wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email sudah digunakan oleh akun lain.',
        ]);

        $user->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Profil berhasil diperbarui.',
            'data' => UserPayload::make($user->fresh()),
        ]);
    }

    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ], [
            'current_password.required' => 'Kata sandi saat ini wajib diisi.',
            'password.required' => 'Kata sandi baru wajib diisi.',
            'password.min' => 'Kata sandi baru minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi kata sandi baru tidak cocok.',
        ]);

        if (!Hash::check($request->input('current_password'), $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Kata sandi saat ini salah.'],
            ]);
        }

        $user->password = Hash::make($request->input('password'));
        $user->save();

        // Cabut seluruh sesi lain, pertahankan token yang sedang dipakai
        $tokens = $user->tokens();
        $current = $user->currentAccessToken();
        if ($current instanceof PersonalAccessToken) {
            $tokens->where('id', '!=', $current->getKey());
        }
        $tokens->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Kata sandi berhasil diperbarui. Sesi di perangkat lain telah dikeluarkan.',
            'data' => UserPayload::make($user),
        ]);
    }

    public function logout(Request $request)
    {
        $token = $request->user()->currentAccessToken();
        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Logout berhasil.',
        ]);
    }
}
