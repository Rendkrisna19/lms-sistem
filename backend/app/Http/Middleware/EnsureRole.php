<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Membatasi akses route berdasarkan role pengguna.
 * Contoh pemakaian: ->middleware('role:guru') atau ->middleware('role:admin,admin_master')
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Sesi login tidak ditemukan. Silakan masuk kembali.',
            ], 401);
        }

        if (!in_array($user->role, $roles, true)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda tidak memiliki hak akses untuk fitur ini.',
            ], 403);
        }

        return $next($request);
    }
}
