<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('learning_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->nullable()->constrained('schools')->nullOnDelete();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('classroom_id')->constrained('classrooms')->cascadeOnDelete();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->foreignId('lesson_id')->nullable()->constrained('lessons')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('content_type'); // 'document', 'audio', 'video'
            $table->string('video_source_type')->nullable(); // 'upload', 'youtube', 'google_drive'
            $table->string('file_path', 500)->nullable();
            $table->string('file_name_original')->nullable();
            $table->unsignedBigInteger('file_size_bytes')->nullable();
            $table->string('external_url', 500)->nullable();
            $table->boolean('is_active')->default(true);
            $table->dateTime('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('learning_materials');
    }
};
