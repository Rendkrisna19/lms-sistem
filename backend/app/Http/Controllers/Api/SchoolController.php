<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\User;
use App\Support\AttemptStats;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class SchoolController extends Controller
{
    private const COUNTS = ['students', 'teachers', 'classrooms', 'courses'];

    private const ADMIN_COLUMNS = 'admin:id,name,email,nomor_induk,school_id';

    /**
     * List all schools with summary counts and assigned admin
     */
    public function index()
    {
        $schools = School::with(self::ADMIN_COLUMNS)
            ->withCount(self::COUNTS)
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $schools,
        ]);
    }

    /**
     * Detail of specific school
     */
    public function show($id)
    {
        $school = School::with([
            self::ADMIN_COLUMNS,
            'teachers:id,name,nomor_induk,email,school_id',
            'students' => function ($q) {
                $q->select('id', 'name', 'nomor_induk', 'email', 'classroom_id', 'school_id')
                    ->with('classroom:id,name,code');
            },
            'classrooms:id,name,code,school_id,homeroom_teacher_id',
            'courses:id,title,school_id,instructor_id',
        ])->withCount(self::COUNTS)->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $school,
        ]);
    }

    private function schoolRules(?School $school = null): array
    {
        return [
            'name' => 'required|string|max:255',
            'npsn' => ['nullable', 'string', 'max:50', Rule::unique('schools', 'npsn')->ignore($school?->id)],
            'jenjang' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'status' => 'nullable|in:active,inactive',
        ];
    }

    private function adminMessages(): array
    {
        return [
            'admin_email.unique' => 'Email admin sudah digunakan oleh akun lain.',
            'admin_password.required_with' => 'Kata sandi admin wajib diisi saat membuat akun admin sekolah.',
            'admin_password.min' => 'Kata sandi admin minimal 8 karakter.',
            'admin_nip.unique' => 'Nomor induk admin sudah digunakan oleh akun lain.',
        ];
    }

    private function schoolAttributes(array $validated): array
    {
        return [
            'name' => $validated['name'],
            'npsn' => $validated['npsn'] ?? null,
            'jenjang' => $validated['jenjang'] ?? 'SMA',
            'address' => $validated['address'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'status' => $validated['status'] ?? 'active',
        ];
    }

    /**
     * Create new school and its school admin account
     */
    public function store(Request $request)
    {
        $validated = $request->validate($this->schoolRules() + [
            'admin_name' => 'nullable|string|max:255',
            'admin_email' => 'nullable|email|max:255|unique:users,email',
            'admin_password' => 'nullable|required_with:admin_email|string|min:8',
            'admin_nip' => 'nullable|string|max:50|unique:users,nomor_induk',
        ], $this->adminMessages());

        $school = DB::transaction(function () use ($validated) {
            $school = School::create($this->schoolAttributes($validated));

            // Buat akun admin sekolah jika email disediakan
            if (!empty($validated['admin_email'])) {
                $this->createAdmin($school, $validated);
            }

            return $school;
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Data sekolah dan akun admin berhasil ditambahkan',
            'data' => $school->load(self::ADMIN_COLUMNS)->loadCount(self::COUNTS),
        ], 201);
    }

    /**
     * Update school details and its admin account
     */
    public function update(Request $request, $id)
    {
        $school = School::findOrFail($id);
        $admin = User::where('role', 'admin')->where('school_id', $school->id)->first();

        $validated = $request->validate($this->schoolRules($school) + [
            'admin_name' => 'nullable|string|max:255',
            'admin_email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($admin?->id)],
            // Kata sandi wajib hanya ketika akun admin baru akan dibuat
            'admin_password' => $admin
                ? ['nullable', 'string', 'min:8']
                : ['nullable', 'required_with:admin_email', 'string', 'min:8'],
            'admin_nip' => ['nullable', 'string', 'max:50', Rule::unique('users', 'nomor_induk')->ignore($admin?->id)],
        ], $this->adminMessages());

        DB::transaction(function () use ($school, $admin, $validated) {
            $school->update($this->schoolAttributes($validated));

            if (empty($validated['admin_email'])) {
                return;
            }

            if (!$admin) {
                $this->createAdmin($school, $validated);

                return;
            }

            $admin->name = ($validated['admin_name'] ?? null) ?: $admin->name;
            $admin->email = $validated['admin_email'];
            if (!empty($validated['admin_nip'])) {
                $admin->nomor_induk = $validated['admin_nip'];
                $admin->nim_nip = $validated['admin_nip'];
            }

            $passwordChanged = !empty($validated['admin_password']);
            if ($passwordChanged) {
                $admin->password = Hash::make($validated['admin_password']);
            }
            $admin->save();

            if ($passwordChanged) {
                $admin->tokens()->delete();
            }
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Data sekolah berhasil diperbarui',
            'data' => $school->load(self::ADMIN_COLUMNS)->loadCount(self::COUNTS),
        ]);
    }

    /**
     * Delete school
     */
    public function destroy($id)
    {
        $school = School::findOrFail($id);
        $schoolName = $school->name;
        $school->delete();

        return response()->json([
            'status' => 'success',
            'message' => "Sekolah {$schoolName} berhasil dihapus dari sistem",
        ]);
    }

    /**
     * In-depth Student Analytics per School
     */
    public function analytics($id)
    {
        $school = School::with([
            'classrooms' => function ($q) {
                $q->withCount('students');
            },
        ])->withCount(self::COUNTS)->findOrFail($id);

        $stats = AttemptStats::summarize(function ($query) use ($school) {
            $query->whereIn('quiz_attempts.user_id', User::select('id')
                ->where('school_id', $school->id)
                ->where('role', 'murid'));
        });

        // Distribusi Rombel & Murid
        $classroomsDist = $school->classrooms->map(fn ($c) => [
            'id' => $c->id,
            'name' => $c->name,
            'code' => $c->code,
            'students_count' => $c->students_count,
        ]);

        return response()->json([
            'status' => 'success',
            'data' => [
                'school' => [
                    'id' => $school->id,
                    'name' => $school->name,
                    'npsn' => $school->npsn,
                    'jenjang' => $school->jenjang,
                    'address' => $school->address,
                    'status' => $school->status,
                ],
                'summary' => [
                    'total_students' => $school->students_count,
                    'total_teachers' => $school->teachers_count,
                    'total_classrooms' => $school->classrooms_count,
                    'total_courses' => $school->courses_count,
                    'total_exam_attempts' => $stats['total'],
                    'average_exam_score' => $stats['average_score'],
                    'pass_rate_percentage' => $stats['pass_rate'],
                ],
                'classrooms' => $classroomsDist,
            ],
        ]);
    }

    private function createAdmin(School $school, array $validated): User
    {
        $nip = ($validated['admin_nip'] ?? null) ?: $this->defaultAdminNip($school);

        return User::create([
            'name' => ($validated['admin_name'] ?? null) ?: ('Admin ' . $school->name),
            'email' => $validated['admin_email'],
            'password' => Hash::make($validated['admin_password']),
            'role' => 'admin',
            'nomor_induk' => $nip,
            'nim_nip' => $nip,
            'school_id' => $school->id,
        ]);
    }

    /**
     * Nomor induk default admin sekolah (ADM001, ADM002, ...) yang dijamin belum dipakai.
     */
    private function defaultAdminNip(School $school): string
    {
        $base = 'ADM' . str_pad((string) $school->id, 3, '0', STR_PAD_LEFT);
        $candidate = $base;
        $suffix = 1;

        while (User::where('nomor_induk', $candidate)->exists()) {
            $candidate = $base . '-' . $suffix++;
        }

        return $candidate;
    }
}
