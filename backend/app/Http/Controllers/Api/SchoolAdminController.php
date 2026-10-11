<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Quiz;
use App\Models\School;
use App\Models\Classroom;
use App\Models\ClassSubjectAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class SchoolAdminController extends Controller
{
    /**
     * Dapatkan school_id pengguna aktif
     */
    protected function getSchoolId(Request $request)
    {
        return $request->user()?->school_id ?? 1;
    }

    /**
     * Dashboard Overview khusus Admin Sekolah
     */
    public function overview(Request $request)
    {
        $schoolId = $this->getSchoolId($request);
        $school = School::find($schoolId) ?? School::first();

        $totalTeachers = User::where('role', 'guru')->where('school_id', $schoolId)->count();
        $totalStudents = User::where('role', 'murid')->where('school_id', $schoolId)->count();
        $totalClassrooms = Classroom::where('school_id', $schoolId)->count();
        $totalCourses = Course::where('school_id', $schoolId)->count();
        $totalLessons = Lesson::whereHas('course', fn($q) => $q->where('school_id', $schoolId))->count();
        $totalQuizzes = Quiz::whereHas('course', fn($q) => $q->where('school_id', $schoolId))->count();

        return response()->json([
            'status' => 'success',
            'data' => [
                'school' => $school,
                'total_teachers' => $totalTeachers,
                'total_students' => $totalStudents,
                'total_classrooms' => $totalClassrooms,
                'total_courses' => $totalCourses,
                'total_lessons' => $totalLessons,
                'total_quizzes' => $totalQuizzes,
                'server_status' => 'Online & Stabil',
                'database_status' => 'Terkoneksi (MySQL)',
            ],
        ]);
    }

    /**
     * List Guru di Sekolah Ini
     */
    public function teachers(Request $request)
    {
        $schoolId = $this->getSchoolId($request);
        $teachers = User::where('role', 'guru')
            ->where('school_id', $schoolId)
            ->with('school:id,name,npsn')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $teachers,
        ]);
    }

    public function createTeacher(Request $request)
    {
        $schoolId = $this->getSchoolId($request);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nomor_induk' => 'required|string|unique:users,nomor_induk',
            'email' => 'required|email|unique:users,email',
            'password' => 'nullable|string|min:6',
        ]);

        $teacher = User::create([
            'name' => $validated['name'],
            'nomor_induk' => $validated['nomor_induk'],
            'nim_nip' => $validated['nomor_induk'],
            'email' => $validated['email'],
            'password' => Hash::make($request->input('password', 'password123')),
            'role' => 'guru',
            'school_id' => $schoolId,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Data Guru berhasil ditambahkan',
            'data' => $teacher->load('school:id,name,npsn'),
        ], 201);
    }

    public function updateTeacher(Request $request, $id)
    {
        $schoolId = $this->getSchoolId($request);
        $teacher = User::where('role', 'guru')->where('school_id', $schoolId)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nomor_induk' => ['required', 'string', Rule::unique('users', 'nomor_induk')->ignore($teacher->id)],
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($teacher->id)],
            'password' => 'nullable|string|min:6',
        ]);

        $teacher->name = $validated['name'];
        $teacher->nomor_induk = $validated['nomor_induk'];
        $teacher->nim_nip = $validated['nomor_induk'];
        $teacher->email = $validated['email'];
        if (!empty($validated['password'])) {
            $teacher->password = Hash::make($validated['password']);
        }
        $teacher->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Data Guru berhasil diperbarui',
            'data' => $teacher,
        ]);
    }

    public function deleteTeacher(Request $request, $id)
    {
        $schoolId = $this->getSchoolId($request);
        $teacher = User::where('role', 'guru')->where('school_id', $schoolId)->findOrFail($id);
        $teacher->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Data Guru berhasil dihapus',
        ]);
    }

    /**
     * List Siswa di Sekolah Ini
     */
    public function students(Request $request)
    {
        $schoolId = $this->getSchoolId($request);
        $students = User::where('role', 'murid')
            ->where('school_id', $schoolId)
            ->with(['classroom:id,name,code', 'school:id,name,npsn'])
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $students,
        ]);
    }

    public function createStudent(Request $request)
    {
        $schoolId = $this->getSchoolId($request);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nomor_induk' => 'required|string|unique:users,nomor_induk',
            'email' => 'required|email|unique:users,email',
            'classroom_id' => 'nullable|exists:classrooms,id',
            'password' => 'nullable|string|min:6',
        ]);

        $student = User::create([
            'name' => $validated['name'],
            'nomor_induk' => $validated['nomor_induk'],
            'nim_nip' => $validated['nomor_induk'],
            'email' => $validated['email'],
            'classroom_id' => $validated['classroom_id'] ?? null,
            'school_id' => $schoolId,
            'password' => Hash::make($request->input('password', 'password123')),
            'role' => 'murid',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Data Siswa berhasil ditambahkan',
            'data' => $student->load(['classroom:id,name,code', 'school:id,name,npsn']),
        ], 201);
    }

    public function updateStudent(Request $request, $id)
    {
        $schoolId = $this->getSchoolId($request);
        $student = User::where('role', 'murid')->where('school_id', $schoolId)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nomor_induk' => ['required', 'string', Rule::unique('users', 'nomor_induk')->ignore($student->id)],
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($student->id)],
            'classroom_id' => 'nullable|exists:classrooms,id',
            'password' => 'nullable|string|min:6',
        ]);

        $student->name = $validated['name'];
        $student->nomor_induk = $validated['nomor_induk'];
        $student->nim_nip = $validated['nomor_induk'];
        $student->email = $validated['email'];
        if ($request->has('classroom_id')) {
            $student->classroom_id = $validated['classroom_id'];
        }
        if (!empty($validated['password'])) {
            $student->password = Hash::make($validated['password']);
        }
        $student->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Data Siswa berhasil diperbarui',
            'data' => $student->load(['classroom:id,name,code', 'school:id,name,npsn']),
        ]);
    }

    public function deleteStudent(Request $request, $id)
    {
        $schoolId = $this->getSchoolId($request);
        $student = User::where('role', 'murid')->where('school_id', $schoolId)->findOrFail($id);
        $student->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Data Siswa berhasil dihapus',
        ]);
    }

    /**
     * List Kelas di Sekolah Ini
     */
    public function classrooms(Request $request)
    {
        $schoolId = $this->getSchoolId($request);
        $classrooms = Classroom::where('school_id', $schoolId)
            ->with([
                'homeroomTeacher:id,name,nomor_induk',
                'subjectAssignments.teacher:id,name,nomor_induk',
                'subjectAssignments.course:id,title'
            ])
            ->withCount('students')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $classrooms,
        ]);
    }

    public function createClassroom(Request $request)
    {
        $schoolId = $this->getSchoolId($request);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50',
            'homeroom_teacher_id' => 'nullable|exists:users,id',
            'academic_year' => 'nullable|string|max:50',
        ]);

        $classroom = Classroom::create([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'school_id' => $schoolId,
            'homeroom_teacher_id' => $validated['homeroom_teacher_id'] ?? null,
            'academic_year' => $validated['academic_year'] ?? '2026/2027',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Data Kelas berhasil dibuat',
            'data' => $classroom->load('homeroomTeacher:id,name,nomor_induk'),
        ], 201);
    }

    public function updateClassroom(Request $request, $id)
    {
        $schoolId = $this->getSchoolId($request);
        $classroom = Classroom::where('school_id', $schoolId)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50',
            'homeroom_teacher_id' => 'nullable|exists:users,id',
            'academic_year' => 'nullable|string|max:50',
        ]);

        $classroom->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Data Kelas berhasil diperbarui',
            'data' => $classroom->load('homeroomTeacher:id,name,nomor_induk'),
        ]);
    }

    public function deleteClassroom(Request $request, $id)
    {
        $schoolId = $this->getSchoolId($request);
        $classroom = Classroom::where('school_id', $schoolId)->findOrFail($id);
        $classroom->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Data Kelas berhasil dihapus',
        ]);
    }

    /**
     * Detail Rinci Kelas beserta Siswa dan Plotting Mapel
     */
    public function classroomDetail(Request $request, $id)
    {
        $schoolId = $this->getSchoolId($request);
        $query = Classroom::with([
            'school:id,name,npsn',
            'homeroomTeacher:id,name,nomor_induk,email',
            'students' => function ($q) {
                $q->select('id', 'name', 'nomor_induk', 'email', 'classroom_id', 'school_id')->orderBy('name');
            },
            'subjectAssignments.course:id,title,description',
            'subjectAssignments.teacher:id,name,nomor_induk,email',
            'assignments.course:id,title,description',
            'assignments.teacher:id,name,nomor_induk,email',
        ]);

        if ($request->user()?->role !== 'admin_master') {
            $query->where('school_id', $schoolId);
        }

        $classroom = $query->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $classroom,
        ]);
    }

    /**
     * Masukkan Siswa ke dalam Rombel Kelas
     */
    public function assignStudentToClass(Request $request, $classId)
    {
        $schoolId = $this->getSchoolId($request);
        $classroomQuery = Classroom::query();
        if ($request->user()?->role !== 'admin_master') {
            $classroomQuery->where('school_id', $schoolId);
        }
        $classroom = $classroomQuery->findOrFail($classId);

        $validated = $request->validate([
            'student_id' => 'required|exists:users,id',
        ]);

        $studentQuery = User::where('role', 'murid');
        if ($request->user()?->role !== 'admin_master') {
            $studentQuery->where('school_id', $schoolId);
        }
        $student = $studentQuery->findOrFail($validated['student_id']);
        $student->classroom_id = $classroom->id;
        $student->save();

        return response()->json([
            'status' => 'success',
            'message' => "Siswa {$student->name} berhasil dimasukkan ke kelas {$classroom->name}",
            'data' => $student->load('classroom:id,name,code'),
        ]);
    }

    /**
     * Keluarkan Siswa dari Rombel Kelas
     */
    public function removeStudentFromClass(Request $request, $classId, $studentId)
    {
        $schoolId = $this->getSchoolId($request);
        $classroomQuery = Classroom::query();
        if ($request->user()?->role !== 'admin_master') {
            $classroomQuery->where('school_id', $schoolId);
        }
        $classroom = $classroomQuery->findOrFail($classId);

        $student = User::where('role', 'murid')->where('classroom_id', $classroom->id)->findOrFail($studentId);
        $student->classroom_id = null;
        $student->save();

        return response()->json([
            'status' => 'success',
            'message' => "Siswa {$student->name} dikeluarkan dari kelas",
        ]);
    }

    /**
     * Plotting Mapel & Guru Pengampu ke dalam Kelas
     */
    public function createAssignment(Request $request, $classId)
    {
        $schoolId = $this->getSchoolId($request);
        $classroomQuery = Classroom::query();
        if ($request->user()?->role !== 'admin_master') {
            $classroomQuery->where('school_id', $schoolId);
        }
        $classroom = $classroomQuery->findOrFail($classId);

        $validated = $request->validate([
            'course_id' => 'required|exists:courses,id',
            'teacher_id' => 'required|exists:users,id',
            'schedule_day' => 'nullable|string|max:50',
            'schedule_time' => 'nullable|string|max:50',
            'room' => 'nullable|string|max:100',
        ]);

        // Verifikasi mapel & guru
        $course = Course::findOrFail($validated['course_id']);
        $teacher = User::where('role', 'guru')->findOrFail($validated['teacher_id']);

        $assignment = ClassSubjectAssignment::create([
            'classroom_id' => $classroom->id,
            'course_id' => $course->id,
            'teacher_id' => $teacher->id,
            'schedule_day' => $validated['schedule_day'] ?? 'Senin',
            'schedule_time' => $validated['schedule_time'] ?? '08:00 - 10:00',
            'room' => $validated['room'] ?? 'Ruang Kelas',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Plotting Guru & Mapel berhasil ditambahkan ke kelas',
            'data' => $assignment->load(['course', 'teacher']),
        ], 201);
    }

    /**
     * Hapus Plotting Mapel & Guru Pengampu dari Kelas
     */
    public function deleteAssignment(Request $request, $assignmentId)
    {
        $schoolId = $this->getSchoolId($request);
        $assignmentQuery = ClassSubjectAssignment::query();
        if ($request->user()?->role !== 'admin_master') {
            $assignmentQuery->whereHas('classroom', fn($q) => $q->where('school_id', $schoolId));
        }
        $assignment = $assignmentQuery->findOrFail($assignmentId);
        $assignment->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Plotting Guru & Mapel berhasil dihapus dari kelas',
        ]);
    }

    /**
     * List Mata Pelajaran di Sekolah Ini
     */
    public function courses(Request $request)
    {
        $schoolId = $this->getSchoolId($request);
        $courses = Course::where('school_id', $schoolId)
            ->with(['instructor:id,name,nomor_induk', 'lessons', 'quizzes'])
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $courses,
        ]);
    }

    public function createCourse(Request $request)
    {
        $schoolId = $this->getSchoolId($request);
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'code' => 'required|string|max:50',
            'description' => 'nullable|string',
            'instructor_id' => 'required|exists:users,id',
        ]);

        $course = Course::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? '',
            'instructor_id' => $validated['instructor_id'],
            'school_id' => $schoolId,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Mata Pelajaran berhasil ditambahkan',
            'data' => $course->load('instructor:id,name,nomor_induk'),
        ], 201);
    }

    public function updateCourse(Request $request, $id)
    {
        $schoolId = $this->getSchoolId($request);
        $course = Course::where('school_id', $schoolId)->findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'code' => 'required|string|max:50',
            'description' => 'nullable|string',
            'instructor_id' => 'required|exists:users,id',
        ]);

        $course->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Mata Pelajaran berhasil diperbarui',
            'data' => $course->load('instructor:id,name,nomor_induk'),
        ]);
    }

    public function deleteCourse(Request $request, $id)
    {
        $schoolId = $this->getSchoolId($request);
        $course = Course::where('school_id', $schoolId)->findOrFail($id);
        $course->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Mata Pelajaran berhasil dihapus',
        ]);
    }
}
