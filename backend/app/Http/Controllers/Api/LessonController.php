<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Classroom;
use App\Models\ClassSubjectAssignment;
use App\Models\Lesson;
use App\Models\LessonContent;
use App\Models\StudentLessonProgress;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class LessonController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $userId = $user ? $user->id : null;
        $courseId = $request->query('course_id');

        $query = Lesson::with(['contents', 'quiz:id,lesson_id,title,duration_minutes,is_published'])
            ->orderBy('order_index');

        if ($courseId) {
            $query->where('course_id', $courseId);
        } elseif ($user && $user->role === 'guru') {
            // Guru hanya melihat materi dari mapel yang diampu
            $assignedCourses = ClassSubjectAssignment::where('teacher_id', $user->id)->pluck('course_id')
                ->merge(Course::where('instructor_id', $user->id)->pluck('id'))
                ->unique()->filter()->values();
            if ($assignedCourses->isNotEmpty()) {
                $query->whereIn('course_id', $assignedCourses);
            }
        } elseif ($user && $user->role === 'murid' && $user->classroom_id) {
            // Siswa hanya melihat materi dari kelasnya
            $classCourses = ClassSubjectAssignment::where('classroom_id', $user->classroom_id)->pluck('course_id');
            if ($classCourses->isNotEmpty()) {
                $query->whereIn('course_id', $classCourses);
            }
        }

        $lessons = $query->get()->map(function ($lesson) use ($userId) {
            $isCompleted = false;
            if ($userId) {
                $prog = StudentLessonProgress::where('user_id', $userId)
                    ->where('lesson_id', $lesson->id)
                    ->first();
                $isCompleted = $prog ? (bool)$prog->is_completed : false;
            }
            return [
                'id' => $lesson->id,
                'course_id' => $lesson->course_id,
                'title' => $lesson->title,
                'description' => $lesson->description,
                'order_index' => $lesson->order_index,
                'contents' => $lesson->contents,
                'quiz' => $lesson->quiz,
                'is_completed' => $isCompleted,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $lessons,
        ]);
    }

    public function show($id, Request $request)
    {
        $userId = $request->user() ? $request->user()->id : null;
        $lesson = Lesson::with(['contents', 'quiz'])->findOrFail($id);

        $progress = null;
        if ($userId) {
            $progress = StudentLessonProgress::firstOrCreate(
                ['user_id' => $userId, 'lesson_id' => $lesson->id],
                ['last_accessed_at' => now()]
            );
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
        if ($request->user()->role !== 'guru') {
            return response()->json(['message' => 'Hanya Guru/Dosen yang dapat menambah materi.'], 403);
        }

        $validated = $request->validate([
            'course_id' => 'required|exists:courses,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'order_index' => 'nullable|integer',
        ]);

        $lesson = Lesson::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Materi pertemuan berhasil dibuat.',
            'data' => $lesson,
        ], 201);
    }

    public function storeContent($lessonId, Request $request)
    {
        if ($request->user()->role !== 'guru') {
            return response()->json(['message' => 'Hanya Guru/Dosen yang dapat mengupload materi.'], 403);
        }

        $lesson = Lesson::findOrFail($lessonId);

        $validated = $request->validate([
            'content_type' => 'required|in:document,audio,video',
            'title' => 'required|string|max:255',
            'file' => 'nullable|file|max:102400', // 100MB
            'external_url' => 'nullable|url',
            'notes' => 'nullable|string',
        ]);

        $filePath = null;
        $fileName = null;
        $fileSize = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = $file->getClientOriginalName();
            $fileSize = $file->getSize();

            $folder = match ($validated['content_type']) {
                'document' => 'documents',
                'audio' => 'audio',
                'video' => 'videos',
            };

            $filePath = $file->store($folder, 'public');
        }

        $content = LessonContent::create([
            'lesson_id' => $lesson->id,
            'content_type' => $validated['content_type'],
            'title' => $validated['title'],
            'file_path' => $filePath,
            'file_name_original' => $fileName,
            'file_size_bytes' => $fileSize,
            'external_url' => $validated['external_url'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Media pembelajaran {$validated['content_type']} berhasil diunggah.",
            'data' => $content,
        ], 201);
    }

    public function markProgress($id, Request $request)
    {
        $userId = $request->user()->id;
        $lesson = Lesson::findOrFail($id);

        $progress = StudentLessonProgress::updateOrCreate(
            ['user_id' => $userId, 'lesson_id' => $lesson->id],
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

    public function teacherProgressReport(Request $request)
    {
        $teacher = $request->user();
        if (!$teacher || $teacher->role !== 'guru') {
            $teacher = User::where('role', 'guru')->first() ?? $teacher;
        }

        // Dapatkan kelas yang diajar oleh guru ini
        $classroomIds = ClassSubjectAssignment::where('teacher_id', $teacher->id)->pluck('classroom_id')
            ->merge(Classroom::where('homeroom_teacher_id', $teacher->id)->pluck('id'))
            ->unique()->filter()->values();

        // Dapatkan mapel yang diampu oleh guru ini
        $courseIds = ClassSubjectAssignment::where('teacher_id', $teacher->id)->pluck('course_id')
            ->merge(Course::where('instructor_id', $teacher->id)->pluck('id'))
            ->unique()->filter()->values();

        $students = User::where('role', 'murid')
            ->whereIn('classroom_id', $classroomIds)
            ->with('classroom:id,name,code')
            ->orderBy('name')
            ->get();

        $totalLessons = Lesson::whereIn('course_id', $courseIds)->count();

        $report = $students->map(function ($student) use ($totalLessons, $courseIds) {
            $completedCount = StudentLessonProgress::where('user_id', $student->id)
                ->whereHas('lesson', fn($l) => $l->whereIn('course_id', $courseIds))
                ->where('is_completed', true)
                ->count();

            $percentage = $totalLessons > 0 ? round(($completedCount / $totalLessons) * 100) : 0;

            return [
                'id' => $student->id,
                'name' => $student->name,
                'nim' => $student->nomor_induk ?? $student->nim_nip,
                'email' => $student->email,
                'classroom_name' => $student->classroom?->name ?? 'Belum Ada Kelas',
                'completed_lessons' => $completedCount,
                'total_lessons' => $totalLessons,
                'progress_percentage' => $percentage,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $report,
        ]);
    }
}
