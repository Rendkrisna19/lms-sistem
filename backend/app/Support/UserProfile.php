<?php

namespace App\Support;

use Illuminate\Validation\Rule;

/**
 * Data profil guru dan siswa: pilihan baku, aturan validasi, dan pemetaan nilai.
 * Dipakai oleh form admin, impor Excel, dan ekspor agar aturannya selalu sama.
 */
final class UserProfile
{
    public const GENDERS = ['L' => 'Laki-laki', 'P' => 'Perempuan'];

    public const EDUCATION_LEVELS = ['SD', 'SMP', 'SMA/SMK', 'D3', 'S1', 'S2', 'S3'];

    public const EMPLOYMENT_STATUSES = ['PNS', 'PPPK', 'Tetap Yayasan', 'Kontrak', 'Honorer'];

    /** Field pribadi dan kontak yang dimiliki guru maupun siswa. */
    public const PERSONAL_FIELDS = [
        'gender', 'birth_place', 'birth_date', 'phone', 'city', 'address',
    ];

    public const TEACHER_FIELDS = [
        'education_level', 'education_major', 'employment_status', 'join_date',
    ];

    public const STUDENT_FIELDS = [
        'admission_year', 'previous_school', 'parent_name', 'parent_phone', 'parent_job',
    ];

    /** Aturan validasi untuk seluruh field profil sesuai role (semuanya opsional). */
    public static function rules(string $role): array
    {
        $rules = [
            'gender' => ['nullable', Rule::in(array_keys(self::GENDERS))],
            'birth_place' => ['nullable', 'string', 'max:100'],
            'birth_date' => ['nullable', 'date', 'before:today'],
            'phone' => ['nullable', 'string', 'max:20', 'regex:/^[0-9+\-\s()]+$/'],
            'city' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string', 'max:500'],
        ];

        if ($role === 'guru') {
            return $rules + [
                'education_level' => ['nullable', Rule::in(self::EDUCATION_LEVELS)],
                'education_major' => ['nullable', 'string', 'max:120'],
                'employment_status' => ['nullable', Rule::in(self::EMPLOYMENT_STATUSES)],
                'join_date' => ['nullable', 'date'],
            ];
        }

        return $rules + [
            'admission_year' => ['nullable', 'integer', 'between:2000,2100'],
            'previous_school' => ['nullable', 'string', 'max:150'],
            'parent_name' => ['nullable', 'string', 'max:150'],
            'parent_phone' => ['nullable', 'string', 'max:20', 'regex:/^[0-9+\-\s()]+$/'],
            'parent_job' => ['nullable', 'string', 'max:100'],
        ];
    }

    /** Field profil yang ada di $validated (field yang tidak dikirim tidak ikut diubah). */
    public static function fromValidated(array $validated, string $role): array
    {
        $keys = array_merge(self::PERSONAL_FIELDS, $role === 'guru' ? self::TEACHER_FIELDS : self::STUDENT_FIELDS);

        return array_intersect_key($validated, array_flip($keys));
    }

    /** Label tampilan untuk kode jenis kelamin (L/P). */
    public static function genderLabel(?string $code): ?string
    {
        return $code ? (self::GENDERS[$code] ?? null) : null;
    }

    /** Kode jenis kelamin dari label atau kode yang ditulis di Excel. */
    public static function genderCode(?string $value): ?string
    {
        $needle = strtolower(trim((string) $value));
        if ($needle === '') {
            return null;
        }
        foreach (self::GENDERS as $code => $label) {
            if ($needle === strtolower($code) || $needle === strtolower($label)) {
                return $code;
            }
        }

        return '';
    }
}
