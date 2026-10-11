<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassSubjectAssignment;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonContent;
use App\Models\StudentLessonProgress;
use App\Models\User;
use App\Support\MediaUpload;
use App\Support\TeacherScope;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;

class LessonController extends Controller
{
    /**
     * Mapel yang boleh diakses pengguna:
     * - murid       => mapel yang diplot ke kelasnya
     * - guru        => mapel yang diajar (diplot) atau diampu sebagai instruktur
     * - admin       => mapel di sekolahnya
     * - admin_master => semua (null = tanpa batasan)
     */
    private function accessibleCourseIds(User $user): ?Collection
    {
        return match ($user->role) {
            'murid' => $user->classroom_id
                ? ClassSubjectAssignment::where('classroom_id', $user->classroom_id)->pluck('course_id')->unique()->values()
                : collect(),
            'guru' => TeacherScope::for($user)->courseIds,
            'admin' => $user->school_id
                ? Course::where('school_id', $user->school_id)->pluck('id')
                : collect(),
            'admin_master' => null,
            default => collect(),
        };
    }

    private function accessibleLessons(User $user)
    {
        $query = Lesson::query();
        $courseIds = $this->accessibleCourseIds($user);
        if ($courseIds !== null) {
            $query->whereIn('course_id', $courseIds);
        }

        return $query;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $isStudent = $user->role === 'murid';

        $query = $this->accessibleLessons($user)
            ->with(['contents', 'quiz:id,lesson_id,title,duration_minutes,is_published'])
            ->orderBy('order_index');

        if ($request->filled('course_id')) {
            $query->where('course_id', $request->query('course_id'));
        }

        if ($isStudent) {
            $query->with(['progress' => fn ($q) => $q->where('user_id', $user->id)]);
        }

        $lessons = $query->get()->map(fn ($lesson) => [
            'id' => $lesson->id,
            'course_id' => $lesson->course_id,
            'title' => $lesson->title,
            'description' => $lesson->description,
            'order_index' => $lesson->order_index,
            'contents' => $lesson->contents,
            'quiz' => $lesson->quiz,
            'is_completed' => $isStudent ? (bool) $lesson->progress->first()?->is_completed : false,
        ]);

        return response()->json([
            'status' => 'success',
            'data' => $lessons,
        ]);
    }

    public function show($id, Request $request)
    {
        $user = $request->user();
        $lesson = $this->accessibleLessons($user)
            ->with(['contents', 'quiz'])
            ->findOrFail($id);

        // Hanya siswa yang dicatat progres aksesnya
        $progress = null;
        if ($user->role === 'murid') {
            $progress = StudentLessonProgress::firstOrNew(['user_id' => $user->id, 'lesson_id' => $lesson->id]);
            $progress->last_accessed_at = now();
            $progress->save();
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'lesson' => $lesson,
                'progress' => $progress,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $scope = TeacherScope::for($request->user());

        $validated = $request->validate([
            'course_id' => ['required', 'integer', Rule::in($scope->courseIds->all())],
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'order_index' => 'nullable|integer|min:1',
        ], [
            'course_id.in' => 'Anda tidak mengampu mata pelajaran ini.',
        ]);

        $lesson = Lesson::create([
            'course_id' => $validated['course_id'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'order_index' => $validated['order_index'] ?? 1,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Materi pertemuan berhasil dibuat.',
            'data' => $lesson,
        ], 201);
    }

    public function storeContent($lessonId, Request $request)
    {
        $scope = TeacherScope::for($request->user());
        $lesson = Lesson::whereIn('course_id', $scope->courseIds)->findOrFail($lessonId);

        $validated = $request->validate([
            'content_type' => 'required|in:document,audio,video',
            'title' => 'required|string|max:255',
            'external_url' => 'nullable|url:http,https|max:500',
            'notes' => 'nullable|string',
        ], [
            'external_url.url' => 'Tautan URL tidak valid (harus diawali http:// atau https://).',
        ]);

        $contentType = $validated['content_type'];
        $request->validate(
            ['file' => MediaUpload::rules($contentType, 'required_without:external_url')],
            MediaUpload::messages('file', $contentType)
        );

        $stored = $request->hasFile('file')
            ? MediaUpload::store($request->file('file'), $contentType, 'lessons')
            : null;

        $content = LessonContent::create([
            'lesson_id' => $lesson->id,
            'content_type' => $contentType,
            'title' => $validated['title'],
            'file_path' => $stored['path'] ?? null,
            'file_name_original' => $stored['original_name'] ?? null,
            'file_size_bytes' => $stored['size'] ?? null,
            'external_url' => $validated['external_url'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Media pembelajaran {$contentType} berhasil diunggah.",
            'data' => $content,
        ], 201);
    }

    public function markProgress($id, Request $request)
    {
        $user = $request->user();
        $lesson = $this->accessibleLessons($user)->findOrFail($id);

        $progress = StudentLessonProgress::updateOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $lesson->id],
            [
                'is_completed' => true,
                'completed_at' => now(),
                'last_accessed_at' => now(),
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Materi telah ditandai selesai dipelajari.',
            'data' => $progress,
        ]);
    }

    /**
     * Laporan progres belajar siswa pada mapel yang diajar guru di kelas masing-masing.
     */
    public function teacherProgressReport(Request $request)
    {
        $scope = TeacherScope::for($request->user());
        $coursesByClassroom = $scope->courseIdsByClassroom();

        $students = User::where('role', 'murid')
            ->whereIn('classroom_id', $scope->classroomIds)
            ->with('classroom:id,name,code')
            ->orderBy('name')
            ->get();

        // Jumlah pertemuan per mapel (1 query)
        $lessonsPerCourse = Lesson::whereIn('course_id', $scope->courseIds)
            ->toBase()
            ->select('course_id')
            ->selectRaw('COUNT(*) as total')
            ->groupBy('course_id')
            ->pluck('total', 'course_id');

        // Jumlah pertemuan selesai per siswa per mapel (1 query)
        $completed = StudentLessonProgress::query()
            ->join('lessons', 'lessons.id', '=', 'student_lesson_progress.lesson_id')
            ->whereIn('student_lesson_progress.user_id', $students->pluck('id'))
            ->whereIn('lessons.course_id', $scope->courseIds)
            ->where('student_lesson_progress.is_completed', true)
            ->toBase()
            ->select('student_lesson_progress.user_id', 'lessons.course_id')
            ->selectRaw('COUNT(*) as total')
            ->groupBy('student_lesson_progress.user_id', 'lessons.course_id')
            ->get()
            ->groupBy('user_id');

        $report = $students->map(function ($student) use ($coursesByClassroom, $scope, $lessonsPerCourse, $completed) {
            // Mapel yang diajar guru di kelas siswa; kelas perwalian tanpa plotting memakai seluruh mapel guru
            $courseIds = $coursesByClassroom->get($student->classroom_id, $scope->courseIds);

            $totalLessons = $courseIds->sum(fn ($courseId) => (int) ($lessonsPerCourse[$courseId] ?? 0));
            $completedCount = $completed->get($student->id, collect())
                ->filter(fn ($row) => $courseIds->contains((int) $row->course_id))
                ->sum(fn ($row) => (int) $row->total);

            return [
                'id' => $student->id,
                'name' => $student->name,
                'nim' => $student->nomor_induk ?? $student->nim_nip,
                'email' => $student->email,
                'classroom_name' => $student->classroom?->name ?? 'Belum Ada Kelas',
                'completed_lessons' => $completedCount,
                'total_lessons' => $totalLessons,
                'progress_percentage' => $totalLessons > 0 ? (int) round(($completedCount / $totalLessons) * 100) : 0,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $report,
        ]);
    }
}
