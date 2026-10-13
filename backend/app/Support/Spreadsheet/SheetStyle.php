<?php

namespace App\Support\Spreadsheet;

use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Gaya seragam untuk seluruh berkas Excel dari sistem (header biru, garis tipis, baris rapi).
 */
final class SheetStyle
{
    public const BRAND_BLUE = '2563EB';
    public const BORDER_GREY = 'CBD5E1';
    public const ZEBRA_GREY = 'F8FAFC';
    public const TEXT_DARK = '0F172A';
    public const TEXT_MUTED = '64748B';

    /** Header tabel: biru dengan huruf putih tebal. */
    public static function header(Worksheet $sheet, string $range): void
    {
        $sheet->getStyle($range)->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::BRAND_BLUE]],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'horizontal' => Alignment::HORIZONTAL_LEFT, 'wrapText' => true],
            'borders' => self::borders(),
        ]);
        $sheet->getRowDimension((int) preg_replace('/\D/', '', explode(':', $range)[0]))->setRowHeight(26);
    }

    /** Isi tabel: garis tipis, teks rata tengah secara vertikal. */
    public static function body(Worksheet $sheet, string $range): void
    {
        $sheet->getStyle($range)->applyFromArray([
            'font' => ['size' => 10.5, 'color' => ['rgb' => self::TEXT_DARK]],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
            'borders' => self::borders(),
        ]);
    }

    /** Judul dokumen di baris teratas. */
    public static function title(Worksheet $sheet, string $cell, string $text): void
    {
        $sheet->setCellValue($cell, $text);
        $sheet->getStyle($cell)->applyFromArray([
            'font' => ['bold' => true, 'size' => 15, 'color' => ['rgb' => self::TEXT_DARK]],
        ]);
    }

    public static function subtitle(Worksheet $sheet, string $cell, string $text): void
    {
        $sheet->setCellValue($cell, $text);
        $sheet->getStyle($cell)->applyFromArray([
            'font' => ['size' => 10, 'italic' => true, 'color' => ['rgb' => self::TEXT_MUTED]],
        ]);
    }

    /** Baris berselang-seling untuk memudahkan membaca. */
    public static function zebra(Worksheet $sheet, string $range, int $firstRow, int $lastRow, string $lastColumn): void
    {
        $firstColumn = preg_replace('/\d+/', '', explode(':', $range)[0]);
        for ($row = $firstRow + 1; $row <= $lastRow; $row += 2) {
            $sheet->getStyle("{$firstColumn}{$row}:{$lastColumn}{$row}")->getFill()
                ->setFillType(Fill::FILL_SOLID)
                ->getStartColor()->setRGB(self::ZEBRA_GREY);
        }
    }

    public static function borders(): array
    {
        return [
            'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => self::BORDER_GREY]],
        ];
    }
}
