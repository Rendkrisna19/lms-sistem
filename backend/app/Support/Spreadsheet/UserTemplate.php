<?php

namespace App\Support\Spreadsheet;

use App\Models\Classroom;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Membangun template Excel untuk impor data guru atau siswa.
 */
final class UserTemplate
{
    /** Jumlah baris isian yang disiapkan (batas impor per berkas). */
    public const INPUT_ROWS = 500;

    private const TYPE_LABELS = [
        'text' => 'Teks',
        'identifier' => 'Teks (angka sebagai teks)',
        'date' => 'Tanggal (yyyy-mm-dd)',
        'select' => 'Pilih dari daftar',
        'classroom' => 'Pilih kode kelas',
        'number' => 'Angka (tahun)',
    ];

    /**
     * @param  Collection<int, Classroom>  $classrooms
     */
    public static function build(string $role, Collection $classrooms, string $schoolName): Spreadsheet
    {
        $layout = UserSheetLayout::for($role);
        $columns = $layout['columns'];
        $lastColumn = self::columnLetter(count($columns));
        $lastRow = self::INPUT_ROWS + 1;

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle($layout['sheet']);

        $classroomSheetRows = $classrooms->count();
        if ($classroomSheetRows > 0 || $role === UserSheetLayout::ROLE_STUDENT) {
            self::addClassroomSheet($spreadsheet, $classrooms);
        }

        foreach ($columns as $index => $column) {
            $letter = self::columnLetter($index + 1);
            $label = $column['header'] . (($column['required'] ?? false) ? ' *' : '');
            $sheet->setCellValue("{$letter}1", $label);
            $sheet->getColumnDimension($letter)->setWidth($column['width']);

            self::formatInputColumn($sheet, $letter, $column, $lastRow, $classroomSheetRows);
        }

        SheetStyle::header($sheet, "A1:{$lastColumn}1");
        SheetStyle::body($sheet, "A2:{$lastColumn}{$lastRow}");
        $sheet->getStyle("A2:{$lastColumn}{$lastRow}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

        $sheet->freezePane('B2');
        $sheet->setAutoFilter("A1:{$lastColumn}1");
        $sheet->getRowDimension(1)->setRowHeight(30);

        self::addInstructionSheet($spreadsheet, $role, $layout, $schoolName);
        $spreadsheet->setActiveSheetIndex(0);

        return $spreadsheet;
    }

    /** Format dan dropdown untuk satu kolom isian (baris 2 sampai batas). */
    private static function formatInputColumn(Worksheet $sheet, string $letter, array $column, int $lastRow, int $classroomCount): void
    {
        $range = "{$letter}2:{$letter}{$lastRow}";

        switch ($column['type']) {
            case 'identifier':
                $sheet->getStyle($range)->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_TEXT);
                break;
            case 'date':
                $sheet->getStyle($range)->getNumberFormat()->setFormatCode('yyyy-mm-dd');
                $sheet->getStyle($range)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                break;
            case 'number':
                $sheet->getStyle($range)->getNumberFormat()->setFormatCode('0');
                break;
            case 'text':
                $sheet->getStyle($range)->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_TEXT);
                break;
        }

        $list = null;
        if ($column['type'] === 'select') {
            $list = '"' . implode(',', $column['options']) . '"';
        } elseif ($column['type'] === 'classroom' && $classroomCount > 0) {
            $list = "'Daftar Kelas'!\$A\$2:\$A\$" . ($classroomCount + 1);
        }

        if ($list !== null) {
            for ($row = 2; $row <= $lastRow; $row++) {
                $validation = new DataValidation();
                $validation->setType(DataValidation::TYPE_LIST)
                    ->setAllowBlank(true)
                    ->setShowDropDown(true)
                    ->setShowErrorMessage(true)
                    ->setErrorTitle('Nilai tidak dikenal')
                    ->setError('Pilih nilai dari daftar yang tersedia.')
                    ->setFormula1($list);
                $sheet->getCell("{$letter}{$row}")->setDataValidation($validation);
            }
        }
    }

    private static function addClassroomSheet(Spreadsheet $spreadsheet, Collection $classrooms): void
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('Daftar Kelas');

        foreach (['Kode Kelas', 'Nama Kelas', 'Tahun Ajaran'] as $index => $label) {
            $sheet->setCellValue(self::columnLetter($index + 1) . '1', $label);
        }
        SheetStyle::header($sheet, 'A1:C1');

        $row = 2;
        foreach ($classrooms as $classroom) {
            $sheet->setCellValueExplicit("A{$row}", (string) $classroom->code, DataType::TYPE_STRING);
            $sheet->setCellValue("B{$row}", $classroom->name);
            $sheet->setCellValue("C{$row}", $classroom->academic_year ?? '');
            $row++;
        }
        if ($row > 2) {
            SheetStyle::body($sheet, 'A2:C' . ($row - 1));
        }

        $sheet->getColumnDimension('A')->setWidth(18);
        $sheet->getColumnDimension('B')->setWidth(28);
        $sheet->getColumnDimension('C')->setWidth(16);
        $sheet->freezePane('A2');
    }

    private static function addInstructionSheet(Spreadsheet $spreadsheet, string $role, array $layout, string $schoolName): void
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('Petunjuk');
        $sheet->getColumnDimension('A')->setWidth(4);
        $sheet->getColumnDimension('B')->setWidth(28);
        $sheet->getColumnDimension('C')->setWidth(10);
        $sheet->getColumnDimension('D')->setWidth(24);
        $sheet->getColumnDimension('E')->setWidth(52);
        $sheet->getColumnDimension('F')->setWidth(30);

        SheetStyle::title($sheet, 'B1', "Template impor data {$layout['label']}");
        SheetStyle::subtitle($sheet, 'B2', "Sekolah: {$schoolName}");

        $steps = [
            'Isi data mulai dari baris 2 pada sheet "' . $layout['sheet'] . '". Jangan mengubah judul kolom.',
            'Kolom yang bertanda * wajib diisi. Baris yang kosong dilewati.',
            "Kolom {$layout['identifier']} harus unik. Kolom bertipe teks sudah diformat agar angka tidak berubah.",
            'Tanggal diisi dengan format yyyy-mm-dd, misalnya 1985-07-15. Format dd/mm/yyyy juga diterima.',
            'Kolom dengan pilihan (dropdown) harus diisi sesuai daftar. Kosongkan jika tidak diketahui.',
            'Kata sandi minimal 8 karakter. Email harus unik dan belum terdaftar.',
            'Maksimal ' . self::INPUT_ROWS . ' baris per berkas. Simpan sebagai .xlsx sebelum mengunggah.',
        ];

        $row = 4;
        $sheet->setCellValue("B{$row}", 'Ketentuan pengisian');
        $sheet->getStyle("B{$row}")->getFont()->setBold(true)->setSize(12);
        foreach ($steps as $index => $step) {
            $row++;
            $sheet->setCellValue("A{$row}", $index + 1);
            $sheet->setCellValue("B{$row}", $step);
            $sheet->mergeCells("B{$row}:F{$row}");
            $sheet->getStyle("B{$row}")->getAlignment()->setWrapText(true);
            $sheet->getRowDimension($row)->setRowHeight(28);
        }

        $row += 2;
        $tableStart = $row;
        foreach (['Kolom', 'Wajib', 'Tipe isian', 'Keterangan', 'Contoh isi'] as $index => $label) {
            $sheet->setCellValue(self::columnLetter($index + 2) . $row, $label);
        }
        SheetStyle::header($sheet, "B{$row}:F{$row}");

        foreach ($layout['columns'] as $column) {
            $row++;
            $sheet->setCellValue("B{$row}", $column['header']);
            $sheet->setCellValue("C{$row}", ($column['required'] ?? false) ? 'Ya' : 'Tidak');
            $sheet->setCellValue("D{$row}", self::TYPE_LABELS[$column['type']] ?? 'Teks');
            $sheet->setCellValue("E{$row}", self::explain($column));
            $sheet->setCellValueExplicit("F{$row}", (string) ($column['example'] ?? ''), DataType::TYPE_STRING);
        }
        SheetStyle::body($sheet, 'B' . ($tableStart + 1) . ":F{$row}");
        SheetStyle::zebra($sheet, "B{$tableStart}:F{$row}", $tableStart + 1, $row, 'F');
        $sheet->getStyle('B' . ($tableStart + 1) . ":B{$row}")->getFont()->setBold(true);
        $sheet->getStyle("E" . ($tableStart + 1) . ":E{$row}")->getAlignment()->setWrapText(true);
    }

    /** Keterangan singkat untuk setiap kolom, termasuk daftar pilihan bila ada. */
    private static function explain(array $column): string
    {
        if (($column['type'] ?? '') === 'select') {
            return 'Pilihan: ' . implode(', ', $column['options']) . '.';
        }
        if (($column['type'] ?? '') === 'classroom') {
            return 'Kode kelas dari sheet "Daftar Kelas". Kosongkan jika belum ditempatkan.';
        }

        return match ($column['key']) {
            'name' => 'Nama lengkap sesuai dokumen resmi, termasuk gelar bila ada.',
            'nomor_induk' => 'Nomor identitas unik. Kolom ini diformat sebagai teks.',
            'email' => 'Alamat email aktif, unik per sistem.',
            'password' => 'Kata sandi awal untuk login, minimal 8 karakter.',
            'birth_date' => 'Tanggal lahir dengan format yyyy-mm-dd.',
            'join_date' => 'Tanggal mulai mengajar di sekolah ini.',
            'phone', 'parent_phone' => 'Nomor yang dapat dihubungi, boleh memakai +62.',
            'address' => 'Alamat lengkap tempat tinggal saat ini.',
            'admission_year' => 'Tahun masuk sekolah, misalnya 2024.',
            default => '',
        };
    }

    /** Huruf kolom Excel (1 => A, 27 => AA). */
    public static function columnLetter(int $index): string
    {
        return Coordinate::stringFromColumnIndex($index);
    }
}
