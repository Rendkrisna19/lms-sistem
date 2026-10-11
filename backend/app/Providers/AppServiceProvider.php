<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Batas umum seluruh endpoint API (per pengguna, atau per IP jika belum login)
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(240)->by($request->user()?->id ?: $request->ip());
        });

        // Batas percobaan login untuk mencegah brute-force (per nomor induk + IP)
        RateLimiter::for('login', function (Request $request) {
            $identifier = strtolower(trim((string) $request->input('nomor_induk')));

            return [
                Limit::perMinute(5)->by($identifier . '|' . $request->ip())->response(function () {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Terlalu banyak percobaan login. Silakan coba lagi dalam 1 menit.',
                    ], 429);
                }),
                Limit::perMinute(30)->by($request->ip()),
            ];
        });
    }
}
