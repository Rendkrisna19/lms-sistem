<?php

namespace App\Http\Controllers\Api;

use App\Models\Classroom;
use App\Models\School;
use App\Models\User;
use App\Support\Spreadsheet\UserExporter;
use App\Support\Spreadsheet\UserImporter;
use App\Support\Spreadsheet\UserSheetLayout;
use App\Support\Spreadsheet\UserTemplate;
use App\Support\UserProfile;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

/**
 * Template, impor, dan ekspor data guru & siswa dari Excel / PDF.
 * Cakupan sekolah mengikuti SchoolAdminController (admin master wajib memilih sekolah).
 */
class AdminUserSpreadsheetController extends SchoolAdminController
{
    private const RESOURCE_ROLES = [
        'teachers' => UserSheetLayout::ROLE_TEACHER,
        'students' => UserSheetLayout::ROLE_STUDENT,
    ];

    private const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    /** Unduh template Excel yang sudah berisi daftar kelas sekolah (untuk siswa). */
    public function template(Request $request, string $resource)
    {
        $role = $this->roleFor($resource);
        $schoolId = $this->getSchoolId($request);
        $school = School::find($schoolId);

        $classrooms = Classroom::where('school_id', $schoolId)->orderBy('code')->get();
        $spreadsheet = UserTemplate::build($role, $classrooms, $school?->name ?? 'Sekolah');

        $label = UserSheetLayout::for($role)['file'];

        return $this->xlsxResponse($this->writeXlsx($spreadsheet), "{$label}.xlsx");
    }

    /**
     * Impor data. Dengan dry_run=1 hanya memeriksa dan mengembalikan laporan.
     * Jika ada satu baris yang salah, tidak ada data yang disimpan.
     */
    public function import(Request $request, string $resource)
    {
        $role = $this->roleFor($resource);
        $schoolId = $this->getSchoolId($request);

        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:5120',
            'dry_run' => 'nullable|boolean',
        ], [
            'file.required' => 'Pilih berkas Excel terlebih dahulu.',
            'file.mimes' => 'Berkas harus berformat .xlsx, .xls, atau .csv.',
            'file.max' => 'Ukuran berkas maksimal 5 MB.',
        ]);

        $report = (new UserImporter($role, $schoolId))->analyze($request->file('file')->getRealPath());
        $label = UserSheetLayout::for($role)['label'];

        $payload = [
            'total' => $report['total'],
            'valid' => $report['valid'],
            'error_rows' => count(array_unique(array_column($report['errors'], 'row'))),
            'errors' => array_slice($report['errors'], 0, 200),
            'preview' => array_map(fn (array $row) => [
                'row' => $row['row'],
                'name' => $row['name'],
                'nomor_induk' => $row['nomor_induk'],
                'email' => $row['email'],
                'classroom_code' => $row['classroom_code'] ?? null,
            ], array_slice($report['rows'], 0, 10)),
        ];

        if ($request->boolean('dry_run')) {
            return response()->json([
                'status' => 'success',
                'message' => $report['errors'] ? 'Ada baris yang perlu diperbaiki.' : "Berkas siap diimpor: {$report['valid']} {$label} baru.",
                'data' => $payload + ['can_import' => $report['errors'] === [] && $report['valid'] > 0],
            ]);
        }

        if ($report['errors'] !== []) {
            return response()->json([
                'status' => 'error',
                'message' => 'Perbaiki baris yang bertanda merah, lalu unggah ulang berkas. Tidak ada data yang disimpan.',
                'data' => $payload + ['can_import' => false],
            ], 422);
        }

        if ($report['valid'] === 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'Berkas tidak berisi data untuk diimpor.',
                'data' => $payload + ['can_import' => false],
            ], 422);
        }

        try {
            DB::transaction(function () use ($report, $role, $schoolId) {
                foreach ($report['rows'] as $row) {
                    User::create(UserProfile::fromValidated($row, $role) + [
                        'name' => $row['name'],
                        'nomor_induk' => $row['nomor_induk'],
                        'nim_nip' => $row['nomor_induk'],
                        'email' => $row['email'],
                        'password' => Hash::make($row['password']),
                        'role' => $role,
                        'school_id' => $schoolId,
                        'classroom_id' => $row['classroom_id'],
                    ]);
                }
            });
        } catch (UniqueConstraintViolationException) {
            return response()->json([
                'status' => 'error',
                'message' => 'Sebagian data baru saja terdaftar oleh proses lain. Periksa daftar, lalu unggah ulang.',
            ], 409);
        }

        return response()->json([
            'status' => 'success',
            'message' => "{$report['valid']} data {$label} berhasil diimpor.",
            'data' => ['created' => $report['valid']],
        ], 201);
    }

    /**
     * Ekspor data ke .xlsx atau .pdf. Jika `ids` dikirim, hanya baris tersebut yang diekspor
     * (urutan mengikuti daftar di layar). Kata sandi tidak pernah ikut diekspor.
     */
    public function export(Request $request, string $resource)
    {
        $role = $this->roleFor($resource);
        $schoolId = $this->getSchoolId($request);

        $validated = $request->validate([
            'format' => 'required|in:xlsx,pdf',
            'ids' => 'nullable|array|max:5000',
            'ids.*' => 'integer',
        ]);

        $query = User::where('role', $role)->where('school_id', $schoolId)->with('classroom:id,name,code');
        if (array_key_exists('ids', $validated) && $validated['ids'] !== null) {
            $ids = array_values(array_unique(array_map('intval', $validated['ids'])));
            $query->whereIn('id', $ids);
            $users = $query->get()->sortBy(fn (User $user) => array_search($user->id, $ids, true))->values();
        } else {
            $users = $query->orderBy('name')->get();
        }

        $schoolName = School::find($schoolId)?->name ?? 'Sekolah';
        $label = UserSheetLayout::for($role)['label'];
        $stamp = now('Asia/Jakarta')->format('Y-m-d');
        $base = "Daftar_{$label}_{$stamp}";

        if ($validated['format'] === 'pdf') {
            return response(UserExporter::toPdf($users, $role, $schoolName), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => "attachment; filename=\"{$base}.pdf\"",
            ]);
        }

        return $this->xlsxResponse(UserExporter::toXlsx($users, $role, $schoolName), "{$base}.xlsx");
    }

    private function roleFor(string $resource): string
    {
        return self::RESOURCE_ROLES[$resource] ?? abort(404);
    }

    private function writeXlsx(\PhpOffice\PhpSpreadsheet\Spreadsheet $spreadsheet): string
    {
        ob_start();
        (new Xlsx($spreadsheet))->save('php://output');

        return (string) ob_get_clean();
    }

    private function xlsxResponse(string $content, string $fileName)
    {
        return response($content, 200, [
            'Content-Type' => self::XLSX_MIME,
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ]);
    }
}
