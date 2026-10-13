<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Attempt yang dibuat sebelum kolom deadline_at ada:
     * - isi deadline_at = started_at + durasi ujian (agar timer server tetap berlaku),
     * - attempt yang sudah memiliki submitted_at + skor namun masih 'in_progress' ditandai 'submitted'.
     */
    public function up(): void
    {
        $attempts = DB::table('quiz_attempts')
            ->join('quizzes', 'quizzes.id', '=', 'quiz_attempts.quiz_id')
            ->whereNull('quiz_attempts.deadline_at')
            ->whereNotNull('quiz_attempts.started_at')
            ->select('quiz_attempts.id', 'quiz_attempts.started_at', 'quizzes.duration_minutes')
            ->get();

        foreach ($attempts as $attempt) {
            DB::table('quiz_attempts')->where('id', $attempt->id)->update([
                'deadline_at' => Carbon::parse($attempt->started_at)
                    ->addMinutes((int) $attempt->duration_minutes),
            ]);
        }

        DB::table('quiz_attempts')
            ->where('status', 'in_progress')
            ->whereNotNull('submitted_at')
            ->whereNotNull('score')
            ->update(['status' => 'submitted']);
    }

    public function down(): void
    {
        // Perbaikan data; tidak dibalik.
    }
};
