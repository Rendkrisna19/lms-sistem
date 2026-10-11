<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->foreignId('classroom_id')->nullable()->after('course_id')->constrained('classrooms')->cascadeOnDelete();
            $table->foreignId('teacher_id')->nullable()->after('classroom_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('school_id')->nullable()->after('teacher_id')->constrained('schools')->nullOnDelete();
            $table->dateTime('starts_at')->nullable()->after('passing_score');
            $table->dateTime('ends_at')->nullable()->after('starts_at');
            $table->boolean('is_active')->default(true)->after('ends_at');
        });

        Schema::table('quiz_options', function (Blueprint $table) {
            $table->string('image_url', 500)->nullable()->after('option_text');
        });
    }

    public function down(): void
    {
        Schema::table('quiz_options', function (Blueprint $table) {
            $table->dropColumn('image_url');
        });

        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropForeign(['classroom_id']);
            $table->dropForeign(['teacher_id']);
            $table->dropForeign(['school_id']);
            $table->dropColumn(['classroom_id', 'teacher_id', 'school_id', 'starts_at', 'ends_at', 'is_active']);
        });
    }
};
