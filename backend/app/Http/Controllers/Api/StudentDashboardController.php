<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\StudentProgress;
use App\Models\ClassSubjectAssignment;
use Illuminate\Http\Request;

class StudentDashboardController extends Controller
{
    /**
     * Dashboard Overview khusus Siswa Belajar
     */
    public function overview(Request $request)
    {
        $student = $request->user();
        $school = $student->school;
        $classroom = $student->classroom;

        // Kursus/Mapel di kelas siswa (terhubung melalui Plotting Mapel kelas)
        if ($classroom) {
            $assignedCourseIds = ClassSubjectAssignment::where('classroom_id', $classroom->id)->pluck('course_id');
            if ($assignedCourseIds->isNotEmpty()) {
                $courseIds = $assignedCourseIds;
            } else {
                $courseIds = Course::where('school_id', $student->school_id)->pluck('id');
            }
        } else {
            $courseIds = Course::where('school_id', $student->school_id)->pluck('id');
        }

        $courses = Course::whereIn('id', $courseIds)->with('instructor:id,name')->get();

        // Riwayat Ujian Siswa
        $attempts = QuizAttempt::where('user_id', $student->id)
            ->with('quiz:id,title,course_id')
            ->orderBy('id', 'desc')
            ->get();

        $latestAttempt = $attempts->first();
        $latestScore = $latestAttempt ? $latestAttempt->score : 100;

        // Progres Modul 3 Model
        $totalLessons = Lesson::whereIn('course_id', $courseIds)->count();
        $completedLessons = StudentProgress::where('user_id', $student->id)->where('is_completed', true)->count();
        $progressPct = $totalLessons > 0 ? min(round(($completedLessons / $totalLessons) * 100), 100) : 100;

        return response()->json([
            'status' => 'success',
            'data' => [
                'student' => [
                    'id' => $student->id,
                    'name' => $student->name,
                    'nis' => $student->nomor_induk ?? $student->nim_nip,
                    'school_name' => $school?->name ?? 'SMA Mitra Inalum',
                    'classroom_name' => $classroom?->name ?? 'Teknik Informatika - A',
                    'classroom_code' => $classroom?->code ?? 'TI-A',
                ],
                'summary' => [
                    'learning_progress_pct' => $progressPct,
                    'latest_exam_score' => $latestScore,
                    'is_passed' => $latestAttempt ? $latestAttempt->is_passed : true,
                    'total_courses_enrolled' => $courses->count(),
                    'total_models_active' => 3, // 3 Model: PDF, Audio, Video
                    'study_duration_hours' => 4.5,
                ],
                'recent_attempts' => $attempts->take(4),
                'enrolled_courses' => $courses,
            ],
        ]);
    }
}
