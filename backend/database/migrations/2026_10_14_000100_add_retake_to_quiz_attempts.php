<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ujian ulang (remedial): satu siswa dapat memiliki beberapa percobaan (attempt_no).
     * Guru membuka akses ulang dengan menandai attempt terakhir (retake_granted_at).
     */
    public function up(): void
    {
        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->unsignedSmallInteger('attempt_no')->default(1)->after('user_id');
            $table->dateTime('retake_granted_at')->nullable()->after('status');
            $table->foreignId('retake_granted_by')->nullable()->after('retake_granted_at')->constrained('users')->nullOnDelete();
        });

        // Index baru harus ada sebelum index lama dilepas (quiz_id masih dibutuhkan foreign key)
        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->unique(['quiz_id', 'user_id', 'attempt_no'], 'quiz_attempts_quiz_user_no_unique');
        });
        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->dropUnique('quiz_attempts_quiz_user_unique');
        });
    }

    public function down(): void
    {
        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->unique(['quiz_id', 'user_id'], 'quiz_attempts_quiz_user_unique');
        });
        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->dropUnique('quiz_attempts_quiz_user_no_unique');
            $table->dropForeign(['retake_granted_by']);
            $table->dropColumn(['attempt_no', 'retake_granted_at', 'retake_granted_by']);
        });
    }
};
