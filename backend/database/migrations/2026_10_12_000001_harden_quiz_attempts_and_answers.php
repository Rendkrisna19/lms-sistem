<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * - Batas waktu pengerjaan disimpan per attempt (deadline_at) agar timer dihitung di server.
     * - Satu siswa hanya boleh memiliki satu attempt per ujian.
     * - Satu jawaban per soal per attempt.
     */
    public function up(): void
    {
        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->dateTime('deadline_at')->nullable()->after('started_at');
        });

        // Bersihkan duplikat lama sebelum memasang unique index.
        // Attempt: simpan yang sudah selesai (jika ada), lalu yang paling baru.
        $duplicateAttemptGroups = DB::table('quiz_attempts')
            ->select('quiz_id', 'user_id')
            ->groupBy('quiz_id', 'user_id')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicateAttemptGroups as $group) {
            $keepId = DB::table('quiz_attempts')
                ->where('quiz_id', $group->quiz_id)
                ->where('user_id', $group->user_id)
                ->orderByRaw("CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END")
                ->orderByDesc('id')
                ->value('id');

            DB::table('quiz_attempts')
                ->where('quiz_id', $group->quiz_id)
                ->where('user_id', $group->user_id)
                ->where('id', '!=', $keepId)
                ->delete();
        }

        // Jawaban: simpan yang paling baru per soal.
        $duplicateAnswerGroups = DB::table('quiz_answers')
            ->select('attempt_id', 'question_id', DB::raw('MAX(id) as keep_id'))
            ->groupBy('attempt_id', 'question_id')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicateAnswerGroups as $group) {
            DB::table('quiz_answers')
                ->where('attempt_id', $group->attempt_id)
                ->where('question_id', $group->question_id)
                ->where('id', '!=', $group->keep_id)
                ->delete();
        }

        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->unique(['quiz_id', 'user_id'], 'quiz_attempts_quiz_user_unique');
        });

        Schema::table('quiz_answers', function (Blueprint $table) {
            $table->unique(['attempt_id', 'question_id'], 'quiz_answers_attempt_question_unique');
        });
    }

    public function down(): void
    {
        Schema::table('quiz_answers', function (Blueprint $table) {
            $table->dropUnique('quiz_answers_attempt_question_unique');
        });

        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->dropUnique('quiz_attempts_quiz_user_unique');
            $table->dropColumn('deadline_at');
        });
    }
};
