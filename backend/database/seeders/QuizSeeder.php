<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\QuizOption;

class QuizSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Dr. Hendra Wijaya (ID 13, Class 1 TI-A, Course 7)
        $q1 = Quiz::updateOrCreate(
            ['title' => 'Kuis Evaluasi 01: Normalisasi & Skema Relasional DBMS'],
            [
                'school_id' => 1,
                'teacher_id' => 13,
                'classroom_id' => 1,
                'course_id' => 7,
                'instructions' => "Petunjuk Pengerjaan:\n1. Kuis terdiri dari 4 butir soal pilihan ganda.\n2. Waktu pengerjaan adalah 45 menit terhitung sejak menekan tombol mulai.\n3. Nilai KKM kelulusan adalah 75.",
                'duration_minutes' => 45,
                'passing_score' => 75,
                'starts_at' => now()->subDays(2),
                'ends_at' => now()->addDays(20),
                'is_active' => true,
                'is_published' => true,
                'show_result_immediately' => true,
            ]
        );

        $q1->questions()->delete();

        // Soal 1
        $soal1 = QuizQuestion::create([
            'quiz_id' => $q1->id,
            'question_text' => 'Pada konsep <strong>First Normal Form (1NF)</strong>, aturan utama yang wajib dipenuhi oleh setiap atribut dalam sebuah relasi tabel adalah...',
            'points' => 25,
            'explanation' => '1NF mensyaratkan setiap kolom hanya bernilai atomik (tunggal) dan tidak memiliki repeating groups.',
            'order_index' => 1,
        ]);
        QuizOption::create(['question_id' => $soal1->id, 'option_label' => 'A', 'option_text' => 'Setiap kolom harus memiliki foreign key', 'is_correct' => false]);
        QuizOption::create(['question_id' => $soal1->id, 'option_label' => 'B', 'option_text' => 'Nilai pada setiap baris harus bernilai tunggal (atomik) dan tidak berulang', 'is_correct' => true]);
        QuizOption::create(['question_id' => $soal1->id, 'option_label' => 'C', 'option_text' => 'Tidak boleh ada nilai NULL pada kolom apapun', 'is_correct' => false]);
        QuizOption::create(['question_id' => $soal1->id, 'option_label' => 'D', 'option_text' => 'Tabel harus memiliki minimal dua primary key gabungan', 'is_correct' => false]);

        // Soal 2 (Dengan Gambar ERD)
        $soal2 = QuizQuestion::create([
            'quiz_id' => $q1->id,
            'question_text' => 'Perhatikan skema diagram relasi entitas berikut. Kardinalitas relasi antara entitas <em>Mahasiswa</em> dan <em>Mata Kuliah</em> melalui tabel perantara <em>KRS</em> yang tepat adalah...',
            'image_url' => 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=80',
            'points' => 25,
            'explanation' => 'Relasi Mahasiswa ke Mata Kuliah adalah Many-to-Many (N:M) yang didekomposisi menggunakan tabel relasi junction KRS.',
            'order_index' => 2,
        ]);
        QuizOption::create(['question_id' => $soal2->id, 'option_label' => 'A', 'option_text' => 'One-to-One (1:1)', 'is_correct' => false]);
        QuizOption::create(['question_id' => $soal2->id, 'option_label' => 'B', 'option_text' => 'One-to-Many (1:N)', 'is_correct' => false]);
        QuizOption::create(['question_id' => $soal2->id, 'option_label' => 'C', 'option_text' => 'Many-to-Many (N:M)', 'is_correct' => true]);
        QuizOption::create(['question_id' => $soal2->id, 'option_label' => 'D', 'option_text' => 'Recursive Binary', 'is_correct' => false]);

        // Soal 3 (Pilihan Jawaban Berupa Gambar)
        $soal3 = QuizQuestion::create([
            'quiz_id' => $q1->id,
            'question_text' => 'Manakah di antara gambar diagram berikut yang merepresentasikan simbol <strong>Entitas Lemah (Weak Entity)</strong> dalam notasi konseptual ERD?',
            'points' => 25,
            'explanation' => 'Entitas lemah digambarkan dengan persegi panjang bergaris ganda (double rectangle).',
            'order_index' => 3,
        ]);
        QuizOption::create([
            'question_id' => $soal3->id,
            'option_label' => 'A',
            'option_text' => 'Persegi Panjang Tunggal (Strong Entity)',
            'image_url' => 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
            'is_correct' => false
        ]);
        QuizOption::create([
            'question_id' => $soal3->id,
            'option_label' => 'B',
            'option_text' => 'Persegi Panjang Ganda (Weak Entity)',
            'image_url' => 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=80',
            'is_correct' => true
        ]);
        QuizOption::create([
            'question_id' => $soal3->id,
            'option_label' => 'C',
            'option_text' => 'Belah Ketupat Relasi (Relationship Diamond)',
            'image_url' => 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&auto=format&fit=crop&q=80',
            'is_correct' => false
        ]);
        QuizOption::create([
            'question_id' => $soal3->id,
            'option_label' => 'D',
            'option_text' => 'Elips Atribut (Attribute Ellipse)',
            'image_url' => 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&auto=format&fit=crop&q=80',
            'is_correct' => false
        ]);

        // Soal 4
        $soal4 = QuizQuestion::create([
            'quiz_id' => $q1->id,
            'question_text' => 'Sintaks SQL berikut yang tergolong ke dalam kelompok <strong>Data Definition Language (DDL)</strong> adalah...',
            'points' => 25,
            'explanation' => 'DDL digunakan untuk mendefinisikan struktur skema database, seperti CREATE, ALTER, dan DROP.',
            'order_index' => 4,
        ]);
        QuizOption::create(['question_id' => $soal4->id, 'option_label' => 'A', 'option_text' => 'CREATE TABLE mahasiswa (...)', 'is_correct' => true]);
        QuizOption::create(['question_id' => $soal4->id, 'option_label' => 'B', 'option_text' => 'SELECT * FROM mahasiswa', 'is_correct' => false]);
        QuizOption::create(['question_id' => $soal4->id, 'option_label' => 'C', 'option_text' => 'UPDATE mahasiswa SET nama = "Budi"', 'is_correct' => false]);
        QuizOption::create(['question_id' => $soal4->id, 'option_label' => 'D', 'option_text' => 'INSERT INTO mahasiswa VALUES (...)', 'is_correct' => false]);

        // UTS Hendra
        Quiz::updateOrCreate(
            ['title' => 'Ujian Tengah Semester (UTS): Perancangan Basis Data Lanjutan'],
            [
                'school_id' => 1,
                'teacher_id' => 13,
                'classroom_id' => 1,
                'course_id' => 7,
                'instructions' => "UTS Resmi Semester Ganjil. Pastikan koneksi internet stabil sebelum menekan tombol mulai ujian.",
                'duration_minutes' => 90,
                'passing_score' => 75,
                'starts_at' => now()->addDays(5),
                'ends_at' => now()->addDays(12),
                'is_active' => true,
                'is_published' => true,
                'show_result_immediately' => false,
            ]
        );

        // 2. Ratna Sari (ID 14, Class 2 TI-B, Course 8)
        $qRatna = Quiz::updateOrCreate(
            ['title' => 'Kuis 01: Metodologi Agile Scrum & Manajemen Sprint Backlog'],
            [
                'school_id' => 1,
                'teacher_id' => 14,
                'classroom_id' => 2,
                'course_id' => 8,
                'instructions' => "Kuis evaluasi sprint planning & peran scrum team. Waktu pengerjaan 30 menit. KKM: 70.",
                'duration_minutes' => 30,
                'passing_score' => 70,
                'starts_at' => now()->subDays(1),
                'ends_at' => now()->addDays(15),
                'is_active' => true,
                'is_published' => true,
                'show_result_immediately' => true,
            ]
        );

        $qRatna->questions()->delete();

        $soalRatna1 = QuizQuestion::create([
            'quiz_id' => $qRatna->id,
            'question_text' => 'Dalam kerangka kerja <strong>Scrum</strong>, peran yang bertanggung jawab utama untuk memaksimalkan nilai produk dan mengelola Product Backlog adalah...',
            'points' => 50,
            'explanation' => 'Product Owner bertanggung jawab mendefinisikan user stories dan memprioritaskan fitur produk.',
            'order_index' => 1,
        ]);
        QuizOption::create(['question_id' => $soalRatna1->id, 'option_label' => 'A', 'option_text' => 'Scrum Master', 'is_correct' => false]);
        QuizOption::create(['question_id' => $soalRatna1->id, 'option_label' => 'B', 'option_text' => 'Product Owner', 'is_correct' => true]);
        QuizOption::create(['question_id' => $soalRatna1->id, 'option_label' => 'C', 'option_text' => 'Developers Lead', 'is_correct' => false]);
        QuizOption::create(['question_id' => $soalRatna1->id, 'option_label' => 'D', 'option_text' => 'Stakeholder Eksternal', 'is_correct' => false]);

        $soalRatna2 = QuizQuestion::create([
            'quiz_id' => $qRatna->id,
            'question_text' => 'Perhatikan grafik <em>Sprint Burndown Chart</em> berikut. Apabila garis aktual berada di atas garis ideal estimasi, hal tersebut mengindikasikan bahwa...',
            'image_url' => 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
            'points' => 50,
            'explanation' => 'Jika garis actual berada di atas ideal burndown, artinya sisa pekerjaan lebih banyak dari jadwal rencana (terlambat/behind schedule).',
            'order_index' => 2,
        ]);
        QuizOption::create(['question_id' => $soalRatna2->id, 'option_label' => 'A', 'option_text' => 'Pekerjaan sprint berjalan lebih lambat dari jadwal yang direncanakan', 'is_correct' => true]);
        QuizOption::create(['question_id' => $soalRatna2->id, 'option_label' => 'B', 'option_text' => 'Pekerjaan sprint selesai lebih cepat dari estimasi', 'is_correct' => false]);
        QuizOption::create(['question_id' => $soalRatna2->id, 'option_label' => 'C', 'option_text' => 'Tim scrum berhasil menyelesaikan seluruh backlog', 'is_correct' => false]);
        QuizOption::create(['question_id' => $soalRatna2->id, 'option_label' => 'D', 'option_text' => 'Kapasitas tim bertambah 2x lipat di tengah sprint', 'is_correct' => false]);
    }
}
