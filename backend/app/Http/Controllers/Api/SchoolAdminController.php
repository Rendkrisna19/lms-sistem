<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassSubjectAssignment;
use App\Models\Classroom;
use App\Models\Course;
use App\Models\LearningMaterial;
use App\Models\Lesson;
use App\Models\Quiz;
use App\Models\School;
use App\Models\User;
use App\Support\LearningAnalytics;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

class SchoolAdminController extends Controller
{
    /**
     * Sekolah yang sedang dikelola:
     * - admin sekolah  => selalu sekolah miliknya sendiri
     * - admin master   => wajib memilih sekolah melalui parameter school_id
     */
    protected function getSchoolId(Request $request): int
    {
        $user = $request->user();

        if ($user->role === 'admin') {
            if (!$user->school_id) {
                abort(response()->json([
                    'status' => 'error',
                    'message' => 'Akun admin belum terhubung ke sekolah mana pun.',
                ], 403));
            }

            return (int) $user->school_id;
        }

        $schoolId = $request->input('school_id');
        if (blank($schoolId) || $schoolId === 'all') {
            abort(response()->json([
                'status' => 'error',
                'message' => 'Pilih sekolah terlebih dahulu.',
                'errors' => ['school_id' => ['Pilih sekolah terlebih dahulu.']],
            ], 422));
        }

        if (!ctype_digit((string) $schoolId) || !School::whereKey($schoolId)->exists()) {
            abort(response()->json([
                'status' => 'error',
                'message' => 'Sekolah yang dipilih tidak ditemukan.',
                'errors' => ['school_id' => ['Sekolah yang dipilih tidak ditemukan.']],
            ], 422));
        }

        return (int) $schoolId;
    }

    private function teacherOfSchool(int $schoolId): Exists
    {
        return Rule::exists('users', 'id')->where('role', 'guru')->where('school_id', $schoolId);
    }

    private function studentOfSchool(int $schoolId): Exists
    {
        return Rule::exists('users', 'id')->where('role', 'murid')->where('school_id', $schoolId);
    }

    private function classroomOfSchool(int $schoolId): Exists
    {
        return Rule::exists('classrooms', 'id')->where('school_id', $schoolId);
    }

    private function courseOfSchool(int $schoolId): Exists
    {
        return Rule::exists('courses', 'id')->where('school_id', $schoolId);
    }

    private function scopeMessages(): array
    {
        return [
            'classroom_id.exists' => 'Kelas yang dipilih tidak terdaftar di sekolah ini.',
            'homeroom_teacher_id.exists' => 'Wali kelas harus guru yang terdaftar di sekolah ini.',
            'instructor_id.exists' => 'Guru pengampu harus guru yang terdaftar di sekolah ini.',
            'teacher_id.exists' => 'Guru yang dipilih tidak terdaftar di sekolah ini.',
            'course_id.exists' => 'Mata pelajaran yang dipilih tidak terdaftar di sekolah ini.',
            'student_id.exists' => 'Siswa yang dipilih tidak terdaftar di sekolah ini.',
            'password.required' => 'Kata sandi wajib diisi.',
            'password.min' => 'Kata sandi minimal 8 karakter.',
        ];
    }

    /**
     * Dashboard Overview khusus Admin Sekolah
     */
    public function overview(Request $request)
    {
        $schoolId = $this->getSchoolId($request);
        $school = School::findOrFail($schoolId);

        $schoolCourses = fn ($q) => $q->where('school_id', $schoolId);

        return response()->json([
            'status' => 'success',
            'data' => [
                'school' => $school,
                'total_teachers' => User::where('role', 'guru')->where('school_id', $schoolId)->count(),
                'total_students' => User::where('role', 'murid')->where('school_id', $schoolId)->count(),
                'total_classrooms' => Classroom::where('school_id', $schoolId)->count(),
                'total_courses' => Course::where('school_id', $schoolId)->count(),
                'total_lessons' => Lesson::whereHas('course', $schoolCourses)->count(),
                'total_quizzes' => Quiz::where(function ($q) use ($schoolId, $schoolCourses) {
                    $q->where('school_id', $schoolId)->orWhereHas('course', $schoolCourses);
                })->count(),
            ],
        ]);
    }

    /**
     * Analisis gaya belajar siswa di sekolah ini (berdasarkan log akses bahan ajar)
     */
    public function learningAnalytics(Request $request)
    {
        $schoolId = $this->getSchoolId($request);

        $students = User::where('role', 'murid')->where('school_id', $schoolId);
        if ($request->filled('classroom_id') && $request->input('classroom_id') !== 'all') {
            $students->where('classroom_id', $request->input('classroom_id'));
        }

        return response()->json([
            'status' => 'success',
            'data' => LearningAnalytics::build($students),
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
            'nomor_induk' => 'required|string|max:50|unique:users,nomor_induk',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
        ], $this->scopeMessages());

        $teacher = User::create([
            'name' => $validated['name'],
            'nomor_induk' => $validated['nomor_induk'],
            'nim_nip' => $validated['nomor_induk'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
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
            'nomor_induk' => ['required', 'string', 'max:50', Rule::unique('users', 'nomor_induk')->ignore($teacher->id)],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($teacher->id)],
            'password' => 'nullable|string|min:8',
        ], $this->scopeMessages());

        $teacher->name = $validated['name'];
        $teacher->nomor_induk = $validated['nomor_induk'];
        $teacher->nim_nip = $validated['nomor_induk'];
        $teacher->email = $validated['email'];
        $passwordChanged = $this->applyPassword($teacher, $validated['password'] ?? null);
        $teacher->save();

        if ($passwordChanged) {
            $teacher->tokens()->delete();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Data Guru berhasil diperbarui',
            'data' => $teacher->load('school:id,name,npsn'),
        ]);
    }

    public function deleteTeacher(Request $request, $id)
    {
        $schoolId = $this->getSchoolId($request);
        $teacher = User::where('role', 'guru')->where('school_id', $schoolId)->findOrFail($id);

        // Relasi berikut ber-cascade: menghapus guru akan ikut menghapus kuis (beserta nilai siswa),
        // bahan ajar, plotting kelas, dan mapel. Tolak penghapusan selama data tersebut masih ada.
        $dependencies = array_filter([
            'kuis' => Quiz::where('teacher_id', $teacher->id)->count(),
            'bahan ajar' => LearningMaterial::where('teacher_id', $teacher->id)->count(),
            'plotting mengajar di kelas' => ClassSubjectAssignment::where('teacher_id', $teacher->id)->count(),
            'mata pelajaran sebagai pengampu' => Course::where('instructor_id', $teacher->id)->count(),
        ]);

        if (!empty($dependencies)) {
            $details = collect($dependencies)->map(fn ($count, $label) => "{$count} {$label}")->implode(', ');

            return response()->json([
                'status' => 'error',
                'message' => "Guru {$teacher->name} tidak dapat dihapus karena masih memiliki {$details}. "
                    . 'Pindahkan atau hapus data tersebut terlebih dahulu agar nilai dan materi siswa tidak ikut terhapus.',
                'dependencies' => $dependencies,
            ], 422);
        }

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
            'nomor_induk' => 'required|string|max:50|unique:users,nomor_induk',
            'email' => 'required|email|max:255|unique:users,email',
            'classroom_id' => ['nullable', 'integer', $this->classroomOfSchool($schoolId)],
            'password' => 'required|string|min:8',
        ], $this->scopeMessages());

        $student = User::create([
            'name' => $validated['name'],
            'nomor_induk' => $validated['nomor_induk'],
            'nim_nip' => $validated['nomor_induk'],
            'email' => $validated['email'],
            'classroom_id' => $validated['classroom_id'] ?? null,
            'school_id' => $schoolId,
            'password' => Hash::make($validated['password']),
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
            'nomor_induk' => ['required', 'string', 'max:50', Rule::unique('users', 'nomor_induk')->ignore($student->id)],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($student->id)],
            'classroom_id' => ['nullable', 'integer', $this->classroomOfSchool($schoolId)],
            'password' => 'nullable|string|min:8',
        ], $this->scopeMessages());

        $student->name = $validated['name'];
        $student->nomor_induk = $validated['nomor_induk'];
        $student->nim_nip = $validated['nomor_induk'];
        $student->email = $validated['email'];
        if ($request->has('classroom_id')) {
            $student->classroom_id = $validated['classroom_id'] ?? null;
        }
        $passwordChanged = $this->applyPassword($student, $validated['password'] ?? null);
        $student->save();

        if ($passwordChanged) {
            $student->tokens()->delete();
        }

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
                'subjectAssignments.course:id,title',
            ])
            ->withCount('students')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $classrooms,
        ]);
    }

    private function classroomRules(int $schoolId, ?int $ignoreId = null): array
    {
        return [
            'name' => 'required|string|max:255',
            'code' => [
                'required', 'string', 'max:50',
                Rule::unique('classrooms', 'code')->where('school_id', $schoolId)->ignore($ignoreId),
            ],
            'homeroom_teacher_id' => ['nullable', 'integer', $this->teacherOfSchool($schoolId)],
            'academic_year' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ];
    }

    private function classroomMessages(): array
    {
        return $this->scopeMessages() + [
            'code.unique' => 'Kode kelas sudah digunakan di sekolah ini.',
        ];
    }

    public function createClassroom(Request $request)
    {
        $schoolId = $this->getSchoolId($request);
        $validated = $request->validate($this->classroomRules($schoolId), $this->classroomMessages());

        $classroom = Classroom::create([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'school_id' => $schoolId,
            'homeroom_teacher_id' => $validated['homeroom_teacher_id'] ?? null,
            'academic_year' => $validated['academic_year'] ?? '2026/2027',
            'description' => $validated['description'] ?? null,
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

        $validated = $request->validate($this->classroomRules($schoolId, $classroom->id), $this->classroomMessages());

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
        $classroom = Classroom::where('school_id', $schoolId)
            ->with([
                'school:id,name,npsn',
                'homeroomTeacher:id,name,nomor_induk,email',
                'students' => function ($q) {
                    $q->select('id', 'name', 'nomor_induk', 'email', 'classroom_id', 'school_id')->orderBy('name');
                },
                'subjectAssignments.course:id,title,description',
                'subjectAssignments.teacher:id,name,nomor_induk,email',
                'assignments.course:id,title,description',
                'assignments.teacher:id,name,nomor_induk,email',
            ])
            ->findOrFail($id);

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
        $classroom = Classroom::where('school_id', $schoolId)->findOrFail($classId);

        $validated = $request->validate([
            'student_id' => ['required', 'integer', $this->studentOfSchool($schoolId)],
        ], $this->scopeMessages());

        $student = User::where('role', 'murid')->where('school_id', $schoolId)->findOrFail($validated['student_id']);
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
        $classroom = Classroom::where('school_id', $schoolId)->findOrFail($classId);

        $student = User::where('role', 'murid')
            ->where('school_id', $schoolId)
            ->where('classroom_id', $classroom->id)
            ->findOrFail($studentId);
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
        $classroom = Classroom::where('school_id', $schoolId)->findOrFail($classId);

        $validated = $request->validate([
            'course_id' => [
                'required', 'integer', $this->courseOfSchool($schoolId),
                Rule::unique('class_subject_assignments', 'course_id')->where('classroom_id', $classroom->id),
            ],
            'teacher_id' => ['required', 'integer', $this->teacherOfSchool($schoolId)],
            'schedule_day' => 'nullable|string|max:50',
            'schedule_time' => 'nullable|string|max:50',
            'room' => 'nullable|string|max:100',
        ], $this->scopeMessages() + [
            'course_id.unique' => 'Mata pelajaran ini sudah diplot di kelas tersebut.',
        ]);

        $assignment = ClassSubjectAssignment::create([
            'classroom_id' => $classroom->id,
            'course_id' => $validated['course_id'],
            'teacher_id' => $validated['teacher_id'],
            'schedule_day' => $validated['schedule_day'] ?? null,
            'schedule_time' => $validated['schedule_time'] ?? null,
            'room' => $validated['room'] ?? null,
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
        $assignment = ClassSubjectAssignment::whereHas('classroom', fn ($q) => $q->where('school_id', $schoolId))
            ->findOrFail($assignmentId);
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

    private function courseRules(int $schoolId): array
    {
        return [
            'title' => 'required|string|max:255',
            'code' => 'nullable|string|max:50', // tidak disimpan (kolom tidak ada); diterima demi kompatibilitas frontend
            'description' => 'nullable|string',
            'instructor_id' => ['required', 'integer', $this->teacherOfSchool($schoolId)],
        ];
    }

    public function createCourse(Request $request)
    {
        $schoolId = $this->getSchoolId($request);
        $validated = $request->validate($this->courseRules($schoolId), $this->scopeMessages());

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

        $validated = $request->validate($this->courseRules($schoolId), $this->scopeMessages());

        $course->update([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? '',
            'instructor_id' => $validated['instructor_id'],
        ]);

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

    /**
     * Set kata sandi baru bila diisi. Mengembalikan true jika kata sandi berubah.
     */
    private function applyPassword(User $user, ?string $password): bool
    {
        if (blank($password)) {
            return false;
        }

        $user->password = Hash::make($password);

        return true;
    }
}
