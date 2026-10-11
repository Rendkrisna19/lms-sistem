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

class AdminController extends Controller
{
    /**
     * Helper to determine target school_id for filtering
     */
    protected function getEffectiveSchoolId(Request $request)
    {
        $user = $request->user();
        if ($user && $user->role === 'admin_master') {
            return $request->query('school_id'); // null if global, or specific school id
        }
        return $user?->school_id;
    }

    /**
     * Dashboard Overview Statistics
     */
    public function overview(Request $request)
    {
        $schoolId = $this->getEffectiveSchoolId($request);

        $teacherQuery = User::where('role', 'guru');
        $studentQuery = User::where('role', 'murid');
        $classroomQuery = Classroom::query();
        $courseQuery = Course::query();

        if ($schoolId) {
            $teacherQuery->where('school_id', $schoolId);
            $studentQuery->where('school_id', $schoolId);
            $classroomQuery->where('school_id', $schoolId);
            $courseQuery->where('school_id', $schoolId);
        }

        $totalTeachers = $teacherQuery->count();
        $totalStudents = $studentQuery->count();
        $totalClassrooms = $classroomQuery->count();
        $totalCourses = $courseQuery->count();
        $totalLessons = Lesson::count();
        $totalQuizzes = Quiz::count();
        $totalSchools = School::count();

        $activeSchool = $schoolId ? School::find($schoolId) : ($request->user()?->school ?? School::first());

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_teachers' => $totalTeachers,
                'total_students' => $totalStudents,
                'total_classrooms' => $totalClassrooms,
                'total_courses' => $totalCourses,
                'total_lessons' => $totalLessons,
                'total_quizzes' => $totalQuizzes,
                'total_schools' => $totalSchools,
                'active_school' => $activeSchool,
                'server_status' => 'Online & Stabil',
                'database_status' => 'Terkoneksi (MySQL)',
            ],
        ]);
    }

    /**
     * List Teachers
     */
    public function teachers(Request $request)
    {
        $schoolId = $this->getEffectiveSchoolId($request);
        $query = User::where('role', 'guru')->with('school:id,name,npsn');

        if ($schoolId) {
            $query->where('school_id', $schoolId);
        }

        $teachers = $query->orderBy('id', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $teachers,
        ]);
    }

    /**
     * Create Teacher
     */
    public function createTeacher(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nomor_induk' => 'required|string|unique:users,nomor_induk',
            'email' => 'required|email|unique:users,email',
            'password' => 'nullable|string|min:6',
            'school_id' => 'nullable|exists:schools,id',
        ]);

        $schoolId = $validated['school_id'] ?? ($this->getEffectiveSchoolId($request) ?? 1);

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

    /**
     * Delete Teacher
     */
    public function deleteTeacher($id)
    {
        $teacher = User::where('role', 'guru')->findOrFail($id);
        $teacher->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Data Guru berhasil dihapus',
        ]);
    }

    /**
     * Update Teacher
     */
    public function updateTeacher(Request $request, $id)
    {
        $teacher = User::where('role', 'guru')->findOrFail($id);

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

    /**
     * List Students
     */
    public function students(Request $request)
    {
        $schoolId = $this->getEffectiveSchoolId($request);
        $query = User::where('role', 'murid')->with(['classroom:id,name,code', 'school:id,name,npsn']);

        if ($schoolId) {
            $query->where('school_id', $schoolId);
        }

        $students = $query->orderBy('id', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $students,
        ]);
    }

    /**
     * Create Student
     */
    public function createStudent(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nomor_induk' => 'required|string|unique:users,nomor_induk',
            'email' => 'required|email|unique:users,email',
            'classroom_id' => 'nullable|exists:classrooms,id',
            'password' => 'nullable|string|min:6',
            'school_id' => 'nullable|exists:schools,id',
        ]);

        $schoolId = $validated['school_id'] ?? ($this->getEffectiveSchoolId($request) ?? 1);

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

    /**
     * Update Student
     */
    public function updateStudent(Request $request, $id)
    {
        $student = User::where('role', 'murid')->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nomor_induk' => ['required', 'string', Rule::unique('users', 'nomor_induk')->ignore($student->id)],
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($student->id)],
            'classroom_id' => 'nullable|exists:classrooms,id',
            'password' => 'nullable|string|min:6',
            'school_id' => 'nullable|exists:schools,id',
        ]);

        $student->name = $validated['name'];
        $student->nomor_induk = $validated['nomor_induk'];
        $student->nim_nip = $validated['nomor_induk'];
        $student->email = $validated['email'];
        if ($request->has('classroom_id')) {
            $student->classroom_id = $validated['classroom_id'];
        }
        if ($request->has('school_id') && !empty($validated['school_id'])) {
            $student->school_id = $validated['school_id'];
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

    /**
     * Delete Student
     */
    public function deleteStudent($id)
    {
        $student = User::where('role', 'murid')->findOrFail($id);
        $student->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Data Siswa berhasil dihapus',
        ]);
    }

    /**
     * List Courses
     */
    public function courses(Request $request)
    {
        $schoolId = $this->getEffectiveSchoolId($request);
        $query = Course::with(['instructor', 'school:id,name,npsn'])->withCount('lessons');

        if ($schoolId) {
            $query->where('school_id', $schoolId);
        }

        $courses = $query->orderBy('id', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $courses,
        ]);
    }

    /**
     * Create Course
     */
    public function createCourse(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'instructor_id' => 'required|exists:users,id',
            'school_id' => 'nullable|exists:schools,id',
        ]);

        $schoolId = $validated['school_id'] ?? ($this->getEffectiveSchoolId($request) ?? 1);

        $course = Course::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'instructor_id' => $validated['instructor_id'],
            'school_id' => $schoolId,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Mata Pelajaran berhasil dibuat',
            'data' => $course->load(['instructor', 'school:id,name,npsn']),
        ], 201);
    }

    /**
     * Update Course
     */
    public function updateCourse(Request $request, $id)
    {
        $course = Course::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'instructor_id' => 'required|exists:users,id',
            'school_id' => 'nullable|exists:schools,id',
        ]);

        $course->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Mata Pelajaran berhasil diperbarui',
            'data' => $course->load(['instructor', 'school:id,name,npsn']),
        ]);
    }

    /**
     * Delete Course
     */
    public function deleteCourse($id)
    {
        $course = Course::findOrFail($id);
        $course->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Mata Pelajaran berhasil dihapus',
        ]);
    }

    /**
     * List Classrooms with Homeroom Teacher and counts
     */
    public function classrooms(Request $request)
    {
        $schoolId = $this->getEffectiveSchoolId($request);
        $query = Classroom::with([
                'school:id,name,npsn',
                'homeroomTeacher:id,name,nomor_induk',
                'assignments.course:id,title',
                'assignments.teacher:id,name',
            ])
            ->withCount(['students', 'assignments'])
            ->orderBy('id', 'asc');

        if ($schoolId) {
            $query->where('school_id', $schoolId);
        }

        $classrooms = $query->get();

        return response()->json([
            'status' => 'success',
            'data' => $classrooms,
        ]);
    }

    /**
     * Classroom Details with enrolled Students and Subject Assignments
     */
    public function classroomDetail($id)
    {
        $classroom = Classroom::with([
            'school:id,name,npsn',
            'homeroomTeacher:id,name,nomor_induk,email',
            'students' => function ($q) {
                $q->select('id', 'name', 'nomor_induk', 'email', 'classroom_id', 'school_id')->orderBy('name');
            },
            'assignments.course:id,title,description',
            'assignments.teacher:id,name,nomor_induk',
        ])->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $classroom,
        ]);
    }

    /**
     * Create Classroom
     */
    public function createClassroom(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:classrooms,code',
            'homeroom_teacher_id' => 'nullable|exists:users,id',
            'academic_year' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'school_id' => 'nullable|exists:schools,id',
        ]);

        $schoolId = $validated['school_id'] ?? ($this->getEffectiveSchoolId($request) ?? 1);

        $classroom = Classroom::create([
            'name' => $validated['name'],
            'code' => strtoupper($validated['code']),
            'homeroom_teacher_id' => $validated['homeroom_teacher_id'] ?? null,
            'academic_year' => $validated['academic_year'] ?? '2026/2027',
            'description' => $validated['description'] ?? null,
            'school_id' => $schoolId,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Kelas baru berhasil dibuat',
            'data' => $classroom->load(['homeroomTeacher', 'school:id,name,npsn']),
        ], 201);
    }

    /**
     * Update Classroom
     */
    public function updateClassroom(Request $request, $id)
    {
        $classroom = Classroom::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => ['required', 'string', 'max:50', Rule::unique('classrooms', 'code')->ignore($classroom->id)],
            'homeroom_teacher_id' => 'nullable|exists:users,id',
            'academic_year' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        $classroom->update([
            'name' => $validated['name'],
            'code' => strtoupper($validated['code']),
            'homeroom_teacher_id' => $validated['homeroom_teacher_id'] ?? null,
            'academic_year' => $validated['academic_year'] ?? '2026/2027',
            'description' => $validated['description'] ?? null,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Data Kelas berhasil diperbarui',
            'data' => $classroom->load('homeroomTeacher'),
        ]);
    }

    /**
     * Delete Classroom
     */
    public function deleteClassroom($id)
    {
        $classroom = Classroom::findOrFail($id);
        $classroom->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Kelas berhasil dihapus',
        ]);
    }

    /**
     * Assign Student into Classroom
     */
    public function assignStudentToClass(Request $request, $classId)
    {
        $classroom = Classroom::findOrFail($classId);

        $validated = $request->validate([
            'student_id' => 'required|exists:users,id',
        ]);

        $student = User::where('role', 'murid')->findOrFail($validated['student_id']);
        $student->classroom_id = $classroom->id;
        $student->save();

        return response()->json([
            'status' => 'success',
            'message' => "Siswa {$student->name} berhasil dimasukkan ke kelas {$classroom->name}",
            'data' => $student,
        ]);
    }

    /**
     * Remove Student from Classroom
     */
    public function removeStudentFromClass($classId, $studentId)
    {
        $student = User::where('role', 'murid')->where('classroom_id', $classId)->findOrFail($studentId);
        $student->classroom_id = null;
        $student->save();

        return response()->json([
            'status' => 'success',
            'message' => "Siswa {$student->name} dikeluarkan dari kelas",
        ]);
    }

    /**
     * Add Subject & Teacher Plotting Assignment into Classroom
     */
    public function createAssignment(Request $request, $classId)
    {
        $classroom = Classroom::findOrFail($classId);

        $validated = $request->validate([
            'course_id' => 'required|exists:courses,id',
            'teacher_id' => 'required|exists:users,id',
            'schedule_day' => 'nullable|string|max:50',
            'schedule_time' => 'nullable|string|max:50',
            'room' => 'nullable|string|max:100',
        ]);

        $assignment = ClassSubjectAssignment::create([
            'classroom_id' => $classroom->id,
            'course_id' => $validated['course_id'],
            'teacher_id' => $validated['teacher_id'],
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
     * Delete Plotting Assignment
     */
    public function deleteAssignment($assignmentId)
    {
        $assignment = ClassSubjectAssignment::findOrFail($assignmentId);
        $assignment->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Plotting Guru & Mapel berhasil dihapus dari kelas',
        ]);
    }
}
