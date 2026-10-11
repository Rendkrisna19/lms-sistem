<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // Login menggunakan Nomor Induk (NIP untuk Guru, NIS untuk Siswa)
        $request->validate([
            'nomor_induk' => 'required|string',
            'password' => 'required|string',
        ], [
            'nomor_induk.required' => 'Nomor Induk (NIP / NIS) wajib diisi.',
            'password.required' => 'Kata sandi wajib diisi.',
        ]);

        $identifier = trim($request->input('nomor_induk'));

        // Mencari pengguna berdasarkan nomor_induk (NIP/NIS), nim_nip, atau email
        $user = User::where('nomor_induk', $identifier)
            ->orWhere('nim_nip', $identifier)
            ->orWhere('email', $identifier)
            ->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'nomor_induk' => ['Nomor Induk (NIP / NIS / ID Admin) tidak terdaftar dalam sistem Cendekia.'],
            ]);
        }

        if (!Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['Kata sandi yang Anda masukkan salah. Mohon periksa kembali.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;
        $user->load('school');

        return response()->json([
            'status' => 'success',
            'message' => 'Login berhasil.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'school_id' => $user->school_id,
                    'school' => $user->school,
                    'nomor_induk' => $user->nomor_induk ?? $user->nim_nip,
                    'nim_nip' => $user->nim_nip,
                ],
                'token' => $token,
            ]
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'data' => $request->user()->load(['school', 'classroom']),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Logout berhasil.',
        ]);
    }
}
