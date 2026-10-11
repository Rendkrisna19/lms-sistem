<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassSubjectAssignment;
use App\Models\Course;
use App\Models\LearningMaterial;
use App\Models\Lesson;
use App\Models\MaterialAccess;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\StudentLessonProgress;
use App\Models\User;
use App\Support\AttemptStats;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class StudentDashboardController extends Controller
{
    /** Status attempt yang dianggap sudah selesai dikerjakan */
    private const FINISHED_STATUSES = ['submitted', 'timed_out'];

    private const WEEKDAYS = ['senin' => 1, 'selasa' => 2, 'rabu' => 3, 'kamis' => 4, 'jumat' => 5, "jum'at" => 5, 'sabtu' => 6, 'minggu' => 7];

    /**
     * Dashboard Overview khusus Siswa Belajar
     */
    public function overview(Request $request)
    {
        $student = $request->user()->load(['school:id,name,npsn', 'classroom:id,name,code']);
        $classroomId = $student->classroom_id;

        // Mapel di kelas siswa (terhubung melalui plotting mapel kelas)
        $courseIds = $classroomId
            ? ClassSubjectAssignment::where('classroom_id', $classroomId)->pluck('course_id')->unique()->values()
            : collect();
        $courses = Course::whereIn('id', $courseIds)->with('instructor:id,name')->get();

        // Bahan ajar
        $materialsAvailable = $classroomId
            ? LearningMaterial::where('classroom_id', $classroomId)->available()->count()
            : 0;
        $materialsAccessed = MaterialAccess::where('user_id', $student->id)
            ->distinct()
            ->count('learning_material_id');

        // Kuis kelas
        $quizzes = $this->classroomQuizzes($classroomId);
        $finishedQuizIds = QuizAttempt::where('user_id', $student->id)
            ->whereIn('status', self::FINISHED_STATUSES)
            ->distinct()
            ->pluck('quiz_id')
            ->map(fn ($id) => (int) $id);

        $openQuizzes = $quizzes->reject(fn ($quiz) => $finishedQuizIds->contains($quiz->id));
        $upcomingQuizzes = $openQuizzes
            ->filter(fn ($quiz) => in_array($quiz->status_state, ['upcoming', 'active'], true))
            ->sortBy(fn ($quiz) => $quiz->starts_at?->getTimestamp() ?? 0)
            ->values();

        // Progres pertemuan (lesson) pada mapel kelas
        $totalLessons = Lesson::whereIn('course_id', $courseIds)->count();
        $completedLessons = $totalLessons > 0
            ? StudentLessonProgress::where('user_id', $student->id)
                ->where('is_completed', true)
                ->whereHas('lesson', fn ($q) => $q->whereIn('course_id', $courseIds))
                ->count()
            : 0;

        $recentAttempts = $this->finishedAttemptsQuery($student)->take(5)->get();

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
                    'total_courses_enrolled' => $courses->count(),
                    'learning_progress_pct' => $totalLessons > 0
                        ? (int) min(round(($completedLessons / $totalLessons) * 100), 100)
                        : 0,
                ],
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
                'enrolled_courses' => $courses,
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
