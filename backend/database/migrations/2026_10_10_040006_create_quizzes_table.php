<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quizzes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_id')->nullable()->constrained('lessons')->onDelete('set null');
            $table->foreignId('course_id')->nullable()->constrained('courses')->onDelete('cascade');
            $table->string('title');
            $table->text('instructions')->nullable();
            $table->unsignedInteger('duration_minutes')->default(30);
            $table->unsignedInteger('passing_score')->default(70);
            $table->boolean('is_published')->default(true);
            $table->boolean('show_result_immediately')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quizzes');
    }
};
