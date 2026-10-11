<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Classroom;
use App\Models\Course;
use App\Models\LearningMaterial;
use App\Models\Lesson;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use App\Support\AttemptStats;
use App\Support\LearningAnalytics;
use App\Support\TeacherScope;
use Illuminate\Http\Request;

class TeacherDashboardController extends Controller
{
    /**
     * Dashboard Overview khusus Guru Pengampu
     * Menyesuaikan kelas, siswa bimbingan, dan mapel ajar secara presisi dengan plotting
     */
    public function overview(Request $request)
    {
        $teacher = $request->user();
        $scope = TeacherScope::for($teacher);

        // 1. Data Kelas yang diajar beserta jadwal & rombel
        $classrooms = $this->classroomsQuery($scope)->get();

        // 2. Siswa yang BENAR-BENAR ada di kelas yang diajar oleh guru ini
        $students = User::where('role', 'murid')
            ->whereIn('classroom_id', $scope->classroomIds)
            ->with('classroom:id,name,code')
            ->orderBy('name')
            ->get();

        // 3. Kursus & Mapel yang diampu guru
        $courses = Course::whereIn('id', $scope->courseIds)->with(['lessons', 'quizzes'])->get();

        // 4. Bahan ajar, pertemuan, & kuis milik guru ini
        $totalMaterials = LearningMaterial::where('teacher_id', $teacher->id)->count();
        $totalLessons = Lesson::whereIn('course_id', $scope->courseIds)->count();
        $totalQuizzes = Quiz::where('teacher_id', $teacher->id)->count();

        // 5. Nilai ujian terkini dari kuis milik guru ini (hanya yang sudah dikumpulkan)
        $attempts = $this->teacherAttemptsQuery($teacher)
            ->where('status', '!=', 'in_progress')
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->take(10)
            ->get();

        $stats = AttemptStats::summarize(fn ($q) => $q->where('quizzes.teacher_id', $teacher->id));

        return response()->json([
            'status' => 'success',
            'data' => [
                'teacher' => [
                    'id' => $teacher->id,
                    'name' => $teacher->name,
                    'nip' => $teacher->nomor_induk ?? $teacher->nim_nip,
                    'email' => $teacher->email,
                    'school_name' => $teacher->school?->name,
                ],
                'summary' => [
                    'total_courses_taught' => $courses->count(),
                    'total_classrooms_taught' => $classrooms->count(),
                    'total_students_guided' => $students->count(),
                    'total_materials' => $totalMaterials,
                    'total_lessons' => $totalLessons,
                    'total_quizzes' => $totalQuizzes,
                    'average_student_score' => $stats['average_score'],
                    'pass_rate' => $stats['pass_rate'],
                ],
                'assigned_classrooms' => $classrooms,
                'assigned_courses' => $courses,
                'students' => $students->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'nis' => $s->nomor_induk ?? $s->nim_nip,
                    'email' => $s->email,
                    'classroom_id' => $s->classroom_id,
                    'classroom_name' => $s->classroom?->name,
                    'classroom_code' => $s->classroom?->code,
                ]),
                'recent_submissions' => $attempts->map(fn ($att) => $this->formatAttempt($att)),
            ],
        ]);
    }

    /**
     * Daftar Siswa yang Diajar oleh Guru (Hanya siswa dari rombel ajar)
     */
    public function students(Request $request)
    {
        $scope = TeacherScope::for($request->user());

        $query = User::where('role', 'murid')
            ->whereIn('classroom_id', $scope->classroomIds)
            ->with('classroom:id,name,code');

        if ($request->filled('classroom_id') && $request->query('classroom_id') !== 'all') {
            $query->where('classroom_id', $request->query('classroom_id'));
        }

        $students = $query->orderBy('name')->get()->map(fn ($s) => [
            'id' => $s->id,
            'name' => $s->name,
            'nis' => $s->nomor_induk ?? $s->nim_nip,
            'email' => $s->email,
            'classroom_id' => $s->classroom_id,
            'classroom_name' => $s->classroom?->name ?? 'Belum Ada Kelas',
            'classroom_code' => $s->classroom?->code ?? '-',
        ]);

        return response()->json([
            'status' => 'success',
            'data' => $students,
        ]);
    }

    /**
     * Daftar Mata Pelajaran yang Diajar oleh Guru
     */
    public function courses(Request $request)
    {
        $scope = TeacherScope::for($request->user());

        $courses = Course::whereIn('id', $scope->courseIds)
            ->withCount(['lessons', 'quizzes'])
            ->with(['school:id,name', 'instructor:id,name'])
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $courses,
        ]);
    }

    /**
     * Daftar Rombel Kelas yang Diajar oleh Guru
     */
    public function classrooms(Request $request)
    {
        $scope = TeacherScope::for($request->user());

        return response()->json([
            'status' => 'success',
            'data' => $this->classroomsQuery($scope)->get(),
        ]);
    }

    /**
     * Rekapitulasi Nilai Siswa untuk kuis milik guru yang sedang login
     */
    public function grades(Request $request)
    {
        $teacher = $request->user();

        $query = $this->teacherAttemptsQuery($teacher);

        if ($request->filled('classroom_id') && $request->query('classroom_id') !== 'all') {
            $query->whereHas('user', fn ($u) => $u->where('classroom_id', $request->query('classroom_id')));
        }

        if ($request->filled('quiz_id') && $request->query('quiz_id') !== 'all') {
            $query->where('quiz_id', $request->query('quiz_id'));
        }

        $attempts = $query->orderByDesc('id')->get()->map(fn ($att) => $this->formatAttempt($att));

        return response()->json([
            'status' => 'success',
            'data' => $attempts,
        ]);
    }

    /**
     * Analisis Keaktifan & Gaya Belajar Siswa untuk Kelas yang Diajar Guru
     */
    public function learningAnalytics(Request $request)
    {
        $scope = TeacherScope::for($request->user());

        $students = User::where('role', 'murid')->whereIn('classroom_id', $scope->classroomIds);
        if ($request->filled('classroom_id') && $request->query('classroom_id') !== 'all') {
            $students->where('classroom_id', $request->query('classroom_id'));
        }

        return response()->json([
            'status' => 'success',
            'data' => LearningAnalytics::build($students),
        ]);
    }

    private function classroomsQuery(TeacherScope $scope)
    {
        return Classroom::whereIn('id', $scope->classroomIds)
            ->withCount('students')
            ->with([
                'subjectAssignments' => fn ($q) => $q->where('teacher_id', $scope->teacher->id)->with('course:id,title'),
            ]);
    }

    /**
     * Attempt pada kuis yang dibuat oleh guru ini (quizzes.teacher_id).
     */
    private function teacherAttemptsQuery(User $teacher)
    {
        return QuizAttempt::whereHas('quiz', fn ($q) => $q->where('teacher_id', $teacher->id))
            ->with([
                'user:id,name,email,nomor_induk,nim_nip,classroom_id',
                'user.classroom:id,name,code',
                'quiz:id,title,course_id,passing_score',
            ]);
    }

    private function formatAttempt(QuizAttempt $att): array
    {
        $finished = $att->status !== 'in_progress';
        $passingScore = $att->quiz?->passing_score ?? 70;

        return [
            'id' => $att->id,
            'quiz_id' => $att->quiz_id,
            'nis' => $att->user?->nomor_induk ?? $att->user?->nim_nip,
            'name' => $att->user?->name,
            'email' => $att->user?->email,
            'kelas' => $att->user?->classroom?->name,
            'classroom_id' => $att->user?->classroom_id,
            'quiz_title' => $att->quiz?->title,
            'nilai' => $finished && $att->score !== null ? (float) $att->score : null,
            'status' => match (true) {
                !$finished => 'Sedang Mengerjakan',
                $att->score !== null && $att->score >= $passingScore => 'Lulus',
                default => 'Remedial',
            },
            'attempt_status' => $att->status,
            'submitTime' => $att->submitted_at?->format('H:i, d M Y'),
            'submitted_at' => $att->submitted_at?->toIso8601String(),
        ];
    }
}
