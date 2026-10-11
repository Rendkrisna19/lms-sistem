<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Table Classrooms (Data Kelas / Rombel)
        Schema::create('classrooms', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g. "Teknik Informatika - A"
            $table->string('code')->unique(); // e.g. "TI-A"
            $table->foreignId('homeroom_teacher_id')->nullable()->constrained('users')->nullOnDelete(); // Wali Kelas
            $table->string('academic_year')->default('2026/2027');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // 2. Add classroom_id to users (Siswa terhubung ke Kelas)
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('classroom_id')->nullable()->after('role')->constrained('classrooms')->nullOnDelete();
        });

        // 3. Table Class Subject Assignments (Plotting Guru Mengajar Mapel di Kelas Tertentu)
        Schema::create('class_subject_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classroom_id')->constrained('classrooms')->cascadeOnDelete();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->string('schedule_day')->nullable(); // e.g. "Senin"
            $table->string('schedule_time')->nullable(); // e.g. "08:00 - 10:00"
            $table->string('room')->nullable(); // e.g. "Lab Komputer 1"
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_subject_assignments');

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['classroom_id']);
            $table->dropColumn('classroom_id');
        });

        Schema::dropIfExists('classrooms');
    }
};
