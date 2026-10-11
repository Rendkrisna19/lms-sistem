<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\User;
use App\Models\Classroom;
use App\Models\Course;
use App\Support\AttemptStats;
use App\Support\LearningAnalytics;
use Illuminate\Http\Request;

class MasterAdminController extends Controller
{
    /**
     * Dashboard Overview khusus role Admin Master (Seluruh Platform Nasional)
     */
    public function overview()
    {
        $totalSchools = School::count();
        $totalTeachers = User::where('role', 'guru')->count();
        $totalStudents = User::where('role', 'murid')->count();
        $totalClassrooms = Classroom::count();
        $totalCourses = Course::count();

        // Data Sekolah beserta ringkasan siswa & guru
        $schools = School::withCount(['students', 'teachers', 'classrooms', 'courses'])
            ->orderBy('id', 'asc')
            ->get();

        // Statistik ujian seluruh platform (hanya attempt yang sudah dikumpulkan)
        $stats = AttemptStats::summarize();

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_schools' => $totalSchools,
                'total_teachers' => $totalTeachers,
                'total_students' => $totalStudents,
                'total_classrooms' => $totalClassrooms,
                'total_courses' => $totalCourses,
                'total_exam_attempts' => $stats['total'],
                'average_score' => $stats['average_score'],
                'pass_rate' => $stats['pass_rate'],
                'schools_distribution' => $schools,
            ],
        ]);
    }

    /**
     * Seluruh Guru dengan filter per sekolah
     */
    public function allTeachers(Request $request)
    {
        $schoolId = $request->query('school_id');
        $query = User::where('role', 'guru')->with('school:id,name,npsn');

        if ($schoolId && $schoolId !== 'all') {
            $query->where('school_id', $schoolId);
        }

        $teachers = $query->orderBy('id', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $teachers,
        ]);
    }

    /**
     * Seluruh Siswa dengan filter per sekolah
     */
    public function allStudents(Request $request)
    {
        $schoolId = $request->query('school_id');
        $query = User::where('role', 'murid')->with(['school:id,name,npsn', 'classroom:id,name,code']);

        if ($schoolId && $schoolId !== 'all') {
            $query->where('school_id', $schoolId);
        }

        $students = $query->orderBy('id', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $students,
        ]);
    }

    /**
     * Seluruh Data Kelas dengan filter per sekolah
     */
    public function allClassrooms(Request $request)
    {
        $schoolId = $request->query('school_id');
        $query = Classroom::with([
            'school:id,name,npsn',
            'homeroomTeacher:id,name,nomor_induk',
            'subjectAssignments.teacher:id,name,nomor_induk',
            'subjectAssignments.course:id,title'
        ])->withCount('students');

        if ($schoolId && $schoolId !== 'all') {
            $query->where('school_id', $schoolId);
        }

        $classrooms = $query->orderBy('id', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $classrooms,
        ]);
    }

    /**
     * Seluruh Mata Pelajaran dengan filter per sekolah
     */
    public function allCourses(Request $request)
    {
        $schoolId = $request->query('school_id');
        $query = Course::with([
            'school:id,name,npsn',
            'instructor:id,name,nomor_induk',
            'lessons:id,course_id,title',
            'quizzes:id,course_id,title'
        ]);

        if ($schoolId && $schoolId !== 'all') {
            $query->where('school_id', $schoolId);
        }

        $courses = $query->orderBy('id', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $courses,
        ]);
    }

    /**
     * Analisis Akses Media & Gaya Belajar Siswa (Dokumen PDF vs Voice/Audio vs Video Tutorial)
     * berdasarkan log akses bahan ajar. Filter opsional: school_id, classroom_id.
     */
    public function learningAnalytics(Request $request)
    {
        $students = User::where('role', 'murid');

        $schoolId = $request->query('school_id');
        if ($schoolId && $schoolId !== 'all') {
            $students->where('school_id', $schoolId);
        }

        $classroomId = $request->query('classroom_id');
        if ($classroomId && $classroomId !== 'all') {
            $students->where('classroom_id', $classroomId);
        }

        return response()->json([
            'status' => 'success',
            'data' => LearningAnalytics::build($students),
        ]);
    }
}
