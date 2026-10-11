<?php

namespace App\Support;

use App\Models\MaterialAccess;
use Illuminate\Database\Eloquent\Builder;

/**
 * Analitik gaya belajar siswa berdasarkan log akses bahan ajar (tabel material_accesses).
 * Dipakai oleh dashboard guru, admin sekolah, dan admin master dengan bentuk respons yang sama.
 */
class LearningAnalytics
{
    /** content_type bahan ajar => kunci metrik pada respons */
    private const TYPE_KEYS = [
        'document' => 'pdf',
        'audio' => 'audio',
        'video' => 'video',
    ];

    private const STYLE_LABELS = [
        'pdf' => 'Visual (Dokumen PDF)',
        'audio' => 'Auditori (Audio Suara Guru)',
        'video' => 'Audiovisual (Video Tutorial HD)',
    ];

    /**
     * @param  Builder  $students  query User (role murid) yang sudah difilter sesuai cakupan pemanggil
     */
    public static function build(Builder $students): array
    {
        $studentList = (clone $students)
            ->select(['id', 'name', 'nomor_induk', 'nim_nip', 'school_id', 'classroom_id'])
            ->with(['school:id,name', 'classroom:id,name'])
            ->orderBy('name')
            ->get();

        // Satu query agregat: jumlah akses per siswa per tipe konten
        $counts = MaterialAccess::query()
            ->whereIn('user_id', (clone $students)->select('users.id'))
            ->toBase()
            ->select('user_id', 'content_type')
            ->selectRaw('COUNT(*) as total')
            ->groupBy('user_id', 'content_type')
            ->get()
            ->groupBy('user_id');

        $totals = ['pdf' => 0, 'audio' => 0, 'video' => 0];

        $rows = $studentList->map(function ($student) use ($counts, &$totals) {
            $perType = ['pdf' => 0, 'audio' => 0, 'video' => 0];
            foreach ($counts->get($student->id, collect()) as $row) {
                $key = self::TYPE_KEYS[$row->content_type] ?? null;
                if ($key) {
                    $perType[$key] += (int) $row->total;
                }
            }

            foreach ($perType as $key => $value) {
                $totals[$key] += $value;
            }

            $total = array_sum($perType);

            return [
                'id' => $student->id,
                'name' => $student->name,
                'nis' => $student->nomor_induk ?? $student->nim_nip,
                'school_name' => $student->school?->name,
                'classroom_name' => $student->classroom?->name,
                'classroom_id' => $student->classroom_id,
                'pdf_access_count' => $perType['pdf'],
                'audio_access_count' => $perType['audio'],
                'video_access_count' => $perType['video'],
                'total_access' => $total,
                'dominant_style' => self::dominantStyle($perType),
                'learning_pace' => self::learningPace($total),
            ];
        })->values();

        $grandTotal = array_sum($totals);
        $percentage = fn (int $value) => $grandTotal > 0 ? round(($value / $grandTotal) * 100, 1) : 0;

        return [
            'summary' => [
                'total_students_analyzed' => $rows->count(),
                'pdf_percentage' => $percentage($totals['pdf']),
                'audio_percentage' => $percentage($totals['audio']),
                'video_percentage' => $percentage($totals['video']),
                'total_media_interactions' => $grandTotal,
            ],
            'students' => $rows,
        ];
    }

    /**
     * Gaya belajar dominan = tipe media dengan akses terbanyak.
     * Jika beberapa tipe sama-sama tertinggi, siswa dianggap multimodal.
     */
    private static function dominantStyle(array $perType): string
    {
        $max = max($perType);
        if ($max === 0) {
            return 'Belum Ada Aktivitas';
        }

        $leaders = array_keys(array_filter($perType, fn ($value) => $value === $max));

        return count($leaders) === 1
            ? self::STYLE_LABELS[$leaders[0]]
            : 'Kinestetik / Multimodal';
    }

    /**
     * Ritme belajar berdasarkan intensitas akses bahan ajar.
     */
    private static function learningPace(int $total): string
    {
        return match (true) {
            $total === 0 => '-',
            $total >= 20 => 'Cepat Mandiri',
            $total >= 8 => 'Aktif Stabil',
            default => 'Perlu Pendampingan',
        };
    }
}
