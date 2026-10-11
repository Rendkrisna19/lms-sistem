<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\QuizOption;
use App\Models\QuizAttempt;
use App\Models\ClassSubjectAssignment;
use App\Models\Classroom;
use App\Models\Course;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class TeacherQuizController extends Controller
{
    /**
     * Resolves active teacher from header, input param, or auth user.
     */
    private function resolveTeacher(Request $request): ?User
    {
        $teacher = null;
        if ($request->hasHeader('X-Teacher-Id')) {
            $teacher = User::find($request->header('X-Teacher-Id'));
        }
        if (!$teacher && $request->has('teacher_id')) {
            $teacher = User::find($request->input('teacher_id'));
        }
        if (!$teacher && $request->user()) {
            $teacher = $request->user();
        }
        if (!$teacher || $teacher->role !== 'guru') {
            $teacher = User::where('role', 'guru')->first();
        }
        return $teacher;
    }

    /**
     * Daftar ujian & kuis yang dikelola guru (lengkap dengan filter & ringkasan metrik)
     */
    public function index(Request $request)
    {
        $teacher = $this->resolveTeacher($request);
        if (!$teacher) {
            return response()->json(['status' => 'error', 'message' => 'Guru tidak ditemukan.'], 404);
        }

        // Ambil plotting mapel guru ini
        $assignments = ClassSubjectAssignment::where('teacher_id', $teacher->id)
            ->with(['classroom:id,name,code', 'course:id,title'])
            ->get();

        $assignedClassroomIds = $assignments->pluck('classroom_id')->unique()->values();
        $assignedCourseIds = $assignments->pluck('course_id')->unique()->values();

        $query = Quiz::where('teacher_id', $teacher->id)
            ->with([
                'classroom:id,name,code',
                'course:id,title',
                'questions:id,quiz_id,points',
                'attempts:id,quiz_id,user_id,score,status',
            ]);


        // Filter per Kelas
        if ($request->filled('classroom_id') && $request->classroom_id !== 'all') {
            $query->where('classroom_id', $request->classroom_id);
        }

        // Filter per Mapel
        if ($request->filled('course_id') && $request->course_id !== 'all') {
            $query->where('course_id', $request->course_id);
        }

        // Filter per Status
        if ($request->filled('status') && $request->status !== 'all') {
            $status = $request->status;
            if ($status === 'active') {
                $query->where('is_active', true)
                      ->where(function ($q) {
                          $q->whereNull('starts_at')->orWhere('starts_at', '<=', now());
                      })
                      ->where(function ($q) {
                          $q->whereNull('ends_at')->orWhere('ends_at', '>=', now());
                      });
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            } elseif ($status === 'upcoming') {
                $query->where('is_active', true)->whereNotNull('starts_at')->where('starts_at', '>', now());
            } elseif ($status === 'closed') {
                $query->where('is_active', true)->whereNotNull('ends_at')->where('ends_at', '<', now());
            }
        }

        // Pencarian Judul / Instruksi
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('instructions', 'like', "%{$search}%");
            });
        }

        $quizzes = $query->orderBy('id', 'desc')->get()->map(function ($q) {
            $attemptsCount = $q->attempts->count();
            $avgScore = $attemptsCount > 0 ? round($q->attempts->avg('score'), 1) : 0;
            $passedCount = $q->attempts->filter(fn($a) => $a->score >= $q->passing_score)->count();

            return [
                'id' => $q->id,
                'title' => $q->title,
                'instructions' => $q->instructions,
                'classroom_id' => $q->classroom_id,
                'classroom' => $q->classroom,
                'course_id' => $q->course_id,
                'course' => $q->course,
                'duration_minutes' => $q->duration_minutes,
                'passing_score' => $q->passing_score,
                'starts_at' => $q->starts_at ? $q->starts_at->toISOString() : null,
                'ends_at' => $q->ends_at ? $q->ends_at->toISOString() : null,
                'is_active' => (bool)$q->is_active,
                'status_state' => $q->status_state,
                'total_questions' => $q->questions->count(),
                'total_points' => $q->questions->sum('points'),
                'total_attempts' => $attemptsCount,
                'average_score' => $avgScore,
                'pass_rate_percentage' => $attemptsCount > 0 ? round(($passedCount / $attemptsCount) * 100) : 0,
                'created_at' => $q->created_at->toISOString(),
            ];
        });

        // Hitung statistik keseluruhan ujian milik guru ini
        $allTeacherQuizzes = Quiz::where('teacher_id', $teacher->id)
            ->with('questions:id,quiz_id', 'attempts:id,quiz_id')
            ->get();


        $summary = [
            'total' => $allTeacherQuizzes->count(),
            'total_active' => $allTeacherQuizzes->filter(fn($q) => $q->status_state === 'active')->count(),
            'total_inactive' => $allTeacherQuizzes->filter(fn($q) => $q->status_state === 'inactive')->count(),
            'total_upcoming' => $allTeacherQuizzes->filter(fn($q) => $q->status_state === 'upcoming')->count(),
            'total_closed' => $allTeacherQuizzes->filter(fn($q) => $q->status_state === 'closed')->count(),
            'total_questions' => $allTeacherQuizzes->sum(fn($q) => $q->questions->count()),
            'total_attempts' => $allTeacherQuizzes->sum(fn($q) => $q->attempts->count()),
        ];

        return response()->json([
            'status' => 'success',
            'data' => [
                'teacher' => [
                    'id' => $teacher->id,
                    'name' => $teacher->name,
                    'nip' => $teacher->nomor_induk ?? $teacher->nim_nip,
                ],
                'summary' => $summary,
                'quizzes' => $quizzes,
                'assigned_options' => $assignments->map(fn($a) => [
                    'assignment_id' => $a->id,
                    'classroom_id' => $a->classroom_id,
                    'classroom_name' => $a->classroom?->name,
                    'classroom_code' => $a->classroom?->code,
                    'course_id' => $a->course_id,
                    'course_title' => $a->course?->title,
                    'label' => "{$a->classroom?->name} ({$a->classroom?->code}) - {$a->course?->title}",
                ]),
            ],
        ]);
    }

    /**
     * Detail satu ujian lengkap dengan butir soal & opsi kunci jawaban
     */
    public function show($id, Request $request)
    {
        $teacher = $this->resolveTeacher($request);
        $quiz = Quiz::with([
            'classroom:id,name,code',
            'course:id,title',
            'questions.options',
            'attempts.user:id,name,nomor_induk,nim_nip',
        ])->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $quiz,
        ]);
    }

    /**
     * Buat Ujian / Kuis Baru beserta butir soal dan kunci jawabannya
     */
    public function store(Request $request)
    {
        $teacher = $this->resolveTeacher($request);
        if (!$teacher) {
            return response()->json(['status' => 'error', 'message' => 'Guru tidak terverifikasi.'], 403);
        }

        $validated = $request->validate([
            'classroom_id' => 'required|exists:classrooms,id',
            'course_id' => 'required|exists:courses,id',
            'title' => 'required|string|max:255',
            'instructions' => 'nullable|string',
            'duration_minutes' => 'required|integer|min:1',
            'passing_score' => 'required|integer|min:0|max:100',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date',
            'is_active' => 'nullable',
            'questions' => 'nullable|array',
        ]);

        $isActive = filter_var($request->input('is_active', true), FILTER_VALIDATE_BOOLEAN);
        $startsAt = !empty($request->input('starts_at')) ? Carbon::parse($request->input('starts_at')) : null;
        $endsAt = !empty($request->input('ends_at')) ? Carbon::parse($request->input('ends_at')) : null;

        DB::beginTransaction();
        try {
            $quiz = Quiz::create([
                'school_id' => $teacher->school_id ?? 1,
                'teacher_id' => $teacher->id,
                'classroom_id' => $validated['classroom_id'],
                'course_id' => $validated['course_id'],
                'title' => $validated['title'],
                'instructions' => $validated['instructions'] ?? null,
                'duration_minutes' => $validated['duration_minutes'],
                'passing_score' => $validated['passing_score'],
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'is_active' => $isActive,
                'is_published' => $isActive,
                'show_result_immediately' => true,
            ]);

            // Simpan Butir Soal & Opsi Jawaban jika ada
            if ($request->has('questions') && is_array($request->input('questions'))) {
                foreach ($request->input('questions') as $index => $qData) {
                    if (empty($qData['question_text'])) continue;

                    $question = QuizQuestion::create([
                        'quiz_id' => $quiz->id,
                        'question_text' => $qData['question_text'],
                        'image_url' => $qData['image_url'] ?? null,
                        'points' => $qData['points'] ?? 10,
                        'explanation' => $qData['explanation'] ?? null,
                        'order_index' => $index + 1,
                    ]);

                    if (!empty($qData['options']) && is_array($qData['options'])) {
                        foreach ($qData['options'] as $opt) {
                            QuizOption::create([
                                'question_id' => $question->id,
                                'option_label' => $opt['option_label'] ?? 'A',
                                'option_text' => $opt['option_text'] ?? '',
                                'image_url' => $opt['image_url'] ?? null,
                                'is_correct' => filter_var($opt['is_correct'] ?? false, FILTER_VALIDATE_BOOLEAN),
                            ]);
                        }
                    }
                }
            }

            DB::commit();

            $quiz->load(['classroom:id,name,code', 'course:id,title', 'questions.options']);

            return response()->json([
                'status' => 'success',
                'message' => "Ujian \"{$quiz->title}\" berhasil dibuat dan dijadwalkan.",
                'data' => $quiz,
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menyimpan ujian: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Perbarui Ujian beserta butir soal & kunci jawaban
     */
    public function update(Request $request, $id)
    {
        $teacher = $this->resolveTeacher($request);
        $quiz = Quiz::findOrFail($id);

        $validated = $request->validate([
            'classroom_id' => 'required|exists:classrooms,id',
            'course_id' => 'required|exists:courses,id',
            'title' => 'required|string|max:255',
            'instructions' => 'nullable|string',
            'duration_minutes' => 'required|integer|min:1',
            'passing_score' => 'required|integer|min:0|max:100',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date',
            'is_active' => 'nullable',
            'questions' => 'nullable|array',
        ]);

        $isActive = filter_var($request->input('is_active', $quiz->is_active), FILTER_VALIDATE_BOOLEAN);
        $startsAt = !empty($request->input('starts_at')) ? Carbon::parse($request->input('starts_at')) : null;
        $endsAt = !empty($request->input('ends_at')) ? Carbon::parse($request->input('ends_at')) : null;

        DB::beginTransaction();
        try {
            $quiz->update([
                'classroom_id' => $validated['classroom_id'],
                'course_id' => $validated['course_id'],
                'title' => $validated['title'],
                'instructions' => $validated['instructions'] ?? null,
                'duration_minutes' => $validated['duration_minutes'],
                'passing_score' => $validated['passing_score'],
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'is_active' => $isActive,
                'is_published' => $isActive,
            ]);

            // Jika ada pembaharuan butir soal
            if ($request->has('questions') && is_array($request->input('questions'))) {
                // Hapus soal lama dan gantikan dengan yang baru
                $quiz->questions()->delete();

                foreach ($request->input('questions') as $index => $qData) {
                    if (empty($qData['question_text'])) continue;

                    $question = QuizQuestion::create([
                        'quiz_id' => $quiz->id,
                        'question_text' => $qData['question_text'],
                        'image_url' => $qData['image_url'] ?? null,
                        'points' => $qData['points'] ?? 10,
                        'explanation' => $qData['explanation'] ?? null,
                        'order_index' => $index + 1,
                    ]);

                    if (!empty($qData['options']) && is_array($qData['options'])) {
                        foreach ($qData['options'] as $opt) {
                            QuizOption::create([
                                'question_id' => $question->id,
                                'option_label' => $opt['option_label'] ?? 'A',
                                'option_text' => $opt['option_text'] ?? '',
                                'image_url' => $opt['image_url'] ?? null,
                                'is_correct' => filter_var($opt['is_correct'] ?? false, FILTER_VALIDATE_BOOLEAN),
                            ]);
                        }
                    }
                }
            }

            DB::commit();

            $quiz->load(['classroom:id,name,code', 'course:id,title', 'questions.options']);

            return response()->json([
                'status' => 'success',
                'message' => "Ujian \"{$quiz->title}\" berhasil diperbarui.",
                'data' => $quiz,
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memperbarui ujian: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Toggle status aktif / nonaktif ujian
     */
    public function toggleStatus(Request $request, $id)
    {
        $teacher = $this->resolveTeacher($request);
        $quiz = Quiz::findOrFail($id);

        $quiz->is_active = !$quiz->is_active;
        $quiz->is_published = $quiz->is_active;
        $quiz->save();
        $quiz->load(['classroom:id,name,code', 'course:id,title']);

        $statusText = $quiz->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return response()->json([
            'status' => 'success',
            'message' => "Ujian \"{$quiz->title}\" berhasil {$statusText}.",
            'data' => $quiz,
        ]);
    }

    /**
     * Hapus Ujian
     */
    public function destroy(Request $request, $id)
    {
        $teacher = $this->resolveTeacher($request);
        $quiz = Quiz::findOrFail($id);

        $quizTitle = $quiz->title;
        $quiz->delete();

        return response()->json([
            'status' => 'success',
            'message' => "Ujian \"{$quizTitle}\" berhasil dihapus.",
        ]);
    }

    /**
     * Unggah Gambar untuk Soal / Opsi Jawaban
     */
    public function uploadImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp,svg|max:5120', // Maks 5MB
        ]);

        $file = $request->file('image');
        $path = $file->store('quiz_images', 'public');
        $url = asset('storage/' . $path);

        return response()->json([
            'status' => 'success',
            'message' => 'Gambar berhasil diunggah.',
            'url' => $url,
            'file_name' => $file->getClientOriginalName(),
        ]);
    }

    /**
     * Endpoint untuk Siswa di CBT Ujian Online
     */
    public function studentQuizzes(Request $request)
    {
        $student = $request->user();
        if (!$student || $student->role !== 'murid') {
            $student = User::where('role', 'murid')->first();
        }

        if (!$student || !$student->classroom_id) {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'classroom' => null,
                    'quizzes' => [],
                ],
            ]);
        }

        $classroom = Classroom::find($student->classroom_id);

        $quizzes = Quiz::where('classroom_id', $student->classroom_id)
            ->where('is_active', true)
            ->with([
                'course:id,title',
                'teacher:id,name',
                'questions:id,quiz_id,points',
                'attempts' => fn($q) => $q->where('user_id', $student->id),
            ])
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($q) {
                $myAttempt = $q->attempts->first();
                return [
                    'id' => $q->id,
                    'title' => $q->title,
                    'instructions' => $q->instructions,
                    'course' => $q->course,
                    'teacher' => $q->teacher,
                    'duration_minutes' => $q->duration_minutes,
                    'passing_score' => $q->passing_score,
                    'starts_at' => $q->starts_at ? $q->starts_at->toISOString() : null,
                    'ends_at' => $q->ends_at ? $q->ends_at->toISOString() : null,
                    'status_state' => $q->status_state,
                    'total_questions' => $q->questions->count(),
                    'has_attempted' => !is_null($myAttempt),
                    'attempt_score' => $myAttempt?->score,
                    'is_passed' => $myAttempt?->is_passed,
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => [
                'classroom' => [
                    'id' => $classroom?->id,
                    'name' => $classroom?->name,
                    'code' => $classroom?->code,
                ],
                'quizzes' => $quizzes,
            ],
        ]);
    }
}
