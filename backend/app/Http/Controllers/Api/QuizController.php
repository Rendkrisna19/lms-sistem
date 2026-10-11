<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\ClassSubjectAssignment;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\QuizOption;
use App\Models\QuizAttempt;
use App\Models\QuizAnswer;
use Illuminate\Http\Request;

class QuizController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Quiz::with(['course:id,title', 'lesson:id,title'])->withCount('questions');

        if ($user && $user->role === 'guru') {
            $courseIds = ClassSubjectAssignment::where('teacher_id', $user->id)->pluck('course_id')
                ->merge(Course::where('instructor_id', $user->id)->pluck('id'))
                ->unique()->filter()->values();
            if ($courseIds->isNotEmpty()) {
                $query->whereIn('course_id', $courseIds);
            }
        } elseif ($user && $user->role === 'murid' && $user->classroom_id) {
            $classCourses = ClassSubjectAssignment::where('classroom_id', $user->classroom_id)->pluck('course_id');
            if ($classCourses->isNotEmpty()) {
                $query->whereIn('course_id', $classCourses);
            }
        }

        $quizzes = $query->orderBy('id', 'desc')->get();
        return response()->json([
            'status' => 'success',
            'data' => $quizzes,
        ]);
    }

    public function show($id, Request $request)
    {
        $user = $request->user();
        $isTeacher = $user && $user->role === 'guru';

        $quiz = Quiz::with(['questions' => function ($q) use ($isTeacher) {
            $q->orderBy('order_index');
            if (!$isTeacher) {
                // Sembunyikan penjelasan sebelum submit
                $q->select('id', 'quiz_id', 'question_text', 'image_url', 'points', 'order_index');
            }
            $q->with(['options' => function ($opt) use ($isTeacher) {
                if (!$isTeacher) {
                    // Proteksi Anti-Bocor: Sembunyikan 'is_correct' dari murid saat ujian berlangsung
                    $opt->select('id', 'question_id', 'option_label', 'option_text');
                }
            }]);
        }])->findOrFail($id);

        $myAttempt = null;
        if ($user && $user->role === 'murid') {
            $myAttempt = QuizAttempt::where('quiz_id', $quiz->id)
                ->where('user_id', $user->id)
                ->latest()
                ->first();
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'quiz' => $quiz,
                'my_attempt' => $myAttempt,
            ]
        ]);
    }

    public function startAttempt($id, Request $request)
    {
        $user = $request->user();
        $quiz = Quiz::findOrFail($id);

        $existing = QuizAttempt::where('quiz_id', $quiz->id)
            ->where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->first();

        if ($existing) {
            return response()->json([
                'status' => 'success',
                'message' => 'Melanjutkan sesi ujian yang sedang berjalan.',
                'data' => $existing,
            ]);
        }

        // Cek jika sudah pernah submit
        $submitted = QuizAttempt::where('quiz_id', $quiz->id)
            ->where('user_id', $user->id)
            ->where('status', 'submitted')
            ->first();

        if ($submitted) {
            return response()->json([
                'status' => 'already_submitted',
                'message' => 'Anda sudah menyelesaikan ujian ini.',
                'data' => $submitted,
            ], 400);
        }

        $totalQuestions = $quiz->questions()->count();

        $attempt = QuizAttempt::create([
            'quiz_id' => $quiz->id,
            'user_id' => $user->id,
            'started_at' => now(),
            'total_questions' => $totalQuestions,
            'status' => 'in_progress',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Sesi ujian dimulai.',
            'data' => $attempt,
        ], 201);
    }

    public function saveAnswer($attemptId, Request $request)
    {
        $user = $request->user();
        $attempt = QuizAttempt::where('id', $attemptId)
            ->where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->firstOrFail();

        $validated = $request->validate([
            'question_id' => 'required|exists:quiz_questions,id',
            'selected_option_id' => 'required|exists:quiz_options,id',
        ]);

        $option = QuizOption::findOrFail($validated['selected_option_id']);
        $question = QuizQuestion::findOrFail($validated['question_id']);

        $isCorrect = (bool) $option->is_correct;
        $scoreAwarded = $isCorrect ? $question->points : 0;

        $answer = QuizAnswer::updateOrCreate(
            [
                'attempt_id' => $attempt->id,
                'question_id' => $question->id,
            ],
            [
                'selected_option_id' => $option->id,
                'is_correct' => $isCorrect,
                'score_awarded' => $scoreAwarded,
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Jawaban tersimpan otomatis.',
            'data' => $answer,
        ]);
    }

    public function submitAttempt($attemptId, Request $request)
    {
        $user = $request->user();
        $attempt = QuizAttempt::where('id', $attemptId)
            ->where('user_id', $user->id)
            ->with(['quiz.questions', 'answers'])
            ->firstOrFail();

        if ($attempt->status === 'submitted') {
            return response()->json([
                'status' => 'success',
                'message' => 'Ujian sudah diserahkan sebelumnya.',
                'data' => $attempt,
            ]);
        }

        $totalQuestions = $attempt->quiz->questions->count();
        $totalMaxPoints = $attempt->quiz->questions->sum('points');
        $earnedPoints = $attempt->answers->sum('score_awarded');
        $correctCount = $attempt->answers->where('is_correct', true)->count();

        // Hitung skor skala 0 - 100
        $finalScore = $totalMaxPoints > 0 ? round(($earnedPoints / $totalMaxPoints) * 100, 2) : 0;

        $attempt->update([
            'submitted_at' => now(),
            'score' => $finalScore,
            'total_correct' => $correctCount,
            'total_questions' => $totalQuestions,
            'status' => 'submitted',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Ujian berhasil diserahkan! Skor Anda telah dikalkulasi.',
            'data' => [
                'attempt_id' => $attempt->id,
                'score' => $finalScore,
                'total_correct' => $correctCount,
                'total_questions' => $totalQuestions,
                'is_passed' => $finalScore >= $attempt->quiz->passing_score,
                'passing_score' => $attempt->quiz->passing_score,
            ],
        ]);
    }

    public function grades($id, Request $request)
    {
        if ($request->user()->role !== 'guru') {
            return response()->json(['message' => 'Hanya Guru/Dosen yang dapat melihat rekap nilai.'], 403);
        }

        $quiz = Quiz::findOrFail($id);
        $attempts = QuizAttempt::with('user:id,name,email,nim_nip')
            ->where('quiz_id', $quiz->id)
            ->orderByDesc('score')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'quiz' => $quiz,
                'attempts' => $attempts,
            ]
        ]);
    }

    public function exportGrades($id, Request $request)
    {
        if ($request->user()->role !== 'guru') {
            return response()->json(['message' => 'Hanya Guru/Dosen yang dapat mengekspor rekap nilai.'], 403);
        }

        $quiz = Quiz::findOrFail($id);
        $attempts = QuizAttempt::with('user:id,name,email,nim_nip')
            ->where('quiz_id', $quiz->id)
            ->orderBy('id')
            ->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"rekap-nilai-{$quiz->id}.csv\"",
        ];

        $callback = function () use ($attempts, $quiz) {
            $handle = fopen('php://output', 'w');
            // Menulis BOM agar Excel membuka karakter UTF-8 dengan benar
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($handle, ['NO', 'NIM / NIP', 'NAMA MAHASISWA', 'EMAIL', 'BENAR', 'TOTAL SOAL', 'SKOR AKHIR', 'STATUS', 'WAKTU SELESAI']);

            $no = 1;
            foreach ($attempts as $a) {
                fputcsv($handle, [
                    $no++,
                    $a->user->nim_nip ?? '-',
                    $a->user->name,
                    $a->user->email,
                    $a->total_correct,
                    $a->total_questions,
                    $a->score ?? 0,
                    ($a->score >= $quiz->passing_score) ? 'LULUS' : 'REMIDI',
                    $a->submitted_at ? $a->submitted_at->format('d/m/Y H:i') : 'Belum Submit',
                ]);
            }
            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
