<?php

namespace App\Support;

use App\Models\QuizAttempt;
use Closure;

/**
 * Statistik nilai ujian berbasis query agregat (tanpa memuat seluruh attempt ke memori).
 * Hanya menghitung attempt yang sudah selesai (status selain in_progress) dan memiliki nilai.
 */
class AttemptStats
{
    /**
     * @param  Closure|null  $scope  menerima query builder quiz_attempts (sudah di-join dengan quizzes)
     * @return array{total:int, passed:int, average_score:float, pass_rate:float}
     */
    public static function summarize(?Closure $scope = null): array
    {
        $query = QuizAttempt::query()
            ->join('quizzes', 'quizzes.id', '=', 'quiz_attempts.quiz_id')
            ->where('quiz_attempts.status', '!=', 'in_progress')
            ->whereNotNull('quiz_attempts.score');

        if ($scope) {
            $scope($query);
        }

        $row = $query->toBase()
            ->selectRaw('COUNT(*) as total_attempts')
            ->selectRaw('AVG(quiz_attempts.score) as avg_score')
            ->selectRaw('SUM(CASE WHEN quiz_attempts.score >= COALESCE(quizzes.passing_score, 70) THEN 1 ELSE 0 END) as passed_attempts')
            ->first();

        $total = (int) ($row->total_attempts ?? 0);
        $passed = (int) ($row->passed_attempts ?? 0);

        return [
            'total' => $total,
            'passed' => $passed,
            'average_score' => $total > 0 ? round((float) $row->avg_score, 1) : 0,
            'pass_rate' => $total > 0 ? round(($passed / $total) * 100, 1) : 0,
        ];
    }
}
