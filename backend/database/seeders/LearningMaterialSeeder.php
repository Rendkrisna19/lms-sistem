<?php

namespace Database\Seeders;

use App\Models\Classroom;
use App\Models\Course;
use App\Models\LearningMaterial;
use App\Models\MaterialAccess;
use App\Models\School;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

/**
 * Bahan ajar demo. Idempoten (updateOrCreate) dan mencari relasi berdasarkan
 * data alami (NPSN, email, kode kelas, judul mapel) — tanpa ID hardcode.
 * Membutuhkan data dari DatabaseSeeder; jika belum ada, seeder dilewati.
 */
class LearningMaterialSeeder extends Seeder
{
    public function run(): void
    {
        $school = School::where('npsn', '10203040')->first();
        $hendra = User::where('email', 'hendra@cendekia.ac.id')->where('role', 'guru')->first();
        $ratna = User::where('email', 'ratna@cendekia.ac.id')->where('role', 'guru')->first();

        if (!$school || !$hendra || !$ratna) {
            $this->command?->warn('LearningMaterialSeeder dilewati: jalankan DatabaseSeeder terlebih dahulu.');

            return;
        }

        $classA = Classroom::where('school_id', $school->id)->where('code', 'TI-A')->first();
        $classB = Classroom::where('school_id', $school->id)->where('code', 'TI-B')->first();
        $basisData = Course::where('school_id', $school->id)->where('title', 'Basis Data Relasional')->first();
        $rpl = Course::where('school_id', $school->id)->where('title', 'Rekayasa Perangkat Lunak')->first();

        if (!$classA || !$classB || !$basisData || !$rpl) {
            $this->command?->warn('LearningMaterialSeeder dilewati: kelas / mapel demo belum tersedia.');

            return;
        }

        $this->writeSampleFiles();

        $materials = [
            // Dr. Hendra Wijaya — Basis Data Relasional di TI-A
            [$hendra, $classA, $basisData, [
                'title' => 'Modul 01: Konsep Dasar Sistem Basis Data Relasional & Arsitektur DBMS',
                'description' => 'Materi panduan lengkap pemahaman konsep entitas, relasi, skema relasional, dan arsitektur database modern ANSI/SPARC.',
                'content_type' => 'document',
                'file_path' => 'materials/documents/modul_01_basis_data_relasional.pdf',
                'file_name_original' => 'Modul_01_Basis_Data_Relasional.pdf',
                'file_size_bytes' => 3565158,
                'is_active' => true,
                'expires_at' => now()->addDays(30),
            ]],
            [$hendra, $classA, $basisData, [
                'title' => 'Audio Penjelasan: Aturan Normalisasi Database (1NF, 2NF, dan 3NF)',
                'description' => 'Ulasan audio podcast dosen mengenai studi kasus normalisasi tabel transaksi akademik agar terhindar dari anomali data.',
                'content_type' => 'audio',
                'file_path' => 'materials/audio/podcast_normalisasi_database.mp3',
                'file_name_original' => 'Podcast_Normalisasi_Database_3NF.mp3',
                'file_size_bytes' => 14889779,
                'is_active' => true,
                'expires_at' => now()->addDays(20),
            ]],
            [$hendra, $classA, $basisData, [
                'title' => 'Simulasi Interaktif: Perancangan ERD Menggunakan MySQL Workbench',
                'description' => 'Panduan visual langkah demi langkah merancang foreign key, relasi many-to-many, dan forward engineering ke database MySQL.',
                'content_type' => 'video',
                'video_source_type' => 'youtube',
                'external_url' => 'https://www.youtube.com/watch?v=HXV3zeRR3h4',
                'is_active' => true,
                'expires_at' => null,
            ]],
            [$hendra, $classA, $basisData, [
                'title' => 'Rekaman Kuliah Dosen: Query Kompleks JOIN dan Aggregation SQL',
                'description' => 'Rekaman video tatap muka pembahasan subquery, group by, having, dan implementasi indexing pada tabel relasional berukuran besar.',
                'content_type' => 'video',
                'video_source_type' => 'upload',
                'file_path' => 'materials/videos/kuliah_dosen_join_aggregation.mp4',
                'file_name_original' => 'Kuliah_Dosen_Join_Aggregation.mp4',
                'file_size_bytes' => 48024780,
                'is_active' => true,
                'expires_at' => now()->addDays(45),
            ]],
            [$hendra, $classA, $basisData, [
                'title' => 'Draft Modul Pengayaan: Pengantar NoSQL & MongoDB Atlas',
                'description' => 'Materi bacaan mandiri untuk perbandingan basis data relasional vs dokumen NoSQL berbasis JSON.',
                'content_type' => 'document',
                'file_path' => 'materials/documents/modul_pengayaan_nosql.pdf',
                'file_name_original' => 'Draft_Modul_NoSQL_MongoDB.pdf',
                'file_size_bytes' => 2202009,
                'is_active' => false,
                'expires_at' => null,
            ]],

            // Ratna Sari — Rekayasa Perangkat Lunak di TI-B
            [$ratna, $classB, $rpl, [
                'title' => 'Modul 01: Metodologi Pengembangan Perangkat Lunak Agile Scrum',
                'description' => 'Panduan praktis peranan Product Owner, Scrum Master, sprint planning, daily standup, dan sprint retrospective.',
                'content_type' => 'document',
                'file_path' => 'materials/documents/modul_01_agile_scrum.pdf',
                'file_name_original' => 'Modul_01_Agile_Scrum_Framework.pdf',
                'file_size_bytes' => 5033164,
                'is_active' => true,
                'expires_at' => now()->addDays(25),
            ]],
            [$ratna, $classB, $rpl, [
                'title' => 'Audio Podcast: Tips Sukses User Story & Estimasi Story Points',
                'description' => 'Ulasan teknik planning poker dan kriteria acceptance test (Invest Framework) dalam pembuatan backlog fitur aplikasi.',
                'content_type' => 'audio',
                'file_path' => 'materials/audio/podcast_user_story_estimation.mp3',
                'file_name_original' => 'Podcast_User_Story_StoryPoints.mp3',
                'file_size_bytes' => 10066329,
                'is_active' => true,
                'expires_at' => null,
            ]],
            [$ratna, $classB, $rpl, [
                'title' => 'Video Praktik: Desain UI/UX Wireframe & Prototype Interaktif Figma',
                'description' => 'Tutorial membuat komponen reusable, auto layout, dan interaksi prototyping sebelum diserahkan ke tim frontend developer.',
                'content_type' => 'video',
                'video_source_type' => 'google_drive',
                'external_url' => 'https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9/view',
                'is_active' => true,
                'expires_at' => now()->addDays(15),
            ]],
        ];

        foreach ($materials as [$teacher, $classroom, $course, $attributes]) {
            LearningMaterial::updateOrCreate(
                ['teacher_id' => $teacher->id, 'title' => $attributes['title']],
                $attributes + [
                    'school_id' => $school->id,
                    'classroom_id' => $classroom->id,
                    'course_id' => $course->id,
                    'video_source_type' => null,
                    'file_path' => null,
                    'file_name_original' => null,
                    'file_size_bytes' => null,
                    'external_url' => null,
                ]
            );
        }

        $this->seedDemoAccesses($classA->id, $classB->id);
    }

    /**
     * Log akses demo agar analitik gaya belajar memiliki data awal (satu baris per siswa per materi).
     */
    private function seedDemoAccesses(int ...$classroomIds): void
    {
        $students = User::where('role', 'murid')->whereIn('classroom_id', $classroomIds)->orderBy('id')->get();

        foreach ($students as $index => $student) {
            $materials = LearningMaterial::where('classroom_id', $student->classroom_id)
                ->available()
                ->orderBy('id')
                ->get()
                // variasikan pola akses antar siswa
                ->filter(fn ($material, $i) => ($i + $index) % 3 !== 0);

            foreach ($materials as $material) {
                MaterialAccess::firstOrCreate(
                    ['user_id' => $student->id, 'learning_material_id' => $material->id],
                    ['content_type' => $material->content_type, 'accessed_at' => now()->subDays(($material->id + $index) % 7)]
                );
            }
        }
    }

    private function writeSampleFiles(): void
    {
        $disk = Storage::disk('public');

        $samples = [
            'materials/documents/modul_01_basis_data_relasional.pdf' => 'Basis Data Relasional',
            'materials/documents/modul_pengayaan_nosql.pdf' => 'NoSQL',
            'materials/documents/modul_01_agile_scrum.pdf' => 'Agile Scrum',
        ];

        foreach ($samples as $path => $label) {
            if (!$disk->exists($path)) {
                $disk->put($path, "%PDF-1.4\n% Sample PDF Content for {$label}\n%%EOF");
            }
        }
    }
}
