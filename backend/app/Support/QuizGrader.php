<?php

namespace App\Support;

use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\QuizOption;
use Illuminate\Support\Facades\DB;

/**
 * Mesin penilaian otomatis. Skor dihitung dari kunci jawaban saat attempt diselesaikan,
 * bukan dari data yang dikirim browser.
 */
class QuizGrader
{
    /**
     * Menyelesaikan attempt dan menghitung skornya (idempoten).
     *
     * @param  string  $status  'submitted' (dikumpulkan siswa) atau 'timed_out' (waktu habis)
     */
    public function finalize(QuizAttempt $attempt, string $status = 'submitted'): QuizAttempt
    {
        return DB::transaction(function () use ($attempt, $status) {
            /** @var QuizAttempt $locked */
            $locked = QuizAttempt::whereKey($attempt->id)->lockForUpdate()->firstOrFail();

            if ($locked->isFinished()) {
                return $locked->load('quiz');
            }

            $quiz = $locked->quiz()->with('questions:id,quiz_id,points')->firstOrFail();
            $questions = $quiz->questions->keyBy('id');

            $correctOptionIds = QuizOption::whereIn('question_id', $questions->keys())
                ->where('is_correct', true)
                ->pluck('id', 'question_id');

            $answers = QuizAnswer::where('attempt_id', $locked->id)->get();

            $earnedPoints = 0;
            $correctCount = 0;

            foreach ($answers as $answer) {
                $question = $questions->get($answer->question_id);
                $isCorrect = $question !== null
                    && $answer->selected_option_id !== null
                    && (int) $correctOptionIds->get($answer->question_id) === (int) $answer->selected_option_id;

                $scoreAwarded = $isCorrect ? (int) $question->points : 0;
                $earnedPoints += $scoreAwarded;
                $correctCount += $isCorrect ? 1 : 0;

                if ($answer->is_correct !== $isCorrect || (int) $answer->score_awarded !== $scoreAwarded) {
                    $answer->update(['is_correct' => $isCorrect, 'score_awarded' => $scoreAwarded]);
                }
            }

            $maxPoints = (int) $questions->sum('points');
            $score = $maxPoints > 0 ? round(($earnedPoints / $maxPoints) * 100, 2) : 0;

            $locked->update([
                'submitted_at' => now(),
                'score' => $score,
                'total_correct' => $correctCount,
                'total_questions' => $questions->count(),
                'status' => $status,
            ]);

            return $locked->setRelation('quiz', $quiz);
        });
    }

    /** Menutup attempt yang waktunya sudah habis namun belum dikumpulkan. */
    public function finalizeIfExpired(QuizAttempt $attempt): QuizAttempt
    {
        if (!$attempt->isFinished() && $attempt->isExpired()) {
            return $this->finalize($attempt, 'timed_out');
        }
        return $attempt;
    }
}
