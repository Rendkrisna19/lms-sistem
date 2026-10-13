<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\Concerns\LmsFixtures;
use Tests\TestCase;

/**
 * Data profil guru dan siswa (pribadi, kontak, pendidikan, orang tua) di form admin dan impor Excel.
 */
class AdminUserProfileTest extends TestCase
{
    use LmsFixtures, RefreshDatabase;

    private function teacherPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Yulia Rahmawati, S.Pd.',
            'nomor_induk' => '198507152010122009',
            'email' => 'yulia@sekolah.sch.id',
            'password' => 'rahasia123',
            'gender' => 'P',
            'birth_place' => 'Medan',
            'birth_date' => '1985-07-15',
            'phone' => '081234567890',
            'city' => 'Batu Bara',
            'address' => 'Jl. Merdeka No. 12',
            'education_level' => 'S1',
            'education_major' => 'Pendidikan Informatika',
            'employment_status' => 'PNS',
            'join_date' => '2010-07-01',
        ], $overrides);
    }

    public function test_teacher_form_saves_profile_fields_and_update_keeps_untouched_ones(): void
    {
        $world = $this->createSchoolWorld();
        Sanctum::actingAs($world['admin']);

        $created = $this->postJson('/api/admin/teachers', $this->teacherPayload())->assertCreated();
        $this->assertSame('Medan', $created->json('data.birth_place'));
        $this->assertSame('1985-07-15', $created->json('data.birth_date'));

        $id = $created->json('data.id');
        $this->putJson("/api/admin/teachers/{$id}", [
            'name' => 'Yulia Rahmawati, S.Pd., M.Pd.',
            'nomor_induk' => '198507152010122009',
            'email' => 'yulia@sekolah.sch.id',
            'education_level' => 'S2',
        ])->assertOk();

        $teacher = User::findOrFail($id);
        $this->assertSame('S2', $teacher->education_level);
        $this->assertSame('Medan', $teacher->birth_place, 'field yang tidak dikirim tidak boleh terhapus');
    }

    public function test_profile_validation_rejects_future_birth_date_and_unknown_options(): void
    {
        $world = $this->createSchoolWorld();
        Sanctum::actingAs($world['admin']);

        $this->postJson('/api/admin/teachers', $this->teacherPayload([
            'birth_date' => now()->addYear()->toDateString(),
            'gender' => 'X',
            'education_level' => 'SD-LULUS-ENTAH',
            'phone' => 'abc',
        ]))->assertStatus(422)
            ->assertJsonValidationErrors(['birth_date', 'gender', 'education_level', 'phone']);
    }

    public function test_student_form_saves_parent_and_admission_fields(): void
    {
        $world = $this->createSchoolWorld();
        Sanctum::actingAs($world['admin']);

        $response = $this->postJson('/api/admin/students', [
            'name' => 'Dewi Lestari',
            'nomor_induk' => '20241055',
            'email' => 'dewi@sekolah.sch.id',
            'password' => 'rahasia123',
            'classroom_id' => $world['classroom']->id,
            'gender' => 'P',
            'birth_date' => '2009-03-02',
            'admission_year' => 2024,
            'previous_school' => 'SMP Negeri 2 Lima Puluh',
            'parent_name' => 'Siti Rahmawati',
            'parent_phone' => '081298765432',
            'parent_job' => 'Wiraswasta',
        ])->assertCreated();

        $student = User::findOrFail($response->json('data.id'));
        $this->assertSame(2024, $student->admission_year);
        $this->assertSame('Siti Rahmawati', $student->parent_name);
        $this->assertSame('2009-03-02', $student->birth_date->format('Y-m-d'));
        $this->assertNull($student->join_date, 'field guru tidak berlaku untuk siswa');
    }

    public function test_import_reads_gender_labels_and_several_date_formats(): void
    {
        $world = $this->createSchoolWorld();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Data Siswa');
        $header = ['Nama Lengkap *', 'NIS *', 'Email *', 'Kata Sandi *', 'Kode Kelas', 'Jenis Kelamin', 'Tempat Lahir', 'Tanggal Lahir', 'Tahun Masuk'];
        $rowA = ['Rafi Pratama', '70001', 'rafi@sekolah.sch.id', 'rahasia123', $world['classroom']->code, 'Laki-laki', 'Medan', '2009-01-20', '2024'];
        $rowB = ['Nadia Putri', '70002', 'nadia@sekolah.sch.id', 'rahasia123', '', 'P', 'Batu Bara', '05/06/2009', '2024'];
        foreach ([$header, $rowA, $rowB] as $r => $row) {
            foreach ($row as $c => $value) {
                $sheet->setCellValueExplicit(chr(65 + $c) . ($r + 1), (string) $value, DataType::TYPE_STRING);
            }
        }
        ob_start();
        (new Xlsx($spreadsheet))->save('php://output');
        $file = UploadedFile::fake()->createWithContent('profil.xlsx', ob_get_clean());

        Sanctum::actingAs($world['admin']);
        $this->post('/api/admin/students/import', ['file' => $file], ['Accept' => 'application/json'])
            ->assertCreated();

        $rafi = User::where('nomor_induk', '70001')->firstOrFail();
        $this->assertSame('L', $rafi->gender);
        $this->assertSame('2009-01-20', $rafi->birth_date->format('Y-m-d'));
        $this->assertSame($world['classroom']->id, $rafi->classroom_id);

        $nadia = User::where('nomor_induk', '70002')->firstOrFail();
        $this->assertSame('P', $nadia->gender);
        $this->assertSame('2009-06-05', $nadia->birth_date->format('Y-m-d'), 'dd/mm/yyyy dibaca sebagai hari/bulan/tahun');
    }

    public function test_import_flags_invalid_gender_and_date_before_saving(): void
    {
        $world = $this->createSchoolWorld();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Data Guru');
        $rows = [
            ['Nama Lengkap *', 'NIP *', 'Email *', 'Kata Sandi *', 'Jenis Kelamin', 'Tanggal Lahir'],
            ['Guru Salah', '199000000000000001', 'salah@sekolah.sch.id', 'rahasia123', 'Tidak Jelas', '31-02-1990'],
        ];
        foreach ($rows as $r => $row) {
            foreach ($row as $c => $value) {
                $sheet->setCellValueExplicit(chr(65 + $c) . ($r + 1), (string) $value, DataType::TYPE_STRING);
            }
        }
        ob_start();
        (new Xlsx($spreadsheet))->save('php://output');
        $file = UploadedFile::fake()->createWithContent('salah.xlsx', ob_get_clean());

        Sanctum::actingAs($world['admin']);
        $response = $this->post('/api/admin/teachers/import', ['file' => $file, 'dry_run' => 1], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.can_import', false);

        $messages = collect($response->json('data.errors'))->pluck('message')->implode(' | ');
        $this->assertStringContainsString('Laki-laki atau Perempuan', $messages);
        $this->assertStringContainsString('yyyy-mm-dd', $messages);
        $this->assertFalse(User::where('nomor_induk', '199000000000000001')->exists());
    }

    public function test_template_includes_profile_columns_and_dropdowns(): void
    {
        $world = $this->createSchoolWorld();
        Sanctum::actingAs($world['admin']);

        $response = $this->get('/api/admin/teachers/template')->assertOk();
        $path = tempnam(sys_get_temp_dir(), 'tpl') . '.xlsx';
        file_put_contents($path, $response->getContent());
        $sheet = IOFactory::load($path)->getSheetByName('Data Guru');

        $headers = collect(range('A', 'Z'))->map(fn ($c) => $sheet->getCell("{$c}1")->getValue())->filter()->values()->all();
        $this->assertContains('Jenis Kelamin', $headers);
        $this->assertContains('Tanggal Lahir', $headers);
        $this->assertContains('Pendidikan Terakhir', $headers);

        $genderColumn = array_search('Jenis Kelamin', $headers) + 1;
        $letter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($genderColumn);
        $this->assertStringContainsString('Laki-laki', $sheet->getCell("{$letter}2")->getDataValidation()->getFormula1());
    }
}
