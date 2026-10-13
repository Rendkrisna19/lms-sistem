<?php

namespace App\Support\Spreadsheet;

use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

/**
 * Ekspor daftar guru atau siswa ke Excel (.xlsx) dan PDF, dengan tampilan yang sama.
 */
final class UserExporter
{
    private const HEADER_ROW = 4;

    /** Kolom ringkas untuk PDF (versi Excel memuat semua kolom). */
    private const PDF_KEYS = [
        'guru' => ['nomor_induk', 'name', 'email', 'gender', 'phone', 'city', 'education_level', 'education_major', 'employment_status'],
        'murid' => ['nomor_induk', 'name', 'classroom_code', 'gender', 'birth_date', 'phone', 'city', 'parent_name', 'parent_phone'],
    ];

    /**
     * @param  Collection<int, \App\Models\User>  $users
     */
    public static function toXlsx(Collection $users, string $role, string $schoolName): string
    {
        $columns = UserSheetLayout::exportColumns($role);
        $layout = UserSheetLayout::for($role);
        $lastColumn = UserTemplate::columnLetter(count($columns) + 1);
        $lastRow = self::HEADER_ROW + $users->count();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle($layout['sheet']);

        SheetStyle::title($sheet, 'A1', "Daftar {$layout['label']}");
        SheetStyle::subtitle($sheet, 'A2', sprintf('%s · %d data · dicetak %s', $schoolName, $users->count(), now('Asia/Jakarta')->translatedFormat('d F Y, H:i')));

        $sheet->setCellValue('A' . self::HEADER_ROW, 'No');
        $sheet->getColumnDimension('A')->setWidth(6);
        foreach ($columns as $index => $column) {
            $letter = UserTemplate::columnLetter($index + 2);
            $sheet->setCellValue($letter . self::HEADER_ROW, $column['header']);
            $sheet->getColumnDimension($letter)->setWidth($column['width']);
        }
        SheetStyle::header($sheet, "A" . self::HEADER_ROW . ":{$lastColumn}" . self::HEADER_ROW);

        $row = self::HEADER_ROW + 1;
        foreach ($users->values() as $number => $user) {
            $values = UserSheetLayout::valuesFor($user, $role);
            $sheet->setCellValue("A{$row}", $number + 1);
            foreach ($columns as $index => $column) {
                $letter = UserTemplate::columnLetter($index + 2);
                $sheet->setCellValueExplicit("{$letter}{$row}", (string) ($values[$column['key']] ?? '-'), \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
            }
            $row++;
        }

        if ($users->isNotEmpty()) {
            SheetStyle::body($sheet, "A" . (self::HEADER_ROW + 1) . ":{$lastColumn}{$lastRow}");
            SheetStyle::zebra($sheet, "A" . self::HEADER_ROW . ":{$lastColumn}{$lastRow}", self::HEADER_ROW + 1, $lastRow, $lastColumn);
            $sheet->getStyle("A" . (self::HEADER_ROW + 1) . ":A{$lastRow}")->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
        }

        $sheet->freezePane('A' . (self::HEADER_ROW + 1));
        $sheet->setAutoFilter("A" . self::HEADER_ROW . ":{$lastColumn}" . max($lastRow, self::HEADER_ROW));
        $sheet->getPageSetup()->setOrientation(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_LANDSCAPE);
        $sheet->getPageSetup()->setFitToWidth(1);
        $sheet->getPageSetup()->setFitToHeight(0);
        $sheet->getPageSetup()->setRowsToRepeatAtTopByStartAndEnd(self::HEADER_ROW, self::HEADER_ROW);

        ob_start();
        (new Xlsx($spreadsheet))->save('php://output');

        return (string) ob_get_clean();
    }

    /**
     * @param  Collection<int, \App\Models\User>  $users
     */
    public static function toPdf(Collection $users, string $role, string $schoolName): string
    {
        $layout = UserSheetLayout::for($role);
        $keys = self::PDF_KEYS[$role] ?? [];
        $columns = array_values(array_filter(
            UserSheetLayout::exportColumns($role),
            fn (array $column) => in_array($column['key'], $keys, true)
        ));

        $rows = $users->values()->map(function ($user, $index) use ($role, $columns) {
            $values = UserSheetLayout::valuesFor($user, $role);

            return [
                'no' => $index + 1,
                'cells' => array_map(fn (array $column) => (string) ($values[$column['key']] ?? '-'), $columns),
            ];
        });

        $html = view('exports.users', [
            'title' => "Daftar {$layout['label']}",
            'schoolName' => $schoolName,
            'printedAt' => now('Asia/Jakarta')->translatedFormat('d F Y, H:i') . ' WIB',
            'headers' => array_map(fn (array $column) => $column['header'], $columns),
            'rows' => $rows,
            'total' => $users->count(),
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
