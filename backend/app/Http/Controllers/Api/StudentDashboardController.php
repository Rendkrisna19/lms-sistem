<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\ClassSubjectAssignment;
use App\Models\LearningMaterial;
use App\Models\MaterialAccess;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use App\Support\AttemptStats;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class StudentDashboardController extends Controller
{
    /** Status attempt yang dianggap sudah selesai dikerjakan */
    private const FINISHED_STATUSES = ['submitted', 'timed_out'];

    private const WEEKDAYS = ['senin' => 1, 'selasa' => 2, 'rabu' => 3, 'kamis' => 4, 'jumat' => 5, "jum'at" => 5, 'sabtu' => 6, 'minggu' => 7];

    private const WEEKDAY_NAMES = [1 => 'Senin', 2 => 'Selasa', 3 => 'Rabu', 4 => 'Kamis', 5 => 'Jumat', 6 => 'Sabtu', 7 => 'Minggu'];

    /**
     * Dashboard Overview khusus Siswa Belajar
     */
    public function overview(Request $request)
    {
        $student = $request->user()->load(['school:id,name,npsn', 'classroom:id,name,code']);
        $classroomId = $student->classroom_id;

        // Mapel & guru pengampu di kelas siswa (dari plotting mapel kelas)
        $assignments = $classroomId
            ? ClassSubjectAssignment::where('classroom_id', $classroomId)
                ->with(['course:id,title,description', 'teacher:id,name'])
                ->get()
            : collect();

        // Bahan ajar yang sedang tersedia untuk kelas siswa
        $availableMaterialIds = $classroomId
            ? LearningMaterial::where('classroom_id', $classroomId)->available()->pluck('id')
            : collect();
        $materialsAvailable = $availableMaterialIds->count();
        $accessedMaterialIds = MaterialAccess::where('user_id', $student->id)
            ->whereIn('learning_material_id', $availableMaterialIds)
            ->distinct()
            ->pluck('learning_material_id');
        $materialsAccessed = $accessedMaterialIds->count();

        // Kuis kelas
        $quizzes = $this->classroomQuizzes($classroomId);
        // Ujian dianggap selesai bila percobaan terakhirnya sudah dikumpulkan dan tidak dibuka ulang
        $finishedQuizIds = QuizAttempt::where('user_id', $student->id)
            ->orderByDesc('attempt_no')
            ->get()
            ->unique('quiz_id')
            ->filter(fn (QuizAttempt $attempt) => $attempt->isFinished() && !$attempt->hasRetakeGranted())
            ->pluck('quiz_id')
            ->map(fn ($id) => (int) $id)
            ->values();

        $upcomingAssignments = $classroomId
            ? Assignment::where('classroom_id', $classroomId)
                ->where('is_active', true)
                ->where('due_at', '>=', now())
                ->with('course:id,title')
                ->orderBy('due_at')
                ->take(4)
                ->get()
            : collect();
        $submittedAssignmentIds = AssignmentSubmission::where('user_id', $student->id)
            ->whereIn('assignment_id', $upcomingAssignments->pluck('id'))
            ->pluck('assignment_id');

        $openQuizzes = $quizzes->reject(fn ($quiz) => $finishedQuizIds->contains($quiz->id));
        $upcomingQuizzes = $openQuizzes
            ->filter(fn ($quiz) => in_array($quiz->status_state, ['upcoming', 'active'], true))
            ->sortBy(fn ($quiz) => $quiz->starts_at?->getTimestamp() ?? 0)
            ->values();

        $recentAttempts = $this->finishedAttemptsQuery($student)->take(5)->get();
        $latestVisibleAttempt = $recentAttempts->first(fn ($att) => $this->resultVisible($att));

        // Bahan ajar terbaru beserta penanda sudah / belum dibuka siswa
        $recentMaterials = LearningMaterial::whereIn('id', $availableMaterialIds)
            ->with(['course:id,title', 'teacher:id,name'])
            ->orderByDesc('id')
            ->take(6)
            ->get();

        // Pemakaian media oleh siswa sendiri (sama dengan sumber analitik guru / admin)
        $mediaUsage = MaterialAccess::where('user_id', $student->id)
            ->toBase()
            ->select('content_type')
            ->selectRaw('COUNT(*) as total')
            ->groupBy('content_type')
            ->pluck('total', 'content_type');

        $today = self::WEEKDAY_NAMES[now()->dayOfWeekIso];
        $todaySchedule = $assignments
            ->filter(fn ($a) => $this->weekdayIndex($a->schedule_day) === now()->dayOfWeekIso)
            ->sortBy(fn ($a) => (string) $a->schedule_time)
            ->values();

        return response()->json([
            'status' => 'success',
            'data' => [
                'student' => [
                    'id' => $student->id,
                    'name' => $student->name,
                    'nis' => $student->nomor_induk ?? $student->nim_nip,
                    'email' => $student->email,
                    'school' => $student->school ? [
                        'id' => $student->school->id,
                        'name' => $student->school->name,
                        'npsn' => $student->school->npsn,
                    ] : null,
                    'classroom' => $this->classroomPayload($student),
                    'school_name' => $student->school?->name,
                    'classroom_name' => $student->classroom?->name,
                    'classroom_code' => $student->classroom?->code,
                ],
                'summary' => [
                    'materials_available' => $materialsAvailable,
                    'materials_accessed' => $materialsAccessed,
                    'quizzes_available' => $quizzes->count(),
                    'quizzes_completed' => $quizzes->count() - $openQuizzes->count(),
                    'quizzes_pending' => $openQuizzes->where('status_state', 'active')->count(),
                    'average_score' => $this->visibleStats($student)['average_score'],
                    'latest_score' => $latestVisibleAttempt ? (float) $latestVisibleAttempt->score : null,
                    'latest_is_passed' => $latestVisibleAttempt?->is_passed,
                    'total_courses_enrolled' => $assignments->pluck('course_id')->unique()->count(),
                    // Progres belajar = porsi bahan ajar yang tersedia yang sudah pernah dibuka
                    'learning_progress_pct' => $materialsAvailable > 0
                        ? (int) min(round(($materialsAccessed / $materialsAvailable) * 100), 100)
                        : 0,
                ],
                'media_usage' => [
                    'pdf' => (int) ($mediaUsage['document'] ?? 0),
                    'audio' => (int) ($mediaUsage['audio'] ?? 0),
                    'video' => (int) ($mediaUsage['video'] ?? 0),
                    'total' => (int) $mediaUsage->sum(),
                ],
                'recent_materials' => $recentMaterials->map(fn ($material) => [
                    'id' => $material->id,
                    'title' => $material->title,
                    'content_type' => $material->content_type,
                    'course_title' => $material->course?->title,
                    'teacher_name' => $material->teacher?->name,
                    'created_at' => $material->created_at?->toIso8601String(),
                    'is_accessed' => $accessedMaterialIds->contains($material->id),
                ]),
                'upcoming_assignments' => $upcomingAssignments->map(fn (Assignment $assignment) => [
                    'id' => $assignment->id,
                    'title' => $assignment->title,
                    'course_title' => $assignment->course?->title,
                    'due_at' => $assignment->due_at?->toIso8601String(),
                    'allow_late' => $assignment->allow_late,
                    'submitted' => $submittedAssignmentIds->contains($assignment->id),
                ])->values(),
                'today' => $today,
                'today_schedule' => $todaySchedule->map(fn ($a) => [
                    'id' => $a->id,
                    'course_title' => $a->course?->title,
                    'teacher_name' => $a->teacher?->name,
                    'schedule_time' => $a->schedule_time,
                    'room' => $a->room,
                ]),
                'recent_attempts' => $recentAttempts->map(fn ($att) => [
                    'id' => $att->id,
                    'quiz_id' => $att->quiz_id,
                    'quiz_title' => $att->quiz?->title,
                    'course_title' => $att->quiz?->course?->title,
                    'score' => $this->resultVisible($att) ? $att->score : null,
                    'is_passed' => $this->resultVisible($att) ? $att->is_passed : null,
                    'submitted_at' => $att->submitted_at?->toIso8601String(),
                ]),
                'upcoming_quizzes' => $upcomingQuizzes->map(fn ($quiz) => [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'course_title' => $quiz->course?->title,
                    'starts_at' => $quiz->starts_at?->toIso8601String(),
                    'ends_at' => $quiz->ends_at?->toIso8601String(),
                    'duration_minutes' => $quiz->duration_minutes,
                ]),
                'enrolled_courses' => $assignments
                    ->unique('course_id')
                    ->map(fn ($a) => [
                        'id' => $a->course_id,
                        'title' => $a->course?->title,
                        'description' => $a->course?->description,
                        'teacher_name' => $a->teacher?->name,
                    ])
                    ->values(),
            ],
        ]);
    }

    /**
     * Rekap nilai ujian siswa yang sedang login
     */
    public function grades(Request $request)
    {
        $student = $request->user();
        $attempts = $this->finishedAttemptsQuery($student)->get();
        $stats = $this->visibleStats($student);

        return response()->json([
            'status' => 'success',
            'data' => [
                'summary' => [
                    'total_attempts' => $attempts->count(),
                    'average_score' => $stats['average_score'],
                    'passed' => $stats['passed'],
                    'failed' => $stats['total'] - $stats['passed'],
                ],
                'attempts' => $attempts->map(function ($att) {
                    $visible = $this->resultVisible($att);

                    return [
                        'id' => $att->id,
                        'quiz_id' => $att->quiz_id,
                        'quiz_title' => $att->quiz?->title,
                        'course_title' => $att->quiz?->course?->title,
                        'score' => $visible ? $att->score : null,
                        'passing_score' => $att->quiz?->passing_score,
                        'is_passed' => $visible ? $att->is_passed : null,
                        'total_correct' => $visible ? $att->total_correct : null,
                        'total_questions' => $att->total_questions,
                        'status' => $att->status,
                        'submitted_at' => $att->submitted_at?->toIso8601String(),
                    ];
                }),
            ],
        ]);
    }

    /**
     * Jadwal pelajaran kelas siswa (dari plotting guru & mapel)
     */
    public function schedule(Request $request)
    {
        $student = $request->user()->load('classroom:id,name,code');

        $schedule = $student->classroom_id
            ? ClassSubjectAssignment::where('classroom_id', $student->classroom_id)
                ->with(['course:id,title', 'teacher:id,name'])
                ->get()
                ->sortBy([
                    fn ($a, $b) => $this->weekdayIndex($a->schedule_day) <=> $this->weekdayIndex($b->schedule_day),
                    fn ($a, $b) => strcmp((string) $a->schedule_time, (string) $b->schedule_time),
                ])
                ->values()
            : collect();

        return response()->json([
            'status' => 'success',
            'data' => [
                'classroom' => $this->classroomPayload($student),
                'schedule' => $schedule->map(fn ($a) => [
                    'id' => $a->id,
                    'course_title' => $a->course?->title,
                    'teacher_name' => $a->teacher?->name,
                    'schedule_day' => $a->schedule_day,
                    'schedule_time' => $a->schedule_time,
                    'room' => $a->room,
                ]),
            ],
        ]);
    }

    /**
     * Kuis aktif & terbit untuk kelas siswa.
     */
    private function classroomQuizzes(?int $classroomId): Collection
    {
        if (!$classroomId) {
            return collect();
        }

        return Quiz::where('classroom_id', $classroomId)
            ->where('is_active', true)
            ->where('is_published', true)
            ->with('course:id,title')
            ->get();
    }

    /**
     * Attempt yang sudah dikumpulkan / habis waktu, terbaru dahulu. Quiz di-eager-load
     * agar accessor is_passed tidak memicu N+1.
     */
    private function finishedAttemptsQuery(User $student)
    {
        return QuizAttempt::where('user_id', $student->id)
            ->whereIn('status', self::FINISHED_STATUSES)
            ->with(['quiz:id,title,course_id,passing_score,show_result_immediately', 'quiz.course:id,title'])
            ->orderByDesc('submitted_at')
            ->orderByDesc('id');
    }

    /**
     * Statistik hanya dari kuis yang hasilnya boleh dilihat siswa (show_result_immediately).
     */
    private function visibleStats(User $student): array
    {
        return AttemptStats::summarize(function ($query) use ($student) {
            $query->where('quiz_attempts.user_id', $student->id)
                ->where('quizzes.show_result_immediately', true);
        });
    }

    private function resultVisible(QuizAttempt $attempt): bool
    {
        return (bool) $attempt->quiz?->show_result_immediately;
    }

    private function classroomPayload(User $student): ?array
    {
        return $student->classroom ? [
            'id' => $student->classroom->id,
            'name' => $student->classroom->name,
            'code' => $student->classroom->code,
        ] : null;
    }

    private function weekdayIndex(?string $day): int
    {
        return self::WEEKDAYS[strtolower(trim((string) $day))] ?? 99;
    }
}
