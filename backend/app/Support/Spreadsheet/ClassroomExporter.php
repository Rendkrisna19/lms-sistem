<?php

namespace App\Support\Spreadsheet;

use App\Models\Classroom;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

/**
 * Ekspor daftar kelas (rombel) ke Excel dan PDF dengan gaya yang sama dengan ekspor lainnya.
 */
final class ClassroomExporter
{
    private const HEADER_ROW = 4;

    /** @return list<string> */
    public static function headers(): array
    {
        return ['Nama Kelas', 'Kode', 'Sekolah', 'Tahun Ajaran', 'Wali Kelas', 'Jumlah Siswa', 'Mata Pelajaran', 'Guru Pengampu'];
    }

    /** @return list<string> */
    public static function rowFor(Classroom $classroom): array
    {
        $assignments = $classroom->subjectAssignments;

        return [
            $classroom->name,
            $classroom->code,
            $classroom->school?->name ?? '-',
            $classroom->academic_year ?? '-',
            $classroom->homeroomTeacher?->name ?? '-',
            (string) ($classroom->students_count ?? 0),
            $assignments->map(fn ($a) => $a->course?->title)->filter()->implode(', ') ?: '-',
            $assignments->map(fn ($a) => $a->teacher?->name)->filter()->unique()->implode(', ') ?: '-',
        ];
    }

    /** @param  Collection<int, Classroom>  $classrooms */
    public static function toXlsx(Collection $classrooms): string
    {
        $headers = self::headers();
        $lastColumn = UserTemplate::columnLetter(count($headers) + 1);
        $lastRow = self::HEADER_ROW + $classrooms->count();
        $widths = [22, 14, 28, 16, 28, 14, 46, 46];

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Data Kelas');

        SheetStyle::title($sheet, 'A1', 'Daftar Kelas');
        SheetStyle::subtitle($sheet, 'A2', sprintf('Platform Cendekia · %d kelas · dicetak %s', $classrooms->count(), now('Asia/Jakarta')->translatedFormat('d F Y, H:i')));

        $sheet->setCellValue('A' . self::HEADER_ROW, 'No');
        $sheet->getColumnDimension('A')->setWidth(6);
        foreach ($headers as $index => $label) {
            $letter = UserTemplate::columnLetter($index + 2);
            $sheet->setCellValue($letter . self::HEADER_ROW, $label);
            $sheet->getColumnDimension($letter)->setWidth($widths[$index]);
        }
        SheetStyle::header($sheet, 'A' . self::HEADER_ROW . ":{$lastColumn}" . self::HEADER_ROW);

        $row = self::HEADER_ROW + 1;
        foreach ($classrooms->values() as $number => $classroom) {
            $sheet->setCellValue("A{$row}", $number + 1);
            foreach (self::rowFor($classroom) as $index => $value) {
                $sheet->setCellValueExplicit(UserTemplate::columnLetter($index + 2) . $row, $value, DataType::TYPE_STRING);
            }
            $row++;
        }

        if ($classrooms->isNotEmpty()) {
            SheetStyle::body($sheet, 'A' . (self::HEADER_ROW + 1) . ":{$lastColumn}{$lastRow}");
            SheetStyle::zebra($sheet, 'A' . self::HEADER_ROW . ":{$lastColumn}{$lastRow}", self::HEADER_ROW + 1, $lastRow, $lastColumn);
            $sheet->getStyle('A' . (self::HEADER_ROW + 1) . ":A{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }

        $sheet->freezePane('B' . (self::HEADER_ROW + 1));
        $sheet->setAutoFilter('A' . self::HEADER_ROW . ":{$lastColumn}" . max($lastRow, self::HEADER_ROW));
        $sheet->getPageSetup()->setOrientation(PageSetup::ORIENTATION_LANDSCAPE);
        $sheet->getPageSetup()->setFitToWidth(1);
        $sheet->getPageSetup()->setFitToHeight(0);

        ob_start();
        (new Xlsx($spreadsheet))->save('php://output');

        return (string) ob_get_clean();
    }

    /** @param  Collection<int, Classroom>  $classrooms */
    public static function toPdf(Collection $classrooms): string
    {
        $rows = $classrooms->values()->map(fn (Classroom $classroom, int $index) => [
            'no' => $index + 1,
            'cells' => array_slice(self::rowFor($classroom), 0, 6),
        ]);

        $html = view('exports.users', [
            'title' => 'Daftar Kelas',
            'schoolName' => 'Platform Cendekia',
            'printedAt' => now('Asia/Jakarta')->translatedFormat('d F Y, H:i') . ' WIB',
            'headers' => array_slice(self::headers(), 0, 6),
            'rows' => $rows,
            'total' => $classrooms->count(),
        ])->render();

        $options = new Options();
        $options->set('isRemoteEnabled', false);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        return $dompdf->output();
    }
}
