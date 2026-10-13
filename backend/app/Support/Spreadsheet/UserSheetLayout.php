<?php

namespace App\Support\Spreadsheet;

use App\Models\User;
use App\Support\UserProfile;

/**
 * Sumber tunggal kolom berkas Excel untuk data guru dan siswa.
 * Template, impor, dan ekspor memakai definisi yang sama agar berkas yang diunduh bisa langsung diimpor kembali.
 *
 * Tipe kolom:
 * - text: teks biasa · identifier: NIP/NIS (teks, tanpa notasi ilmiah) · date: tanggal yyyy-mm-dd
 * - select: pilihan tetap (dropdown) · classroom: pilihan kode kelas sekolah (dropdown) · number: angka bulat
 */
final class UserSheetLayout
{
    public const ROLE_TEACHER = 'guru';
    public const ROLE_STUDENT = 'murid';

    /** Kolom yang tidak diekspor (kata sandi). */
    private const SECRET_KEYS = ['password'];

    public static function for(string $role): array
    {
        $identifierLabel = $role === self::ROLE_TEACHER ? 'NIP' : 'NIS';

        $personal = [
            ['key' => 'gender', 'header' => 'Jenis Kelamin', 'type' => 'select', 'options' => array_values(UserProfile::GENDERS), 'width' => 16, 'example' => 'Laki-laki'],
            ['key' => 'birth_place', 'header' => 'Tempat Lahir', 'type' => 'text', 'width' => 20, 'example' => 'Medan'],
            ['key' => 'birth_date', 'header' => 'Tanggal Lahir', 'type' => 'date', 'width' => 16, 'example' => '1985-07-15'],
            ['key' => 'phone', 'header' => 'No. Telepon', 'type' => 'identifier', 'width' => 18, 'example' => '081234567890'],
            ['key' => 'city', 'header' => 'Kota/Kabupaten', 'type' => 'text', 'width' => 22, 'example' => 'Batu Bara'],
            ['key' => 'address', 'header' => 'Alamat Lengkap', 'type' => 'text', 'width' => 44, 'example' => 'Jl. Merdeka No. 12, RT 02/RW 03'],
        ];

        $base = [
            ['key' => 'name', 'header' => 'Nama Lengkap', 'required' => true, 'type' => 'text', 'width' => 30, 'example' => 'Budi Santoso, S.Pd.'],
            ['key' => 'nomor_induk', 'header' => $identifierLabel, 'required' => true, 'type' => 'identifier', 'width' => 20, 'example' => $role === self::ROLE_TEACHER ? '198507152010122001' : '20241001'],
            ['key' => 'email', 'header' => 'Email', 'required' => true, 'type' => 'text', 'width' => 32, 'example' => 'budi.santoso@sekolah.sch.id'],
            ['key' => 'password', 'header' => 'Kata Sandi', 'required' => true, 'type' => 'text', 'width' => 18, 'example' => 'rahasia123'],
        ];

        if ($role === self::ROLE_TEACHER) {
            return [
                'role' => self::ROLE_TEACHER,
                'label' => 'Guru',
                'sheet' => 'Data Guru',
                'file' => 'Template_Data_Guru',
                'identifier' => 'NIP',
                'columns' => array_merge($base, $personal, [
                    ['key' => 'education_level', 'header' => 'Pendidikan Terakhir', 'type' => 'select', 'options' => UserProfile::EDUCATION_LEVELS, 'width' => 18, 'example' => 'S1'],
                    ['key' => 'education_major', 'header' => 'Jurusan / Program Studi', 'type' => 'text', 'width' => 30, 'example' => 'Pendidikan Informatika'],
                    ['key' => 'employment_status', 'header' => 'Status Kepegawaian', 'type' => 'select', 'options' => UserProfile::EMPLOYMENT_STATUSES, 'width' => 20, 'example' => 'PNS'],
                    ['key' => 'join_date', 'header' => 'Tanggal Bergabung', 'type' => 'date', 'width' => 18, 'example' => '2010-07-01'],
                ]),
            ];
        }

        return [
            'role' => self::ROLE_STUDENT,
            'label' => 'Siswa',
            'sheet' => 'Data Siswa',
            'file' => 'Template_Data_Siswa',
            'identifier' => 'NIS',
            'columns' => array_merge($base, [
                ['key' => 'classroom_code', 'header' => 'Kode Kelas', 'type' => 'classroom', 'width' => 16, 'example' => 'X-IPA-1'],
            ], $personal, [
                ['key' => 'admission_year', 'header' => 'Tahun Masuk', 'type' => 'number', 'width' => 14, 'example' => '2024'],
                ['key' => 'previous_school', 'header' => 'Asal Sekolah', 'type' => 'text', 'width' => 30, 'example' => 'SMP Negeri 2 Lima Puluh'],
                ['key' => 'parent_name', 'header' => 'Nama Orang Tua/Wali', 'type' => 'text', 'width' => 26, 'example' => 'Siti Rahmawati'],
                ['key' => 'parent_phone', 'header' => 'No. HP Orang Tua', 'type' => 'identifier', 'width' => 18, 'example' => '081298765432'],
                ['key' => 'parent_job', 'header' => 'Pekerjaan Orang Tua', 'type' => 'text', 'width' => 22, 'example' => 'Wiraswasta'],
            ]),
        ];
    }

    /** Kolom yang boleh diekspor: semua kecuali kata sandi. */
    public static function exportColumns(string $role): array
    {
        return array_values(array_filter(
            self::for($role)['columns'],
            fn (array $column) => !in_array($column['key'], self::SECRET_KEYS, true)
        ));
    }

    /** Nilai satu baris untuk ekspor, dalam bentuk yang mudah dibaca dan bisa diimpor kembali. */
    public static function valuesFor(User $user, string $role): array
    {
        return [
            'name' => $user->name,
            'nomor_induk' => $user->nomor_induk ?? $user->nim_nip,
            'email' => $user->email,
            'classroom_code' => $user->classroom?->code,
            'gender' => UserProfile::genderLabel($user->gender),
            'birth_place' => $user->birth_place,
            'birth_date' => $user->birth_date?->format('Y-m-d'),
            'phone' => $user->phone,
            'city' => $user->city,
            'address' => $user->address,
            'education_level' => $user->education_level,
            'education_major' => $user->education_major,
            'employment_status' => $user->employment_status,
            'join_date' => $user->join_date?->format('Y-m-d'),
            'admission_year' => $user->admission_year,
            'previous_school' => $user->previous_school,
            'parent_name' => $user->parent_name,
            'parent_phone' => $user->parent_phone,
            'parent_job' => $user->parent_job,
        ];
    }

    /** Nama header ternormalisasi (huruf kecil, tanpa tanda bintang) untuk pencocokan saat impor. */
    public static function normalizeHeader(?string $header): string
    {
        $clean = str_replace('*', '', (string) $header);

        return strtolower(trim(preg_replace('/\s+/', ' ', $clean)));
    }
}
