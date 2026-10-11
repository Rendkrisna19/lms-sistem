<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LearningMaterial;
use Illuminate\Support\Facades\Storage;

class LearningMaterialSeeder extends Seeder
{
    public function run(): void
    {
        Storage::disk('public')->makeDirectory('materials/documents');
        Storage::disk('public')->makeDirectory('materials/audio');
        Storage::disk('public')->makeDirectory('materials/videos');

        // Create dummy sample files on disk so URLs are valid
        file_put_contents(storage_path('app/public/materials/documents/modul_01_basis_data_relasional.pdf'), "%PDF-1.4\n% Sample PDF Content for Basis Data Relasional\n%%EOF");
        file_put_contents(storage_path('app/public/materials/documents/modul_pengayaan_nosql.pdf'), "%PDF-1.4\n% Sample PDF Content for NoSQL\n%%EOF");
        file_put_contents(storage_path('app/public/materials/documents/modul_01_agile_scrum.pdf'), "%PDF-1.4\n% Sample PDF Content for Agile Scrum\n%%EOF");

        LearningMaterial::truncate();

        // 1. Dr. Hendra Wijaya (ID 13, Class 1 TI-A, Course 7)
        LearningMaterial::create([
            'school_id' => 1,
            'teacher_id' => 13,
            'classroom_id' => 1,
            'course_id' => 7,
            'title' => 'Modul 01: Konsep Dasar Sistem Basis Data Relasional & Arsitektur DBMS',
            'description' => 'Materi panduan lengkap pemahaman konsep entitas, relasi, skema relasional, dan arsitektur database modern ANSI/SPARC.',
            'content_type' => 'document',
            'file_path' => 'materials/documents/modul_01_basis_data_relasional.pdf',
            'file_name_original' => 'Modul_01_Basis_Data_Relasional.pdf',
            'file_size_bytes' => 3565158,
            'is_active' => true,
            'expires_at' => now()->addDays(30),
        ]);

        LearningMaterial::create([
            'school_id' => 1,
            'teacher_id' => 13,
            'classroom_id' => 1,
            'course_id' => 7,
            'title' => 'Audio Penjelasan: Aturan Normalisasi Database (1NF, 2NF, dan 3NF)',
            'description' => 'Ulasan audio podcast dosen mengenai studi kasus normalisasi tabel transaksi akademik agar terhindar dari anomali data.',
            'content_type' => 'audio',
            'file_path' => 'materials/audio/podcast_normalisasi_database.mp3',
            'file_name_original' => 'Podcast_Normalisasi_Database_3NF.mp3',
            'file_size_bytes' => 14889779,
            'is_active' => true,
            'expires_at' => now()->addDays(20),
        ]);

        LearningMaterial::create([
            'school_id' => 1,
            'teacher_id' => 13,
            'classroom_id' => 1,
            'course_id' => 7,
            'title' => 'Simulasi Interaktif: Perancangan ERD Menggunakan MySQL Workbench',
            'description' => 'Panduan visual langkah demi langkah merancang foreign key, relasi many-to-many, dan forward engineering ke database MySQL.',
            'content_type' => 'video',
            'video_source_type' => 'youtube',
            'external_url' => 'https://www.youtube.com/watch?v=HXV3zeRR3h4',
            'is_active' => true,
            'expires_at' => null,
        ]);

        LearningMaterial::create([
            'school_id' => 1,
            'teacher_id' => 13,
            'classroom_id' => 1,
            'course_id' => 7,
            'title' => 'Rekaman Kuliah Dosen: Query Kompleks JOIN dan Aggregation SQL',
            'description' => 'Rekaman video tatap muka pembahasan subquery, group by, having, dan implementasi indexing pada tabel relasional berukuran besar.',
            'content_type' => 'video',
            'video_source_type' => 'upload',
            'file_path' => 'materials/videos/kuliah_dosen_join_aggregation.mp4',
            'file_name_original' => 'Kuliah_Dosen_Join_Aggregation.mp4',
            'file_size_bytes' => 48024780,
            'is_active' => true,
            'expires_at' => now()->addDays(45),
        ]);

        LearningMaterial::create([
            'school_id' => 1,
            'teacher_id' => 13,
            'classroom_id' => 1,
            'course_id' => 7,
            'title' => 'Draft Modul Pengayaan: Pengantar NoSQL & MongoDB Atlas',
            'description' => 'Materi bacaan mandiri untuk perbandingan basis data relasional vs dokumen NoSQL berbasis JSON.',
            'content_type' => 'document',
            'file_path' => 'materials/documents/modul_pengayaan_nosql.pdf',
            'file_name_original' => 'Draft_Modul_NoSQL_MongoDB.pdf',
            'file_size_bytes' => 2202009,
            'is_active' => false,
            'expires_at' => null,
        ]);

        // 2. Ratna Sari (ID 14, Class 2 TI-B, Course 8)
        LearningMaterial::create([
            'school_id' => 1,
            'teacher_id' => 14,
            'classroom_id' => 2,
            'course_id' => 8,
            'title' => 'Modul 01: Metodologi Pengembangan Perangkat Lunak Agile Scrum',
            'description' => 'Panduan praktis peranan Product Owner, Scrum Master, sprint planning, daily standup, dan sprint retrospective.',
            'content_type' => 'document',
            'file_path' => 'materials/documents/modul_01_agile_scrum.pdf',
            'file_name_original' => 'Modul_01_Agile_Scrum_Framework.pdf',
            'file_size_bytes' => 5033164,
            'is_active' => true,
            'expires_at' => now()->addDays(25),
        ]);

        LearningMaterial::create([
            'school_id' => 1,
            'teacher_id' => 14,
            'classroom_id' => 2,
            'course_id' => 8,
            'title' => 'Audio Podcast: Tips Sukses User Story & Estimasi Story Points',
            'description' => 'Ulasan teknik planning poker dan kriteria acceptance test (Invest Framework) dalam pembuatan backlog fitur aplikasi.',
            'content_type' => 'audio',
            'file_path' => 'materials/audio/podcast_user_story_estimation.mp3',
            'file_name_original' => 'Podcast_User_Story_StoryPoints.mp3',
            'file_size_bytes' => 10066329,
            'is_active' => true,
            'expires_at' => null,
        ]);

        LearningMaterial::create([
            'school_id' => 1,
            'teacher_id' => 14,
            'classroom_id' => 2,
            'course_id' => 8,
            'title' => 'Video Praktik: Desain UI/UX Wireframe & Prototype Interaktif Figma',
            'description' => 'Tutorial membuat komponen reusable, auto layout, dan interaksi prototyping sebelum diserahkan ke tim frontend developer.',
            'content_type' => 'video',
            'video_source_type' => 'google_drive',
            'external_url' => 'https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9/view',
            'is_active' => true,
            'expires_at' => now()->addDays(15),
        ]);
    }
}
