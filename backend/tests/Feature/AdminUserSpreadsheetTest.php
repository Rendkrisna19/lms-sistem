<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Tests\Concerns\LmsFixtures;
use Tests\TestCase;

/**
 * Template, impor, dan ekspor Excel/PDF untuk data guru dan siswa oleh admin sekolah.
 */
class AdminUserSpreadsheetTest extends TestCase
{
    use LmsFixtures, RefreshDatabase;

    /** Membuat berkas xlsx dari baris-baris (baris pertama = header). */
    private function xlsxUpload(array $rows, string $sheetTitle = 'Data Siswa'): UploadedFile
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle($sheetTitle);
        foreach ($rows as $r => $row) {
            foreach ($row as $c => $value) {
                $sheet->setCellValueExplicit(chr(65 + $c) . ($r + 1), (string) $value, \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
            }
        }

        ob_start();
        (new Xlsx($spreadsheet))->save('php://output');
        $bytes = ob_get_clean();

        return UploadedFile::fake()->createWithContent('impor.xlsx', $bytes);
    }

    private function studentRows(array $extra = []): array
    {
        return array_merge([
            ['Nama Lengkap *', 'NIS *', 'Email *', 'Kata Sandi *', 'Kode Kelas'],
            ['Dewi Rahma', '30001', 'dewi.rahma@sekolah.sch.id', 'rahasia123', ''],
        ], $extra);
    }

    public function test_template_contains_styled_headers_classroom_dropdown_and_instructions(): void
    {
        $world = $this->createSchoolWorld();
        Sanctum::actingAs($world['admin']);

        $response = $this->get('/api/admin/students/template')->assertOk();
        $this->assertStringContainsString('spreadsheetml.sheet', $response->headers->get('Content-Type'));

        $path = tempnam(sys_get_temp_dir(), 'tpl') . '.xlsx';
        file_put_contents($path, $response->getContent());
        $book = IOFactory::load($path);

        $this->assertSame(['Data Siswa', 'Daftar Kelas', 'Petunjuk'], $book->getSheetNames());
        $data = $book->getSheetByName('Data Siswa');
        $this->assertSame('Nama Lengkap *', $data->getCell('A1')->getValue());
        $this->assertSame('NIS *', $data->getCell('B1')->getValue());
        $this->assertSame('Kode Kelas', $data->getCell('E1')->getValue());
        $this->assertSame('@', $data->getStyle('B2')->getNumberFormat()->getFormatCode());
        $this->assertSame('2563EB', $data->getStyle('A1')->getFill()->getStartColor()->getRGB());
        $this->assertNotNull($data->getCell('E2')->getDataValidation()->getFormula1());
        $this->assertSame($world['classroom']->code, $book->getSheetByName('Daftar Kelas')->getCell('A2')->getValue());
    }

    public function test_dry_run_reports_every_problem_and_saves_nothing(): void
    {
        $world = $this->createSchoolWorld();
        User::factory()->murid()->create(['nomor_induk' => '30009', 'nim_nip' => '30009', 'email' => 'sudah@ada.id', 'school_id' => $world['school']->id]);

        $file = $this->xlsxUpload($this->studentRows([
            ['Budi', '30002', 'budi@sekolah.sch.id', 'pendek', ''],          // kata sandi terlalu pendek
            ['Siti', '30003', 'bukan-email', 'rahasia123', ''],              // email tidak valid
            ['Ani', '30009', 'ani@sekolah.sch.id', 'rahasia123', ''],        // NIS sudah terdaftar
            ['Rina', '30004', 'rina@sekolah.sch.id', 'rahasia123', 'XX-99'], // kode kelas tidak ada
            ['Dewi kembar', '30001', 'lain@sekolah.sch.id', 'rahasia123', ''], // NIS duplikat dalam berkas
            ['Joko', '3.0005E+15', 'joko@sekolah.sch.id', 'rahasia123', ''], // NIS rusak notasi ilmiah
        ]));

        Sanctum::actingAs($world['admin']);
        $response = $this->post('/api/admin/students/import', ['file' => $file, 'dry_run' => 1], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.can_import', false);

        $messages = collect($response->json('data.errors'))->pluck('message')->implode(' | ');
        $this->assertStringContainsString('minimal 8', strtolower($messages));
        $this->assertStringContainsString('Format email tidak valid', $messages);
        $this->assertStringContainsString('sudah terdaftar', $messages);
        $this->assertStringContainsString('XX-99', $messages);
        $this->assertStringContainsString('sudah ada di baris lain', $messages);
        $this->assertStringContainsString('notasi ilmiah', $messages);

        $this->assertSame(1, User::where('role', 'murid')->where('school_id', $world['school']->id)->where('nomor_induk', '30009')->count());
        $this->assertFalse(User::where('nomor_induk', '30001')->exists());
    }

    public function test_valid_file_is_imported_with_classroom_and_hashed_password(): void
    {
        $world = $this->createSchoolWorld();
        $file = $this->xlsxUpload($this->studentRows([
            ['Eko Prasetyo', '30010', 'eko@sekolah.sch.id', 'rahasia123', strtolower($world['classroom']->code)],
            ['Fajar Hidayat', '30011', 'fajar@sekolah.sch.id', 'rahasia456', ''],
        ]));

        Sanctum::actingAs($world['admin']);
        $this->post('/api/admin/students/import', ['file' => $file], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.created', 3);

        $eko = User::where('nomor_induk', '30010')->firstOrFail();
        $this->assertSame('murid', $eko->role);
        $this->assertSame($world['school']->id, $eko->school_id);
        $this->assertSame($world['classroom']->id, $eko->classroom_id);
        $this->assertTrue(Hash::check('rahasia123', $eko->password));
        $this->assertNull(User::where('nomor_induk', '30011')->firstOrFail()->classroom_id);
    }

    public function test_file_with_any_error_is_rejected_without_saving_anything(): void
    {
        $world = $this->createSchoolWorld();
        $file = $this->xlsxUpload($this->studentRows([['Gagal', '30020', 'tidak-valid', 'rahasia123', '']]));

        Sanctum::actingAs($world['admin']);
        $this->post('/api/admin/students/import', ['file' => $file], ['Accept' => 'application/json'])
            ->assertStatus(422);

        $this->assertFalse(User::where('nomor_induk', '30020')->exists());
    }

    public function test_teacher_import_uses_nip_and_role_guru(): void
    {
        $world = $this->createSchoolWorld();
        $file = $this->xlsxUpload([
            ['Nama Lengkap *', 'NIP *', 'Email *', 'Kata Sandi *'],
            ['Ratna Sari, M.Cs.', '199104252018032001', 'ratna@sekolah.sch.id', 'rahasia123'],
        ], 'Data Guru');

        Sanctum::actingAs($world['admin']);
        $this->post('/api/admin/teachers/import', ['file' => $file], ['Accept' => 'application/json'])
            ->assertCreated();

        $teacher = User::where('nomor_induk', '199104252018032001')->firstOrFail();
        $this->assertSame('guru', $teacher->role);
        $this->assertSame($world['school']->id, $teacher->school_id);
    }

    public function test_export_xlsx_contains_only_selected_rows_of_own_school_without_passwords(): void
    {
        $world = $this->createSchoolWorld();
        $mine = User::factory()->murid()->create(['school_id' => $world['school']->id, 'classroom_id' => $world['classroom']->id, 'name' => 'Ahmad Pilihan', 'nomor_induk' => '40001', 'nim_nip' => '40001']);
        User::factory()->murid()->create(['school_id' => $world['school']->id, 'name' => 'Tidak Dipilih', 'nomor_induk' => '40002', 'nim_nip' => '40002']);
        $other = $this->createSchoolWorld()['student'];

        Sanctum::actingAs($world['admin']);
        $response = $this->postJson('/api/admin/students/export', [
            'format' => 'xlsx',
            'ids' => [$mine->id, $other->id],
        ])->assertOk();

        $this->assertStringContainsString('spreadsheetml.sheet', $response->headers->get('Content-Type'));
        $path = tempnam(sys_get_temp_dir(), 'exp') . '.xlsx';
        file_put_contents($path, $response->getContent());
        $sheet = IOFactory::load($path)->getActiveSheet();

        // Kolom A = nomor urut, lalu Nama Lengkap, NIS, Email, Kode Kelas
        $this->assertSame('Nama Lengkap', $sheet->getCell('B4')->getValue());
        $this->assertSame('NIS', $sheet->getCell('C4')->getValue());
        $this->assertSame('Ahmad Pilihan', $sheet->getCell('B5')->getValue());
        $this->assertSame('40001', $sheet->getCell('C5')->getValue());
        $this->assertNull($sheet->getCell('B6')->getValue());
        $headers = collect(range('A', 'F'))->map(fn ($c) => $sheet->getCell("{$c}4")->getValue())->filter()->implode(',');
        $this->assertStringNotContainsString('Kata Sandi', $headers);
        $this->assertStringNotContainsString('rahasia', $response->getContent());
    }

    public function test_export_pdf_returns_pdf_document(): void
    {
        $world = $this->createSchoolWorld();

        Sanctum::actingAs($world['admin']);
        $response = $this->postJson('/api/admin/teachers/export', ['format' => 'pdf'])->assertOk();

        $this->assertSame('application/pdf', $response->headers->get('Content-Type'));
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }
}
