<?php

namespace Database\Seeders;

use App\Models\Classroom;
use App\Models\ClassSubjectAssignment;
use App\Models\Course;
use App\Models\School;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Data demo 10 sekolah. Setiap sekolah memiliki admin, 4 guru, 2 kelas, 3 mata pelajaran,
 * dan tepat 20 siswa. Seeder ini idempotent: aman dijalankan berulang tanpa membuat duplikat.
 *
 * Kata sandi seluruh akun demo: password123
 */
class SchoolDemoSeeder extends Seeder
{
    private const PASSWORD = 'password123';

    private const FIRST_NAMES = [
        'Ahmad', 'Siti', 'Budi', 'Dewi', 'Rizky', 'Nadia', 'Fajar', 'Putri', 'Rafi', 'Ayu',
        'Eko', 'Sari', 'Dimas', 'Lia', 'Hendra', 'Mega', 'Yoga', 'Tiara', 'Bagas', 'Intan',
        'Andi', 'Rina', 'Yusuf', 'Maya', 'Farhan', 'Aulia', 'Taufik', 'Winda', 'Galih', 'Nisa',
        'Irfan', 'Dinda', 'Reza', 'Fitri', 'Adi', 'Yuni', 'Kevin', 'Salsa', 'Dwi', 'Citra',
    ];

    private const LAST_NAMES = [
        'Pratama', 'Lestari', 'Aisyah', 'Hidayat', 'Saputra', 'Wulandari', 'Siregar', 'Nasution', 'Harahap', 'Simanjuntak',
        'Tanjung', 'Rangkuti', 'Hasibuan', 'Sinaga', 'Purba', 'Ginting', 'Pane', 'Tarigan', 'Situmorang', 'Nainggolan',
        'Lubis', 'Sembiring', 'Matondang', 'Batubara', 'Setiawan', 'Permata', 'Ramadhan', 'Anggraini', 'Kusuma', 'Wibowo',
    ];

    private const TEACHER_TITLES = ['S.Pd.', 'M.Pd.', 'S.Kom.', 'S.T.', 'M.Cs.', 'S.Si.'];

    /** Dua sekolah pertama sudah ada di DatabaseSeeder; sisanya dibuat di sini. */
    private const SCHOOLS = [
        ['name' => 'SMA Mitra Inalum', 'npsn' => '10203040', 'jenjang' => 'SMA', 'city' => 'Batu Bara', 'address' => 'Komp. Perumahan Inalum, Tanjung Gading, Batu Bara', 'phone' => '0622-31311'],
        ['name' => 'SMA NEGERI 1 SESI SUKA', 'npsn' => '323213213', 'jenjang' => 'SMA', 'city' => 'Batu Bara', 'address' => 'Jl. Pendidikan, Sesi Suka, Batu Bara', 'phone' => '0622-40111'],
        ['name' => 'SMA Negeri 3 Lima Puluh', 'npsn' => '10100301', 'jenjang' => 'SMA', 'city' => 'Batu Bara', 'address' => 'Jl. Lintas Sumatera, Lima Puluh, Batu Bara', 'phone' => '0622-41201'],
        ['name' => 'SMA Swasta Teladan Sei Rampah', 'npsn' => '10100302', 'jenjang' => 'SMA', 'city' => 'Serdang Bedagai', 'address' => 'Jl. Raya Sei Rampah, Serdang Bedagai', 'phone' => '0623-41055'],
        ['name' => 'SMK Negeri 2 Tanjung Morawa', 'npsn' => '10100303', 'jenjang' => 'SMK', 'city' => 'Deli Serdang', 'address' => 'Jl. Medan-Tanjung Morawa Km 12', 'phone' => '061-7951234'],
        ['name' => 'SMK Prima Medan', 'npsn' => '10100304', 'jenjang' => 'SMK', 'city' => 'Medan', 'address' => 'Jl. Pancing, Medan Selayang', 'phone' => '061-8451122'],
        ['name' => 'SMA Harapan Bangsa Kisaran', 'npsn' => '10100305', 'jenjang' => 'SMA', 'city' => 'Asahan', 'address' => 'Jl. Imam Bonjol, Kisaran, Asahan', 'phone' => '0623-41877'],
        ['name' => 'SMK Bina Teknik Labuhan Batu', 'npsn' => '10100306', 'jenjang' => 'SMK', 'city' => 'Labuhan Batu', 'address' => 'Jl. Sudirman, Rantau Prapat, Labuhan Batu', 'phone' => '0624-21933'],
        ['name' => 'SMA Negeri 1 Pematang Siantar', 'npsn' => '10100307', 'jenjang' => 'SMA', 'city' => 'Pematang Siantar', 'address' => 'Jl. Merdeka No. 9, Pematang Siantar', 'phone' => '0622-22102'],
        ['name' => 'SMK Negeri 1 Rantau Prapat', 'npsn' => '10100308', 'jenjang' => 'SMK', 'city' => 'Labuhan Batu', 'address' => 'Jl. Ahmad Yani, Rantau Prapat', 'phone' => '0624-22450'],
    ];

    /** Mata pelajaran per jenjang. */
    private const COURSES = [
        'SMA' => [['Matematika', 'Matematika wajib kelas X'], ['Bahasa Indonesia', 'Bahasa dan sastra Indonesia'], ['Fisika', 'Dasar-dasar fisika']],
        'SMK' => [['Pemrograman Dasar', 'Algoritma dan pemrograman dasar'], ['Jaringan Komputer', 'Dasar jaringan dan perangkat'], ['Basis Data', 'Perancangan basis data relasional']],
    ];

    private const CLASSROOMS = [
        'SMA' => [['X IPA 1', 'X-IPA-1'], ['X IPA 2', 'X-IPA-2']],
        'SMK' => [['X TKJ 1', 'X-TKJ-1'], ['X TKJ 2', 'X-TKJ-2']],
    ];

    private const SCHEDULE_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    private const TIME_SLOTS = ['07:30 - 09:00', '09:15 - 10:45', '11:00 - 12:30', '13:15 - 14:45'];

    private const STUDENTS_PER_SCHOOL = 20;
    private const TEACHERS_PER_SCHOOL = 4;

    public function run(): void
    {
        $passwordHash = Hash::make(self::PASSWORD);

        foreach (self::SCHOOLS as $index => $definition) {
            $number = $index + 1;
            $school = School::updateOrCreate(['npsn' => $definition['npsn']], [
                'name' => $definition['name'],
                'jenjang' => $definition['jenjang'],
                'address' => $definition['address'],
                'phone' => $definition['phone'],
                'email' => 'info@' . Str::slug($definition['name']) . '.sch.id',
                'status' => 'active',
            ]);

            $this->ensureAdmin($school, $number, $passwordHash);
            $teachers = $this->ensureTeachers($school, $number, $passwordHash);
            $classrooms = $this->ensureClassrooms($school, $teachers);
            $courses = $this->ensureCourses($school, $teachers);
            $this->ensureAssignments($classrooms, $courses, $teachers);
            $this->ensureStudents($school, $number, $classrooms, $passwordHash);
        }
    }

    private function ensureAdmin(School $school, int $number, string $passwordHash): void
    {
        if (User::where('role', 'admin')->where('school_id', $school->id)->exists()) {
            return;
        }

        User::updateOrCreate(['email' => "admin.{$number}@" . $this->domain($school)], [
            'name' => 'Admin ' . $school->name,
            'nomor_induk' => sprintf('ADM%010d', $school->npsn),
            'nim_nip' => sprintf('ADM%010d', $school->npsn),
            'password' => $passwordHash,
            'role' => 'admin',
            'school_id' => $school->id,
        ]);
    }

    /** @return list<User> */
    private function ensureTeachers(School $school, int $number, string $passwordHash): array
    {
        $teachers = [];
        for ($t = 1; $t <= self::TEACHERS_PER_SCHOOL; $t++) {
            $first = self::FIRST_NAMES[($number * 3 + $t * 5) % count(self::FIRST_NAMES)];
            $last = self::LAST_NAMES[($number * 7 + $t * 11) % count(self::LAST_NAMES)];
            $title = self::TEACHER_TITLES[($number + $t) % count(self::TEACHER_TITLES)];
            $nip = sprintf('19%02d%02d%010d', $number, $t, $number * 100 + $t);

            $teachers[] = User::updateOrCreate(['email' => Str::slug("{$first}.{$last}.{$number}{$t}") . '@' . $this->domain($school)], [
                'name' => "{$first} {$last}, {$title}",
                'nomor_induk' => $nip,
                'nim_nip' => $nip,
                'password' => $passwordHash,
                'role' => 'guru',
                'school_id' => $school->id,
                'gender' => ($t % 2) ? 'L' : 'P',
                'birth_place' => $school->city ?? 'Medan',
                'birth_date' => now()->subYears(30 + $t * 3)->subMonths($number)->toDateString(),
                'phone' => '0812' . sprintf('%08d', $number * 1000 + $t),
                'city' => $school->city ?? 'Medan',
                'address' => "Jl. Guru No. {$t}, {$school->city}",
                'education_level' => ['S1', 'S2', 'S1', 'D3'][$t - 1],
                'education_major' => ['Pendidikan Matematika', 'Pendidikan Bahasa', 'Teknik Informatika', 'Manajemen Pendidikan'][$t - 1],
                'employment_status' => ['PNS', 'PPPK', 'Tetap Yayasan', 'Honorer'][$t - 1],
                'join_date' => now()->subYears(5 + $t)->toDateString(),
            ]);
        }

        return $teachers;
    }

    /** @return list<Classroom> */
    private function ensureClassrooms(School $school, array $teachers): array
    {
        $classrooms = [];
        foreach (self::CLASSROOMS[$school->jenjang] ?? self::CLASSROOMS['SMA'] as $index => [$name, $code]) {
            $classrooms[] = Classroom::firstOrCreate(
                ['school_id' => $school->id, 'code' => $code],
                [
                    'name' => $name,
                    'homeroom_teacher_id' => $teachers[$index]->id,
                    'academic_year' => '2026/2027',
                    'description' => "Rombongan belajar {$name} tahun ajaran 2026/2027",
                ]
            );
        }

        return $classrooms;
    }

    /** @return list<Course> */
    private function ensureCourses(School $school, array $teachers): array
    {
        $courses = [];
        foreach (self::COURSES[$school->jenjang] ?? self::COURSES['SMA'] as $index => [$title, $description]) {
            $courses[] = Course::firstOrCreate(
                ['school_id' => $school->id, 'title' => $title],
                ['description' => $description, 'instructor_id' => $teachers[$index % count($teachers)]->id]
            );
        }

        return $courses;
    }

    private function ensureAssignments(array $classrooms, array $courses, array $teachers): void
    {
        foreach ($classrooms as $c => $classroom) {
            foreach ($courses as $k => $course) {
                $teacher = $teachers[($c + $k) % count($teachers)];
                ClassSubjectAssignment::firstOrCreate(
                    ['classroom_id' => $classroom->id, 'course_id' => $course->id],
                    [
                        'teacher_id' => $teacher->id,
                        'schedule_day' => self::SCHEDULE_DAYS[($c * 3 + $k) % count(self::SCHEDULE_DAYS)],
                        'schedule_time' => self::TIME_SLOTS[($c + $k) % count(self::TIME_SLOTS)],
                        'room' => 'Ruang ' . ($c + 1) . '.' . ($k + 1),
                    ]
                );
            }
        }
    }

    /** Menambah siswa sampai tepat 20 per sekolah. Siswa yang sudah ada tidak diubah. */
    private function ensureStudents(School $school, int $number, array $classrooms, string $passwordHash): void
    {
        $existing = User::where('role', 'murid')->where('school_id', $school->id)->count();
        $needed = max(0, self::STUDENTS_PER_SCHOOL - $existing);

        for ($n = 1; $n <= $needed; $n++) {
            $seq = $existing + $n;
            $first = self::FIRST_NAMES[($number * 31 + $seq * 7) % count(self::FIRST_NAMES)];
            $last = self::LAST_NAMES[($number * 13 + $seq * 11) % count(self::LAST_NAMES)];
            $nis = sprintf('2026%02d%03d', $number, $seq);
            $classroom = $classrooms[$seq % count($classrooms)];

            User::updateOrCreate(['email' => Str::slug("{$first}.{$last}.{$nis}") . '@' . $this->domain($school)], [
                'name' => "{$first} {$last}",
                'nomor_induk' => $nis,
                'nim_nip' => $nis,
                'password' => $passwordHash,
                'role' => 'murid',
                'school_id' => $school->id,
                'classroom_id' => $classroom->id,
                'gender' => ($seq % 2) ? 'L' : 'P',
                'birth_place' => $school->city ?? 'Medan',
                'birth_date' => now()->subYears(16 + ($seq % 2))->subMonths($seq)->toDateString(),
                'phone' => '0813' . sprintf('%08d', $number * 1000 + $seq),
                'city' => $school->city ?? 'Medan',
                'address' => "Jl. Pelajar No. {$seq}, {$school->city}",
                'admission_year' => 2024 + ($seq % 2),
                'previous_school' => 'SMP Negeri ' . (($seq % 9) + 1) . ' ' . ($school->city ?? 'Medan'),
                'parent_name' => self::FIRST_NAMES[($seq * 5) % count(self::FIRST_NAMES)] . ' ' . self::LAST_NAMES[($seq * 3) % count(self::LAST_NAMES)],
                'parent_phone' => '0821' . sprintf('%08d', $number * 1000 + $seq),
                'parent_job' => ['Wiraswasta', 'Petani', 'Guru', 'Pegawai Swasta', 'Wirausaha'][$seq % 5],
            ]);
        }
    }

    private function domain(School $school): string
    {
        return Str::slug($school->name) . '.sch.id';
    }
}
