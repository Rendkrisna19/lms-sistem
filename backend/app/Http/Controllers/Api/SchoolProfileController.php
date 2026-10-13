<?php

namespace App\Http\Controllers\Api;

use App\Models\School;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

/**
 * Profil sekolah (logo, identitas, akreditasi), manajemen admin sekolah, dan daftar seluruh akun sekolah.
 * Admin sekolah hanya mengelola sekolahnya sendiri. Admin master dapat memilih sekolah atau melihat semuanya.
 */
class SchoolProfileController extends SchoolAdminController
{
    private const ACCREDITATIONS = ['A', 'B', 'C', 'Belum Terakreditasi'];

    private const JENJANG = ['SD', 'SMP', 'SMA', 'SMK', 'MA', 'MTs'];

    /** Sekolah milik admin yang login (atau sekolah terpilih untuk admin master). */
    public function show(Request $request)
    {
        $school = School::withCount(['teachers', 'students'])
            ->findOrFail($this->schoolIdFor($request));

        return response()->json(['status' => 'success', 'data' => $this->format($school)]);
    }

    /** Ubah profil sekolah termasuk logo. Logo lama dihapus saat diganti. */
    public function update(Request $request)
    {
        $school = School::findOrFail($this->schoolIdFor($request));

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'npsn' => ['nullable', 'string', 'max:50', Rule::unique('schools', 'npsn')->ignore($school->id)],
            'jenjang' => ['nullable', Rule::in(self::JENJANG)],
            'accreditation' => ['nullable', Rule::in(self::ACCREDITATIONS)],
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:255',
            'logo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048|dimensions:max_width=4000,max_height=4000',
            'remove_logo' => 'nullable|boolean',
        ], [
            'npsn.unique' => 'NPSN ini sudah dipakai sekolah lain.',
            'logo.max' => 'Ukuran logo maksimal 2 MB.',
            'logo.mimes' => 'Logo harus berformat JPG, PNG, atau WEBP.',
            'logo.image' => 'Berkas logo harus berupa gambar.',
        ]);

        $attributes = collect($validated)->only(['name', 'npsn', 'jenjang', 'accreditation', 'address', 'phone', 'email'])->all();

        if ($request->hasFile('logo')) {
            $this->deleteLogo($school);
            $attributes['logo'] = $request->file('logo')->store('schools/logos', 'public');
        } elseif ($request->boolean('remove_logo')) {
            $this->deleteLogo($school);
            $attributes['logo'] = null;
        }

        $school->update($attributes);

        return response()->json([
            'status' => 'success',
            'message' => 'Data sekolah berhasil diperbarui.',
            'data' => $this->format($school->refresh()->loadCount(['teachers', 'students'])),
        ]);
    }

    /**
     * Semua akun di sekolah: guru, siswa, dan admin. Filter peran dapat dipilih; pencarian di sisi server.
     */
    public function accounts(Request $request)
    {
        $schoolId = $this->optionalSchoolId($request);

        $query = User::query()->whereIn('role', ['guru', 'murid', 'admin'])->with(['school:id,name', 'classroom:id,name,code']);
        if ($schoolId !== null) {
            $query->where('school_id', $schoolId);
        }
        if (in_array($request->query('role'), ['guru', 'murid', 'admin'], true)) {
            $query->where('role', $request->query('role'));
        }
        if (filled($keyword = trim((string) $request->query('q')))) {
            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                    ->orWhere('email', 'like', "%{$keyword}%")
                    ->orWhere('nomor_induk', 'like', "%{$keyword}%");
            });
        }

        $accounts = $query->orderBy('name')->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'summary' => [
                    'total' => $accounts->count(),
                    'guru' => $accounts->where('role', 'guru')->count(),
                    'murid' => $accounts->where('role', 'murid')->count(),
                    'admin' => $accounts->where('role', 'admin')->count(),
                ],
                'accounts' => $accounts->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'nomor_induk' => $user->nomor_induk ?? $user->nim_nip,
                    'school' => $user->school?->name,
                    'classroom' => $user->classroom?->name,
                    'created_at' => $user->created_at?->toIso8601String(),
                    'is_self' => $user->id === $request->user()->id,
                ])->values(),
            ],
        ]);
    }

    /** Tambah admin sekolah baru untuk sekolah ini. */
    public function storeAdmin(Request $request)
    {
        $schoolId = $this->schoolIdFor($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nomor_induk' => 'required|string|max:50|unique:users,nomor_induk',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
        ]);

        $admin = User::create([
            'name' => $validated['name'],
            'nomor_induk' => $validated['nomor_induk'],
            'nim_nip' => $validated['nomor_induk'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'admin',
            'school_id' => $schoolId,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Admin {$admin->name} berhasil ditambahkan.",
            'data' => ['id' => $admin->id],
        ], 201);
    }

    /** Hapus admin sekolah lain di sekolah yang sama. Akun sendiri tidak dapat dihapus dari sini. */
    public function destroyAdmin(Request $request, $id)
    {
        $schoolId = $this->schoolIdFor($request);
        $admin = User::where('role', 'admin')->where('school_id', $schoolId)->findOrFail($id);

        if ($admin->id === $request->user()->id) {
            return response()->json(['status' => 'error', 'message' => 'Anda tidak dapat menghapus akun Anda sendiri.'], 422);
        }

        $name = $admin->name;
        $admin->tokens()->delete();
        $admin->delete();

        return response()->json(['status' => 'success', 'message' => "Admin {$name} berhasil dihapus."]);
    }

    /** Sekolah yang dikelola: milik admin, atau sekolah terpilih untuk admin master. */
    private function schoolIdFor(Request $request): int
    {
        return $this->getSchoolId($request);
    }

    /** Untuk daftar akun: admin master boleh tanpa memilih sekolah (semua sekolah). */
    private function optionalSchoolId(Request $request): ?int
    {
        $user = $request->user();
        if ($user->role === 'admin') {
            return (int) $user->school_id;
        }
        $value = $request->query('school_id');

        return ($value === null || $value === '' || $value === 'all') ? null : (int) $value;
    }

    private function deleteLogo(School $school): void
    {
        if ($school->logo && Storage::disk('public')->exists($school->logo)) {
            Storage::disk('public')->delete($school->logo);
        }
    }

    private function format(School $school): array
    {
        return [
            'id' => $school->id,
            'name' => $school->name,
            'npsn' => $school->npsn,
            'jenjang' => $school->jenjang,
            'accreditation' => $school->accreditation,
            'address' => $school->address,
            'phone' => $school->phone,
            'email' => $school->email,
            'logo_url' => $school->logo ? asset('storage/' . $school->logo) : null,
            'status' => $school->status,
            'teachers_count' => $school->teachers_count ?? 0,
            'students_count' => $school->students_count ?? 0,
            'admins' => $school->users()->where('role', 'admin')->orderBy('name')->get(['id', 'name', 'email', 'nomor_induk'])->values(),
        ];
    }
}
