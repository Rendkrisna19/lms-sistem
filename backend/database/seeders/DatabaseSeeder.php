<?php

namespace Database\Seeders;

use App\Models\School;
use App\Models\User;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonContent;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\QuizOption;
use App\Models\Classroom;
use App\Models\ClassSubjectAssignment;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 0. Data Multi-Sekolah
        $school1 = School::updateOrCreate(
            ['npsn' => '10203040'],
            [
                'name' => 'SMA Mitra Inalum',
                'jenjang' => 'SMA',
                'address' => 'Komp. Perumahan Inalum, Tanjung Gading, Kab. Batu Bara',
                'phone' => '0622-31311',
                'email' => 'info@smamitrainalum.sch.id',
                'status' => 'active',
            ]
        );

        $school2 = School::updateOrCreate(
            ['npsn' => '10203041'],
            [
                'name' => 'SMK Negeri 1 Balige',
                'jenjang' => 'SMK',
                'address' => 'Jl. Somba Debata No. 1, Balige',
                'phone' => '0632-21211',
                'email' => 'info@smkn1balige.sch.id',
                'status' => 'active',
            ]
        );

        // 1. Akun Admin Master (Pengelola Seluruh Data Multi-Sekolah)
        $masterAdmin = User::updateOrCreate(
            ['email' => 'master@cendekia.ac.id'],
            [
                'name' => 'Admin Master Cendekia',
                'password' => Hash::make('password123'),
                'role' => 'admin_master',
                'nomor_induk' => 'MASTER001',
                'nim_nip' => 'MASTER001',
                'school_id' => null, // Master mengelola semua sekolah
            ]
        );

        // 2. Akun Admin Sekolah (SMA Mitra Inalum)
        $adminSekolah = User::updateOrCreate(
            ['email' => 'admin.master@cendekia.ac.id'],
            [
                'name' => 'Admin SMA Mitra Inalum',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'nomor_induk' => 'ADMIN001',
                'nim_nip' => 'ADMIN001',
                'school_id' => $school1->id,
            ]
        );

        // 3. Akun Guru / Pengampu (SMA Mitra Inalum)
        $guru = User::updateOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name' => 'Guru Pengampu (Ibu Yulia)',
                'password' => Hash::make('password123'),
                'role' => 'guru',
                'nomor_induk' => '198507152010122001',
                'nim_nip' => '198507152010122001',
                'school_id' => $school1->id,
            ]
        );

        $guru2 = User::updateOrCreate(
            ['email' => 'hendra@cendekia.ac.id'],
            [
                'name' => 'Dr. Hendra Wijaya, M.T.',
                'password' => Hash::make('password123'),
                'role' => 'guru',
                'nomor_induk' => '198803122014021002',
                'nim_nip' => '198803122014021002',
                'school_id' => $school1->id,
            ]
        );

        $guru3 = User::updateOrCreate(
            ['email' => 'ratna@cendekia.ac.id'],
            [
                'name' => 'Ratna Sari, M.Cs.',
                'password' => Hash::make('password123'),
                'role' => 'guru',
                'nomor_induk' => '199104252018032001',
                'nim_nip' => '199104252018032001',
                'school_id' => $school1->id,
            ]
        );

        // 4. Akun Murid / Siswa (SMA Mitra Inalum)
        $siswa = User::updateOrCreate(
            ['email' => 'siswa@gmail.com'],
            [
                'name' => 'Siswa Belajar (Ahmad Fajar)',
                'password' => Hash::make('password123'),
                'role' => 'murid',
                'nomor_induk' => '20241001',
                'nim_nip' => '20241001',
                'school_id' => $school1->id,
            ]
        );

        $siswa2 = User::updateOrCreate(
            ['email' => 'siti@cendekia.ac.id'],
            [
                'name' => 'Siti Aisyah',
                'password' => Hash::make('password123'),
                'role' => 'murid',
                'nomor_induk' => '20241002',
                'nim_nip' => '20241002',
                'school_id' => $school1->id,
            ]
        );

        $siswa3 = User::updateOrCreate(
            ['email' => 'budi@cendekia.ac.id'],
            [
                'name' => 'Budi Pratama',
                'password' => Hash::make('password123'),
                'role' => 'murid',
                'nomor_induk' => '20241003',
                'nim_nip' => '20241003',
                'school_id' => $school1->id,
            ]
        );

        $siswa4 = User::updateOrCreate(
            ['email' => 'dewi@cendekia.ac.id'],
            [
                'name' => 'Dewi Lestari',
                'password' => Hash::make('password123'),
                'role' => 'murid',
                'nomor_induk' => '20241004',
                'nim_nip' => '20241004',
                'school_id' => $school1->id,
            ]
        );

        // 5. Data Mata Pelajaran / Course (SMA Mitra Inalum)
        $course = Course::updateOrCreate(
            ['school_id' => $school1->id, 'title' => 'Algoritma & Struktur Data'],
            [
                'description' => 'Materi pembelajaran terstruktur untuk memahami konsep dasar komputasi, array, dan efisiensi algoritma.',
                'instructor_id' => $guru->id,
                'school_id' => $school1->id,
            ]
        );

        $course2 = Course::updateOrCreate(
            ['school_id' => $school1->id, 'title' => 'Basis Data Relasional'],
            [
                'description' => 'Perancangan skema database relasional, normalisasi 3NF, dan optimasi query SQL.',
                'instructor_id' => $guru2->id,
                'school_id' => $school1->id,
            ]
        );

        $course3 = Course::updateOrCreate(
            ['school_id' => $school1->id, 'title' => 'Rekayasa Perangkat Lunak'],
            [
                'description' => 'Metodologi Agile/Scrum, perancangan arsitektur modular, dan testing sistem.',
                'instructor_id' => $guru3->id,
                'school_id' => $school1->id,
            ]
        );

        // 6. Data Kelas / Rombongan Belajar (SMA Mitra Inalum)
        $class1 = Classroom::updateOrCreate(
            ['school_id' => $school1->id, 'code' => 'TI-A'],
            [
                'name' => 'Teknik Informatika - A',
                'homeroom_teacher_id' => $guru->id,
                'academic_year' => '2026/2027',
                'description' => 'Kelas reguler semester ganjil konsentrasi Rekayasa Perangkat Lunak dan Algoritma.',
                'school_id' => $school1->id,
            ]
        );

        $class2 = Classroom::updateOrCreate(
            ['school_id' => $school1->id, 'code' => 'TI-B'],
            [
                'name' => 'Teknik Informatika - B',
                'homeroom_teacher_id' => $guru2->id,
                'academic_year' => '2026/2027',
                'description' => 'Kelas reguler semester ganjil konsentrasi Sains Data dan Basis Data.',
                'school_id' => $school1->id,
            ]
        );

        // Alokasikan Siswa ke Kelas
        $siswa->update(['classroom_id' => $class1->id, 'school_id' => $school1->id]);
        $siswa2->update(['classroom_id' => $class1->id, 'school_id' => $school1->id]);
        $siswa3->update(['classroom_id' => $class2->id, 'school_id' => $school1->id]);
        $siswa4->update(['classroom_id' => $class2->id, 'school_id' => $school1->id]);

        // 5. Plotting Guru & Mapel per Kelas (Class Subject Assignments)
        // Kelas TI-A:
        ClassSubjectAssignment::updateOrCreate(
            ['classroom_id' => $class1->id, 'course_id' => $course->id],
            [
                'teacher_id' => $guru->id,
                'schedule_day' => 'Senin',
                'schedule_time' => '08:00 - 10:00',
                'room' => 'Lab Komputer 1',
            ]
        );

        ClassSubjectAssignment::updateOrCreate(
            ['classroom_id' => $class1->id, 'course_id' => $course2->id],
            [
                'teacher_id' => $guru2->id,
                'schedule_day' => 'Rabu',
                'schedule_time' => '10:15 - 12:00',
                'room' => 'Lab Basis Data',
            ]
        );

        // Kelas TI-B:
        ClassSubjectAssignment::updateOrCreate(
            ['classroom_id' => $class2->id, 'course_id' => $course3->id],
            [
                'teacher_id' => $guru3->id,
                'schedule_day' => 'Selasa',
                'schedule_time' => '08:00 - 10:00',
                'room' => 'Ruang Teori 302',
            ]
        );

        ClassSubjectAssignment::updateOrCreate(
            ['classroom_id' => $class2->id, 'course_id' => $course->id],
            [
                'teacher_id' => $guru->id,
                'schedule_day' => 'Kamis',
                'schedule_time' => '13:00 - 15:00',
                'room' => 'Lab Komputer 2',
            ]
        );

        // 6. Pertemuan 1 (3 Model Pembelajaran: Dokumen PDF, Audio Suara MP3, Video)
        $lesson1 = Lesson::updateOrCreate(
            ['course_id' => $course->id, 'title' => 'Pertemuan 1: Pengantar Struktur Data & Array'],
            [
                'description' => 'Memahami konsep dasar tipe data abstrak, representasi memori, dan operasi dasar pada array 1D & 2D.',
                'order_index' => 1,
            ]
        );

        // Model 1: Dokumen PDF
        LessonContent::updateOrCreate(
            ['lesson_id' => $lesson1->id, 'content_type' => 'document'],
            [
                'title' => 'Modul 01 - Konsep Memori dan Array.pdf',
                'file_name_original' => 'Modul_01_Array.pdf',
                'file_path' => 'documents/modul-01.pdf',
                'file_size_bytes' => 1024 * 1024 * 3, // 3MB
                'notes' => 'Silakan dibaca sebelum mendengarkan rekaman suara penjelasan guru.',
            ]
        );

        // Model 2: Rekaman Suara / Audio MP3 Penjelasan Guru
        LessonContent::updateOrCreate(
            ['lesson_id' => $lesson1->id, 'content_type' => 'audio'],
            [
                'title' => 'Penjelasan Vokal Guru - Konsep Indeks Array & Memory Address',
                'file_name_original' => 'rekaman_materi_pertemuan1.mp3',
                'file_path' => 'audio/rekaman_materi_01.mp3',
                'file_size_bytes' => 1024 * 1024 * 8, // 8MB
                'duration_seconds' => 745, // ~12 menit 25 detik
                'notes' => 'Dengarkan rekaman suara ini untuk memahami bagaimana pointer memori menghitung offset indeks.',
            ]
        );

        // Model 3: Video Tutorial
        LessonContent::updateOrCreate(
            ['lesson_id' => $lesson1->id, 'content_type' => 'video'],
            [
                'title' => 'Video Simulasi Traversal & Manipulasi Array',
                'file_name_original' => 'video_array_simulation.mp4',
                'file_path' => 'videos/video_array.mp4',
                'file_size_bytes' => 1024 * 1024 * 25,
                'duration_seconds' => 930,
                'external_url' => 'https://www.youtube.com/watch?v=RBSGKlAvoiM',
                'notes' => 'Simulasi visual pergerakan memori saat proses traversal elemen array.',
            ]
        );

        // 5. Ujian Pilihan Ganda Terkait Pertemuan 1
        $quiz = Quiz::updateOrCreate(
            ['lesson_id' => $lesson1->id],
            [
                'school_id' => $school1->id,
                'teacher_id' => $guru->id,
                'classroom_id' => $class1->id,
                'course_id' => $course->id,
                'is_active' => true,
                'title' => 'Kuis Pemahaman Pertemuan 1 - Konsep Dasar Array',
                'instructions' => 'Pilihlah salah satu jawaban yang paling tepat. Waktu pengerjaan adalah 20 menit. Nilai akan otomatis dikalkulasi setelah Anda menekan tombol kumpulkan.',
                'duration_minutes' => 20,
                'passing_score' => 70,
                'is_published' => true,
                'show_result_immediately' => true,
            ]
        );

        // Soal 1
        $q1 = QuizQuestion::updateOrCreate(
            ['quiz_id' => $quiz->id, 'order_index' => 1],
            [
                'question_text' => 'Berapakah kompleksitas waktu (time complexity) untuk mengakses elemen array secara langsung berdasarkan indeksnya?',
                'points' => 20,
                'explanation' => 'Array menyimpan elemen dalam lokasi memori berurutan (kontigu), sehingga akses indeks langsung memakan waktu konstan O(1).',
            ]
        );
        QuizOption::updateOrCreate(['question_id' => $q1->id, 'option_label' => 'A'], ['option_text' => 'O(1)', 'is_correct' => true]);
        QuizOption::updateOrCreate(['question_id' => $q1->id, 'option_label' => 'B'], ['option_text' => 'O(n)', 'is_correct' => false]);
        QuizOption::updateOrCreate(['question_id' => $q1->id, 'option_label' => 'C'], ['option_text' => 'O(log n)', 'is_correct' => false]);
        QuizOption::updateOrCreate(['question_id' => $q1->id, 'option_label' => 'D'], ['option_text' => 'O(n^2)', 'is_correct' => false]);

        // Soal 2
        $q2 = QuizQuestion::updateOrCreate(
            ['quiz_id' => $quiz->id, 'order_index' => 2],
            [
                'question_text' => 'Karakteristik utama dari struktur data Array adalah...',
                'points' => 20,
                'explanation' => 'Array mengalokasikan ruang memori yang berturutan (kontigu) dengan tipe data yang homogen.',
            ]
        );
        QuizOption::updateOrCreate(['question_id' => $q2->id, 'option_label' => 'A'], ['option_text' => 'Elemen tersimpan secara acak di memori', 'is_correct' => false]);
        QuizOption::updateOrCreate(['question_id' => $q2->id, 'option_label' => 'B'], ['option_text' => 'Elemen tersimpan pada alamat memori yang berurutan (kontigu)', 'is_correct' => true]);
        QuizOption::updateOrCreate(['question_id' => $q2->id, 'option_label' => 'C'], ['option_text' => 'Tipe data tiap elemen harus berbeda-beda', 'is_correct' => false]);
        QuizOption::updateOrCreate(['question_id' => $q2->id, 'option_label' => 'D'], ['option_text' => 'Ukuran kapasitas selalu fleksibel tanpa batas memori', 'is_correct' => false]);

        // Soal 3
        $q3 = QuizQuestion::updateOrCreate(
            ['quiz_id' => $quiz->id, 'order_index' => 3],
            [
                'question_text' => 'Jika indeks array dimulai dari 0 (zero-indexed) dengan panjang 10, maka indeks elemen terakhir adalah...',
                'points' => 20,
                'explanation' => 'Pada zero-based indexing, elemen terakhir berada pada indeks (n - 1) = 10 - 1 = 9.',
            ]
        );
        QuizOption::updateOrCreate(['question_id' => $q3->id, 'option_label' => 'A'], ['option_text' => '10', 'is_correct' => false]);
        QuizOption::updateOrCreate(['question_id' => $q3->id, 'option_label' => 'B'], ['option_text' => '9', 'is_correct' => true]);
        QuizOption::updateOrCreate(['question_id' => $q3->id, 'option_label' => 'C'], ['option_text' => '11', 'is_correct' => false]);
        QuizOption::updateOrCreate(['question_id' => $q3->id, 'option_label' => 'D'], ['option_text' => '8', 'is_correct' => false]);

        // Soal 4
        $q4 = QuizQuestion::updateOrCreate(
            ['quiz_id' => $quiz->id, 'order_index' => 4],
            [
                'question_text' => 'Kelemahan utama dari fixed-size array konvensional dibanding linked list adalah...',
                'points' => 20,
                'explanation' => 'Array memiliki ukuran tetap saat deklarasi, sehingga penambahan elemen baru melampaui kapasitas memerlukan alokasi ulang dan penyalinan seluruh data.',
            ]
        );
        QuizOption::updateOrCreate(['question_id' => $q4->id, 'option_label' => 'A'], ['option_text' => 'Akses elemen berdasarkan indeks sangat lambat', 'is_correct' => false]);
        QuizOption::updateOrCreate(['question_id' => $q4->id, 'option_label' => 'B'], ['option_text' => 'Ukuran memori statis dan penyisipan di tengah memerlukan pergeseran elemen', 'is_correct' => true]);
        QuizOption::updateOrCreate(['question_id' => $q4->id, 'option_label' => 'C'], ['option_text' => 'Menggunakan lebih banyak pointer memori', 'is_correct' => false]);
        QuizOption::updateOrCreate(['question_id' => $q4->id, 'option_label' => 'D'], ['option_text' => 'Tidak dapat menyimpan angka bulat (integer)', 'is_correct' => false]);

        // Soal 5
        $q5 = QuizQuestion::updateOrCreate(
            ['quiz_id' => $quiz->id, 'order_index' => 5],
            [
                'question_text' => 'Operasi traversal pada array artinya...',
                'points' => 20,
                'explanation' => 'Traversal adalah proses mengunjungi setiap elemen dalam struktur data tepat satu kali untuk pemrosesan atau penampilan nilai.',
            ]
        );
        QuizOption::updateOrCreate(['question_id' => $q5->id, 'option_label' => 'A'], ['option_text' => 'Menghapus seluruh isi array', 'is_correct' => false]);
        QuizOption::updateOrCreate(['question_id' => $q5->id, 'option_label' => 'B'], ['option_text' => 'Mengunjungi dan memproses setiap elemen array satu per satu', 'is_correct' => true]);
        QuizOption::updateOrCreate(['question_id' => $q5->id, 'option_label' => 'C'], ['option_text' => 'Menyalin array ke file eksternal', 'is_correct' => false]);
        QuizOption::updateOrCreate(['question_id' => $q5->id, 'option_label' => 'D'], ['option_text' => 'Mengurutkan elemen array secara menaik', 'is_correct' => false]);

        // Data Sample untuk Sekolah 2 (SMK Negeri 1 Balige)
        $guruBalige = User::updateOrCreate(
            ['email' => 'tulus@smkn1balige.sch.id'],
            [
                'name' => 'Tulus Simanjuntak, S.Pd.',
                'password' => Hash::make('password123'),
                'role' => 'guru',
                'nomor_induk' => '198402112009031001',
                'nim_nip' => '198402112009031001',
                'school_id' => $school2->id,
            ]
        );

        $classBalige = Classroom::updateOrCreate(
            ['school_id' => $school2->id, 'code' => 'TKJ-1'],
            [
                'name' => 'Teknik Komputer & Jaringan - 1',
                'homeroom_teacher_id' => $guruBalige->id,
                'academic_year' => '2026/2027',
                'description' => 'Kelas reguler SMK jurusan Teknik Komputer Jaringan.',
                'school_id' => $school2->id,
            ]
        );

        User::updateOrCreate(
            ['email' => 'johan@smkn1balige.sch.id'],
            [
                'name' => 'Johan Panjaitan',
                'password' => Hash::make('password123'),
                'role' => 'murid',
                'nomor_induk' => '20242001',
                'nim_nip' => '20242001',
                'classroom_id' => $classBalige->id,
                'school_id' => $school2->id,
            ]
        );

        // Bahan ajar demo (dicari berdasarkan email/kode, tanpa ID hardcode).
        // QuizSeeder sengaja tidak dipanggil di sini.
        $this->call(LearningMaterialSeeder::class);
    }
}
