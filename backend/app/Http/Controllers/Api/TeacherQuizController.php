<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveQuizRequest;
use App\Models\ClassSubjectAssignment;
use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\User;
use App\Support\QuizQuestionSync;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TeacherQuizController extends Controller
{
    public function __construct(private QuizQuestionSync $questionSync)
    {
    }

    /**
     * Daftar ujian milik guru yang login beserta ringkasan metrik.
     */
    public function index(Request $request)
    {
        $teacher = $request->user();

        $quizzes = Quiz::where('teacher_id', $teacher->id)
            ->with(['classroom:id,name,code', 'course:id,title'])
            ->withCount([
                'questions',
                'attempts as finished_attempts_count' => fn ($q) => $q->where('status', '!=', 'in_progress'),
                'attempts as passed_attempts_count' => fn ($q) => $q->where('status', '!=', 'in_progress')
                    ->whereColumn('quiz_attempts.score', '>=', 'quizzes.passing_score'),
            ])
            ->withSum('questions as total_points', 'points')
            ->withAvg(['attempts as average_score' => fn ($q) => $q->where('status', '!=', 'in_progress')], 'score')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Quiz $quiz) => $this->formatListItem($quiz));

        $summary = [
            'total' => $quizzes->count(),
            'total_active' => $quizzes->where('status_state', 'active')->count(),
            'total_inactive' => $quizzes->where('status_state', 'inactive')->count(),
            'total_upcoming' => $quizzes->where('status_state', 'upcoming')->count(),
            'total_closed' => $quizzes->where('status_state', 'closed')->count(),
            'total_questions' => $quizzes->sum('total_questions'),
            'total_attempts' => $quizzes->sum('total_attempts'),
        ];

        return response()->json([
            'status' => 'success',
            'data' => [
                'summary' => $summary,
                'quizzes' => $quizzes->values(),
                'assigned_options' => $this->assignedOptions($teacher->id),
            ],
        ]);
    }

    /**
     * Pilihan kelas & mapel (plotting) yang boleh dipakai guru saat membuat ujian.
     */
    public function options(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'data' => [
                'assigned_options' => $this->assignedOptions($request->user()->id),
                'limits' => [
                    'min_options' => SaveQuizRequest::MIN_OPTIONS,
                    'max_options' => SaveQuizRequest::MAX_OPTIONS,
                ],
            ],
        ]);
    }

    /**
     * Detail satu ujian lengkap dengan butir soal & kunci jawaban (khusus pemilik).
     */
    public function show(Request $request, $id)
    {
        $quiz = $this->ownQuiz($request, $id)
            ->load(['classroom:id,name,code', 'course:id,title', 'questions.options'])
            ->loadCount([
                'attempts',
                'attempts as finished_attempts_count' => fn ($q) => $q->where('status', '!=', 'in_progress'),
            ]);

        return response()->json([
            'status' => 'success',
            'data' => $this->formatDetail($quiz),
        ]);
    }

    /**
     * Buat ujian baru beserta butir soal & kunci jawaban.
     */
    public function store(SaveQuizRequest $request)
    {
        $teacher = $request->user();

        $quiz = DB::transaction(function () use ($request, $teacher) {
            $quiz = Quiz::create($this->quizAttributes($request) + [
                'school_id' => $teacher->school_id,
                'teacher_id' => $teacher->id,
            ]);
            $this->questionSync->sync($quiz, $request->input('questions', []));
            return $quiz;
        });

        $quiz->load(['classroom:id,name,code', 'course:id,title', 'questions.options'])
            ->loadCount(['attempts', 'attempts as finished_attempts_count' => fn ($q) => $q->where('status', '!=', 'in_progress')]);

        return response()->json([
            'status' => 'success',
            'message' => "Ujian \"{$quiz->title}\" berhasil dibuat.",
            'data' => $this->formatDetail($quiz),
        ], 201);
    }

    /**
     * Perbarui ujian. Soal disinkronkan berdasarkan ID sehingga jawaban siswa tidak hilang.
     */
    public function update(SaveQuizRequest $request, $id)
    {
        $quiz = $this->ownQuiz($request, $id);

        DB::transaction(function () use ($request, $quiz) {
            $quiz->update($this->quizAttributes($request));
            $this->questionSync->sync($quiz, $request->input('questions', []));
        });

        $quiz->refresh()
            ->load(['classroom:id,name,code', 'course:id,title', 'questions.options'])
            ->loadCount(['attempts', 'attempts as finished_attempts_count' => fn ($q) => $q->where('status', '!=', 'in_progress')]);

        return response()->json([
            'status' => 'success',
            'message' => "Ujian \"{$quiz->title}\" berhasil diperbarui.",
            'data' => $this->formatDetail($quiz),
        ]);
    }

    /**
     * Toggle status aktif / nonaktif ujian.
     */
    public function toggleStatus(Request $request, $id)
    {
        $quiz = $this->ownQuiz($request, $id);
        $quiz->is_active = !$quiz->is_active;
        $quiz->is_published = $quiz->is_active;
        $quiz->save();

        $statusText = $quiz->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return response()->json([
            'status' => 'success',
            'message' => "Ujian \"{$quiz->title}\" berhasil {$statusText}.",
            'data' => [
                'id' => $quiz->id,
                'is_active' => $quiz->is_active,
                'status_state' => $quiz->status_state,
            ],
        ]);
    }

    /**
     * Hapus ujian beserta soal & riwayat pengerjaannya.
     */
    public function destroy(Request $request, $id)
    {
        $quiz = $this->ownQuiz($request, $id);
        $title = $quiz->title;
        $quiz->delete();

        return response()->json([
            'status' => 'success',
            'message' => "Ujian \"{$title}\" berhasil dihapus.",
        ]);
    }

    /**
     * Unggah gambar untuk soal / opsi jawaban / pembahasan.
     */
    public function uploadImage(Request $request)
    {
        $request->validate([
            // SVG sengaja tidak diizinkan karena dapat memuat skrip (XSS)
            'image' => 'required|file|mimes:jpeg,jpg,png,gif,webp|mimetypes:image/jpeg,image/png,image/gif,image/webp|max:5120|dimensions:max_width=8000,max_height=8000',
        ], [
            'image.mimes' => 'Format gambar harus JPG, PNG, GIF, atau WEBP.',
            'image.mimetypes' => 'Format gambar harus JPG, PNG, GIF, atau WEBP.',
            'image.max' => 'Ukuran gambar maksimal 5 MB.',
        ]);

        $file = $request->file('image');
        $extension = match ($file->getMimeType()) {
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            default => 'jpg',
        };
        $path = $file->storeAs('quiz_images', Str::random(40) . '.' . $extension, 'public');

        return response()->json([
            'status' => 'success',
            'message' => 'Gambar berhasil diunggah.',
            'url' => asset('storage/' . $path),
        ]);
    }

    /**
     * Rekap nilai satu ujian + analisis butir soal (tingkat kesulitan).
     */
    public function grades(Request $request, $id)
    {
        $quiz = $this->ownQuiz($request, $id)->load(['classroom:id,name,code', 'course:id,title']);

        $students = $quiz->classroom_id
            ? User::where('role', 'murid')->where('classroom_id', $quiz->classroom_id)
                ->orderBy('name')->get(['id', 'name', 'nomor_induk', 'nim_nip'])
            : collect();

        $attempts = QuizAttempt::where('quiz_id', $quiz->id)->get()->keyBy('user_id');

        $rows = $students->map(function ($student) use ($attempts, $quiz) {
            $attempt = $attempts->get($student->id);
            return [
                'student_id' => $student->id,
                'name' => $student->name,
                'nomor_induk' => $student->nomor_induk ?? $student->nim_nip,
                'attempt_id' => $attempt?->id,
                'status' => $attempt?->status ?? 'not_started',
                'score' => $attempt && $attempt->isFinished() ? (float) $attempt->score : null,
                'total_correct' => $attempt?->total_correct,
                'total_questions' => $attempt?->total_questions,
                'is_passed' => $attempt && $attempt->isFinished() ? $attempt->score >= $quiz->passing_score : null,
                'started_at' => $attempt?->started_at?->toIso8601String(),
                'submitted_at' => $attempt?->submitted_at?->toIso8601String(),
            ];
        })->values();

        $finished = $rows->filter(fn ($row) => $row['score'] !== null);

        $finishedAttemptIds = $attempts->filter(fn ($a) => $a->isFinished())->pluck('id');
        $answerStats = QuizAnswer::whereIn('attempt_id', $finishedAttemptIds)
            ->select('question_id', DB::raw('COUNT(*) as answered'), DB::raw('SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct'))
            ->groupBy('question_id')
            ->get()
            ->keyBy('question_id');

        $itemAnalysis = $quiz->questions()->get(['id', 'question_text', 'order_index', 'points'])
            ->map(function ($question) use ($answerStats, $finishedAttemptIds) {
                $stat = $answerStats->get($question->id);
                $correct = (int) ($stat->correct ?? 0);
                $total = $finishedAttemptIds->count();
                $rate = $total > 0 ? round(($correct / $total) * 100, 1) : null;

                return [
                    'question_id' => $question->id,
                    'number' => $question->order_index,
                    'excerpt' => Str::limit(trim(html_entity_decode(strip_tags($question->question_text))), 120),
                    'points' => $question->points,
                    'answered' => (int) ($stat->answered ?? 0),
                    'correct' => $correct,
                    'correct_rate' => $rate,
                    'difficulty' => $rate === null ? null : ($rate >= 70 ? 'mudah' : ($rate >= 40 ? 'sedang' : 'sulit')),
                ];
            })->values();

        return response()->json([
            'status' => 'success',
            'data' => [
                'quiz' => [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'passing_score' => $quiz->passing_score,
                    'classroom' => $quiz->classroom,
                    'course' => $quiz->course,
                    'status_state' => $quiz->status_state,
                ],
                'summary' => [
                    'total_students' => $rows->count(),
                    'finished' => $finished->count(),
                    'in_progress' => $rows->where('status', 'in_progress')->count(),
                    'not_started' => $rows->where('status', 'not_started')->count(),
                    'average_score' => $finished->count() > 0 ? round($finished->avg('score'), 2) : null,
                    'highest_score' => $finished->max('score'),
                    'lowest_score' => $finished->min('score'),
                    'passed' => $finished->where('is_passed', true)->count(),
                    'failed' => $finished->where('is_passed', false)->count(),
                ],
                'students' => $rows,
                'item_analysis' => $itemAnalysis,
            ],
        ]);
    }

    /**
     * Ekspor rekap nilai satu ujian ke CSV (dapat dibuka di Excel).
     */
    public function exportGrades(Request $request, $id)
    {
        $payload = $this->grades($request, $id)->getData(true)['data'];
        $quiz = $payload['quiz'];
        $fileName = 'rekap-nilai-' . Str::slug($quiz['title']) . '-' . now()->format('Ymd-His') . '.csv';

        return response()->streamDownload(function () use ($payload) {
            $handle = fopen('php://output', 'w');
            // BOM agar Excel membaca UTF-8 dengan benar
            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, ['NO', 'NIS', 'NAMA SISWA', 'STATUS', 'BENAR', 'TOTAL SOAL', 'NILAI', 'KETERANGAN', 'WAKTU SELESAI']);

            $statusLabels = [
                'submitted' => 'Selesai',
                'timed_out' => 'Waktu Habis',
                'in_progress' => 'Sedang Mengerjakan',
                'not_started' => 'Belum Mengerjakan',
            ];

            foreach ($payload['students'] as $index => $row) {
                fputcsv($handle, array_map(fn ($value) => $this->csvSafe($value), [
                    $index + 1,
                    $row['nomor_induk'] ?? '-',
                    $row['name'],
                    $statusLabels[$row['status']] ?? $row['status'],
                    $row['total_correct'] ?? '-',
                    $row['total_questions'] ?? '-',
                    $row['score'] ?? '-',
                    $row['is_passed'] === null ? '-' : ($row['is_passed'] ? 'LULUS' : 'REMEDIAL'),
                    $row['submitted_at'] ? Carbon::parse($row['submitted_at'])->format('d/m/Y H:i') : '-',
                ]));
            }

            fclose($handle);
        }, $fileName, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private function ownQuiz(Request $request, $id): Quiz
    {
        return Quiz::where('teacher_id', $request->user()->id)->findOrFail($id);
    }

    private function quizAttributes(SaveQuizRequest $request): array
    {
        $isActive = $request->boolean('is_active');

        return [
            'classroom_id' => (int) $request->input('classroom_id'),
            'course_id' => (int) $request->input('course_id'),
            'title' => trim($request->input('title')),
            'instructions' => $request->filled('instructions') ? trim($request->input('instructions')) : null,
            'duration_minutes' => (int) $request->input('duration_minutes'),
            'passing_score' => (int) $request->input('passing_score'),
            'starts_at' => $request->scheduleValue('starts_at'),
            'ends_at' => $request->scheduleValue('ends_at'),
            'is_active' => $isActive,
            'is_published' => $isActive,
            'show_result_immediately' => $request->boolean('show_result_immediately'),
        ];
    }

    private function assignedOptions(int $teacherId)
    {
        return ClassSubjectAssignment::where('teacher_id', $teacherId)
            ->with(['classroom:id,name,code', 'course:id,title'])
            ->get()
            ->filter(fn ($a) => $a->classroom && $a->course)
            ->map(fn ($a) => [
                'assignment_id' => $a->id,
                'classroom_id' => $a->classroom_id,
                'classroom_name' => $a->classroom->name,
                'classroom_code' => $a->classroom->code,
                'course_id' => $a->course_id,
                'course_title' => $a->course->title,
                'label' => "{$a->classroom->name} ({$a->classroom->code}) — {$a->course->title}",
            ])
            ->values();
    }

    private function formatListItem(Quiz $quiz): array
    {
        $finished = (int) $quiz->finished_attempts_count;

        return [
            'id' => $quiz->id,
            'title' => $quiz->title,
            'instructions' => $quiz->instructions,
            'classroom_id' => $quiz->classroom_id,
            'classroom' => $quiz->classroom,
            'course_id' => $quiz->course_id,
            'course' => $quiz->course,
            'duration_minutes' => $quiz->duration_minutes,
            'passing_score' => $quiz->passing_score,
            'starts_at' => $quiz->starts_at?->toIso8601String(),
            'ends_at' => $quiz->ends_at?->toIso8601String(),
            'is_active' => (bool) $quiz->is_active,
            'show_result_immediately' => (bool) $quiz->show_result_immediately,
            'status_state' => $quiz->status_state,
            'total_questions' => (int) $quiz->questions_count,
            'total_points' => (int) $quiz->total_points,
            'total_attempts' => $finished,
            'average_score' => $finished > 0 ? round((float) $quiz->average_score, 1) : null,
            'pass_rate_percentage' => $finished > 0 ? (int) round(($quiz->passed_attempts_count / $finished) * 100) : null,
            'created_at' => $quiz->created_at?->toIso8601String(),
            'updated_at' => $quiz->updated_at?->toIso8601String(),
        ];
    }

    private function formatDetail(Quiz $quiz): array
    {
        return [
            'id' => $quiz->id,
            'title' => $quiz->title,
            'instructions' => $quiz->instructions,
            'classroom_id' => $quiz->classroom_id,
            'classroom' => $quiz->classroom,
            'course_id' => $quiz->course_id,
            'course' => $quiz->course,
            'duration_minutes' => $quiz->duration_minutes,
            'passing_score' => $quiz->passing_score,
            'starts_at' => $quiz->starts_at?->toIso8601String(),
            'ends_at' => $quiz->ends_at?->toIso8601String(),
            'is_active' => (bool) $quiz->is_active,
            'show_result_immediately' => (bool) $quiz->show_result_immediately,
            'status_state' => $quiz->status_state,
            'attempts_count' => (int) ($quiz->attempts_count ?? 0),
            'finished_attempts_count' => (int) ($quiz->finished_attempts_count ?? 0),
            'total_points' => (int) $quiz->questions->sum('points'),
            'questions' => $quiz->questions->map(fn ($question) => [
                'id' => $question->id,
                'question_text' => $question->question_text,
                'image_url' => $question->image_url,
                'points' => $question->points,
                'explanation' => $question->explanation,
                'order_index' => $question->order_index,
                'options' => $question->options->map(fn ($option) => [
                    'id' => $option->id,
                    'option_label' => $option->option_label,
                    'option_text' => $option->option_text,
                    'image_url' => $option->image_url,
                    'is_correct' => (bool) $option->is_correct,
                ])->values(),
            ])->values(),
            'updated_at' => $quiz->updated_at?->toIso8601String(),
        ];
    }

    /** Mencegah formula injection saat CSV dibuka di Excel. */
    private function csvSafe($value)
    {
        if (is_string($value) && $value !== '' && in_array($value[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
            return "'" . $value;
        }
        return $value;
    }
}
