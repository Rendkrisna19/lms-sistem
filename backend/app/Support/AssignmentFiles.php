<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Berkas lampiran penugasan (dari guru) dan berkas jawaban siswa.
 * Disimpan di disk public dengan nama acak agar nama asli tidak dapat ditebak.
 */
class AssignmentFiles
{
    public const MAX_KB = 10240; // 10 MB

    /** Ekstensi yang diizinkan (HTML/SVG tidak pernah diterima). */
    public const EXTENSIONS = 'pdf,doc,docx,ppt,pptx,xls,xlsx,zip,jpg,jpeg,png';

    /** @return array{path: string, name: string} */
    public static function store(UploadedFile $file, string $directory): array
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $path = $file->storeAs($directory, Str::random(40) . '.' . $extension, 'public');

        return ['path' => $path, 'name' => $file->getClientOriginalName()];
    }

    public static function delete(?string $path): void
    {
        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }
}
