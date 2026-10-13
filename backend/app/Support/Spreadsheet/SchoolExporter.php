<?php

namespace App\Support\Spreadsheet;

use App\Models\School;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

/**
 * Ekspor daftar sekolah (admin master) ke Excel dan PDF dengan gaya yang sama dengan ekspor guru dan siswa.
 */
final class SchoolExporter
{
    private const HEADER_ROW = 4;

    /** @return list<string> */
    public static function headers(): array
    {
        return ['Nama Sekolah', 'NPSN', 'Jenjang', 'Status', 'Alamat', 'Telepon', 'Email', 'Admin Sekolah', 'Guru', 'Siswa', 'Kelas', 'Mata Pelajaran'];
    }

    /** @return list<string> */
    public static function rowFor(School $school): array
    {
        return [
            $school->name,
            $school->npsn ?? '-',
            $school->jenjang ?? '-',
            $school->status === 'active' ? 'Aktif' : 'Nonaktif',
            $school->address ?? '-',
            $school->phone ?? '-',
            $school->email ?? '-',
            $school->admin?->name ?? '-',
            (string) ($school->teachers_count ?? 0),
            (string) ($school->students_count ?? 0),
            (string) ($school->classrooms_count ?? 0),
            (string) ($school->courses_count ?? 0),
        ];
    }

    /** @param  Collection<int, School>  $schools */
    public static function toXlsx(Collection $schools): string
    {
        $headers = self::headers();
        $lastColumn = UserTemplate::columnLetter(count($headers) + 1);
        $lastRow = self::HEADER_ROW + $schools->count();
        $widths = [30, 14, 10, 12, 44, 16, 28, 26, 10, 10, 10, 16];

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Data Sekolah');

        SheetStyle::title($sheet, 'A1', 'Daftar Sekolah');
        SheetStyle::subtitle($sheet, 'A2', sprintf('Platform Cendekia · %d sekolah · dicetak %s', $schools->count(), now('Asia/Jakarta')->translatedFormat('d F Y, H:i')));

        $sheet->setCellValue('A' . self::HEADER_ROW, 'No');
        $sheet->getColumnDimension('A')->setWidth(6);
        foreach ($headers as $index => $label) {
            $letter = UserTemplate::columnLetter($index + 2);
            $sheet->setCellValue($letter . self::HEADER_ROW, $label);
            $sheet->getColumnDimension($letter)->setWidth($widths[$index]);
        }
        SheetStyle::header($sheet, 'A' . self::HEADER_ROW . ":{$lastColumn}" . self::HEADER_ROW);

        $row = self::HEADER_ROW + 1;
        foreach ($schools->values() as $number => $school) {
            $sheet->setCellValue("A{$row}", $number + 1);
            foreach (self::rowFor($school) as $index => $value) {
                $sheet->setCellValueExplicit(UserTemplate::columnLetter($index + 2) . $row, $value, DataType::TYPE_STRING);
            }
            $row++;
        }

        if ($schools->isNotEmpty()) {
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

    /** @param  Collection<int, School>  $schools */
    public static function toPdf(Collection $schools): string
    {
        $rows = $schools->values()->map(fn (School $school, int $index) => [
            'no' => $index + 1,
            'cells' => array_slice(self::rowFor($school), 0, 9),
        ]);

        $html = view('exports.users', [
            'title' => 'Daftar Sekolah',
            'schoolName' => 'Platform Cendekia',
            'printedAt' => now('Asia/Jakarta')->translatedFormat('d F Y, H:i') . ' WIB',
            'headers' => array_slice(self::headers(), 0, 9),
            'rows' => $rows,
            'total' => $schools->count(),
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
