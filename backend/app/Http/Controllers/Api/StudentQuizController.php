<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\QuizOption;
use App\Support\QuizGrader;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;

/**
 * Ruang ujian siswa (CBT). Seluruh aturan (kelas, jadwal, durasi, satu kali pengerjaan,
 * penilaian) ditegakkan di server; kunci jawaban tidak pernah dikirim ke siswa.
 */
class StudentQuizController extends Controller
{
    public function __construct(private QuizGrader $grader)
    {
    }

    /**
     * Daftar ujian untuk kelas siswa beserta status pengerjaannya.
     */
    public function index(Request $request)
    {
        $student = $request->user();

        if (!$student->classroom_id) {
            return response()->json([
                'status' => 'success',
                'data' => ['classroom' => null, 'quizzes' => []],
            ]);
        }

        $quizzes = Quiz::where('classroom_id', $student->classroom_id)
            ->where('is_active', true)
            ->with([
                'course:id,title',
                'teacher:id,name',
                'attempts' => fn ($q) => $q->where('user_id', $student->id),
            ])
            ->withCount('questions')
            ->withSum('questions as total_points', 'points')
            ->orderByRaw('CASE WHEN starts_at IS NULL THEN 0 ELSE 1 END')
            ->orderByDesc('starts_at')
            ->orderByDesc('id')
            ->get()
            ->map(function (Quiz $quiz) {
                $attempt = $quiz->attempts->first();
                if ($attempt) {
                    $attempt->setRelation('quiz', $quiz);
                    $attempt = $this->grader->finalizeIfExpired($attempt);
                }

                return [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'instructions' => $quiz->instructions,
                    'course' => $quiz->course,
                    'teacher' => $quiz->teacher,
                    'duration_minutes' => $quiz->duration_minutes,
                    'passing_score' => $quiz->passing_score,
                    'starts_at' => $quiz->starts_at?->toIso8601String(),
                    'ends_at' => $quiz->ends_at?->toIso8601String(),
                    'status_state' => $quiz->status_state,
                    'total_questions' => (int) $quiz->questions_count,
                    'total_points' => (int) $quiz->total_points,
                    'show_result_immediately' => (bool) $quiz->show_result_immediately,
                    'attempt' => $attempt ? $this->formatAttemptSummary($attempt, $quiz) : null,
                    'can_start' => $this->canStart($quiz, $attempt),
                ];
            });

        $classroom = $student->classroom()->first(['id', 'name', 'code']);

        return response()->json([
            'status' => 'success',
            'data' => [
                'classroom' => $classroom,
                'quizzes' => $quizzes->values(),
                'server_time' => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Memulai (atau melanjutkan) sesi ujian. Mengembalikan soal tanpa kunci jawaban,
     * jawaban yang sudah tersimpan, dan batas waktu dari server.
     */
    public function start(Request $request, $id)
    {
        $student = $request->user();
        $quiz = $this->accessibleQuiz($request, $id);

        $attempt = QuizAttempt::where('quiz_id', $quiz->id)->where('user_id', $student->id)->first();

        if ($attempt) {
            $attempt->setRelation('quiz', $quiz);
            $attempt = $this->grader->finalizeIfExpired($attempt);

            if ($attempt->isFinished()) {
                return response()->json([
                    'status' => 'already_finished',
                    'message' => 'Anda sudah menyelesaikan ujian ini.',
                    'data' => ['attempt' => $this->formatAttemptSummary($attempt, $quiz)],
                ], 409);
            }
        } else {
            if ($quiz->status_state === 'upcoming') {
                return $this->error('Ujian belum dibuka. Silakan kembali sesuai jadwal.', 403);
            }
            if ($quiz->status_state === 'closed') {
                return $this->error('Jadwal ujian sudah ditutup.', 403);
            }

            $totalQuestions = $quiz->questions()->count();
            if ($totalQuestions === 0) {
                return $this->error('Ujian ini belum memiliki butir soal.', 422);
            }

            $deadline = now()->addMinutes($quiz->duration_minutes);
            if ($quiz->ends_at && $quiz->ends_at->lessThan($deadline)) {
                $deadline = $quiz->ends_at->copy();
            }

            try {
                $attempt = QuizAttempt::create([
                    'quiz_id' => $quiz->id,
                    'user_id' => $student->id,
                    'started_at' => now(),
                    'deadline_at' => $deadline,
                    'total_questions' => $totalQuestions,
                    'status' => 'in_progress',
                ]);
            } catch (UniqueConstraintViolationException) {
                // Permintaan ganda bersamaan: gunakan attempt yang sudah dibuat
                $attempt = QuizAttempt::where('quiz_id', $quiz->id)->where('user_id', $student->id)->firstOrFail();
            }
        }

        $quiz->load(['course:id,title', 'questions' => function ($q) {
            $q->select('id', 'quiz_id', 'question_text', 'image_url', 'points', 'order_index')
                ->with(['options' => fn ($opt) => $opt->select('id', 'question_id', 'option_label', 'option_text', 'image_url')]);
        }]);

        $answers = QuizAnswer::where('attempt_id', $attempt->id)
            ->whereNotNull('selected_option_id')
            ->pluck('selected_option_id', 'question_id');

        return response()->json([
            'status' => 'success',
            'message' => $attempt->wasRecentlyCreated ? 'Sesi ujian dimulai.' : 'Melanjutkan sesi ujian yang sedang berjalan.',
            'data' => [
                'attempt' => [
                    'id' => $attempt->id,
                    'status' => $attempt->status,
                    'started_at' => $attempt->started_at?->toIso8601String(),
                    'deadline_at' => $attempt->deadline_at?->toIso8601String(),
                ],
                'server_time' => now()->toIso8601String(),
                'quiz' => [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'instructions' => $quiz->instructions,
                    'course' => $quiz->course,
                    'duration_minutes' => $quiz->duration_minutes,
                    'passing_score' => $quiz->passing_score,
                    'total_questions' => $quiz->questions->count(),
                    'total_points' => (int) $quiz->questions->sum('points'),
                ],
                'questions' => $quiz->questions->map(fn ($question) => [
                    'id' => $question->id,
                    'question_text' => $question->question_text,
                    'image_url' => $question->image_url,
                    'points' => $question->points,
                    'order_index' => $question->order_index,
                    'options' => $question->options->map(fn ($option) => [
                        'id' => $option->id,
                        'option_label' => $option->option_label,
                        'option_text' => $option->option_text,
                        'image_url' => $option->image_url,
                    ])->values(),
                ])->values(),
                'answers' => (object) $answers->all(),
            ],
        ], $attempt->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * Simpan (auto-save) satu jawaban. Tidak pernah memberi tahu benar / salah.
     */
    public function saveAnswer(Request $request, $attemptId)
    {
        $attempt = $this->ownAttempt($request, $attemptId);

        if ($attempt->isFinished()) {
            return $this->error('Ujian sudah dikumpulkan. Jawaban tidak dapat diubah.', 409);
        }

        if ($attempt->isExpired()) {
            $attempt = $this->grader->finalize($attempt, 'timed_out');
            return response()->json([
                'status' => 'time_up',
                'message' => 'Waktu pengerjaan telah habis. Ujian dikumpulkan otomatis.',
                'data' => ['attempt' => $this->formatAttemptSummary($attempt, $attempt->quiz)],
            ], 409);
        }

        $validated = $request->validate([
            'question_id' => 'required|integer',
            'selected_option_id' => 'nullable|integer',
        ]);

        $questionBelongsToQuiz = $attempt->quiz->questions()->whereKey($validated['question_id'])->exists();
        if (!$questionBelongsToQuiz) {
            return $this->error('Soal tidak ditemukan pada ujian ini.', 422);
        }

        if (!empty($validated['selected_option_id'])) {
            $optionBelongsToQuestion = QuizOption::whereKey($validated['selected_option_id'])
                ->where('question_id', $validated['question_id'])
                ->exists();
            if (!$optionBelongsToQuestion) {
                return $this->error('Pilihan jawaban tidak valid untuk soal ini.', 422);
            }
        }

        QuizAnswer::upsert(
            [[
                'attempt_id' => $attempt->id,
                'question_id' => (int) $validated['question_id'],
                'selected_option_id' => $validated['selected_option_id'] ?: null,
                'is_correct' => false,
                'score_awarded' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]],
            ['attempt_id', 'question_id'],
            ['selected_option_id', 'updated_at']
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Jawaban tersimpan.',
            'data' => [
                'question_id' => (int) $validated['question_id'],
                'selected_option_id' => $validated['selected_option_id'] ?: null,
                'saved_at' => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Kumpulkan ujian & hitung skor di server (idempoten).
     */
    public function submit(Request $request, $attemptId)
    {
        $attempt = $this->ownAttempt($request, $attemptId);

        if (!$attempt->isFinished()) {
            $attempt = $this->grader->finalize($attempt, $attempt->isExpired() ? 'timed_out' : 'submitted');
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Ujian berhasil dikumpulkan.',
            'data' => ['attempt' => $this->formatAttemptSummary($attempt, $attempt->quiz)],
        ]);
    }

    /**
     * Hasil pengerjaan milik siswa sendiri.
     */
    public function result(Request $request, $attemptId)
    {
        $attempt = $this->ownAttempt($request, $attemptId);
        $attempt = $this->grader->finalizeIfExpired($attempt);
        $quiz = $attempt->quiz->loadMissing('course:id,title');

        return response()->json([
            'status' => 'success',
            'data' => [
                'quiz' => [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'course' => $quiz->course,
                    'passing_score' => $quiz->passing_score,
                ],
                'attempt' => $this->formatAttemptSummary($attempt, $quiz),
            ],
        ]);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private function accessibleQuiz(Request $request, $id): Quiz
    {
        $student = $request->user();

        return Quiz::where('classroom_id', $student->classroom_id)
            ->whereNotNull('classroom_id')
            ->where('is_active', true)
            ->findOrFail($id);
    }

    private function ownAttempt(Request $request, $attemptId): QuizAttempt
    {
        return QuizAttempt::where('user_id', $request->user()->id)
            ->with('quiz')
            ->findOrFail($attemptId);
    }

    private function canStart(Quiz $quiz, ?QuizAttempt $attempt): bool
    {
        if ($attempt) {
            return !$attempt->isFinished();
        }
        return $quiz->status_state === 'active' && $quiz->questions_count > 0;
    }

    private function formatAttemptSummary(QuizAttempt $attempt, Quiz $quiz): array
    {
        $showResult = (bool) $quiz->show_result_immediately;
        $finished = $attempt->isFinished();

        return [
            'id' => $attempt->id,
            'status' => $attempt->status,
            'started_at' => $attempt->started_at?->toIso8601String(),
            'deadline_at' => $attempt->deadline_at?->toIso8601String(),
            'submitted_at' => $attempt->submitted_at?->toIso8601String(),
            'result_visible' => $finished && $showResult,
            'score' => $finished && $showResult ? (float) $attempt->score : null,
            'total_correct' => $finished && $showResult ? $attempt->total_correct : null,
            'total_questions' => $attempt->total_questions,
            'passing_score' => $quiz->passing_score,
            'is_passed' => $finished && $showResult ? $attempt->score >= $quiz->passing_score : null,
        ];
    }

    private function error(string $message, int $status)
    {
        return response()->json(['status' => 'error', 'message' => $message], $status);
    }
}
