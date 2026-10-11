<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

/**
 * Aturan validasi & penyimpanan berkas media pembelajaran (dokumen, audio, video).
 * Validasi memakai MIME hasil deteksi isi berkas (bukan sekadar ekstensi) dan
 * berkas disimpan dengan nama acak + ekstensi aman. HTML/SVG tidak pernah diterima.
 */
class MediaUpload
{
    /** Per tipe: batas ukuran, ekstensi yang diizinkan, dan MIME terdeteksi => ekstensi aman */
    private const TYPES = [
        'document' => [
            'max_kb' => 20480, // 20 MB
            'extensions' => ['pdf', 'doc', 'docx', 'ppt', 'pptx'],
            'mimes' => [
                'application/pdf' => 'pdf',
                'application/x-pdf' => 'pdf',
                'application/msword' => 'doc',
                'application/vnd.ms-office' => null, // OLE generik (doc/ppt lama)
                'application/vnd.ms-powerpoint' => 'ppt',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation' => 'pptx',
            ],
            'label' => 'PDF, DOC, DOCX, PPT, atau PPTX (maks. 20 MB)',
        ],
        'audio' => [
            'max_kb' => 51200, // 50 MB
            'extensions' => ['mp3', 'm4a', 'aac', 'wav', 'ogg'],
            'mimes' => [
                'audio/mpeg' => 'mp3',
                'audio/mp3' => 'mp3',
                'audio/mp4' => 'm4a',
                'audio/x-m4a' => 'm4a',
                'audio/m4a' => 'm4a',
                'audio/aac' => 'aac',
                'audio/x-aac' => 'aac',
                'audio/x-hx-aac-adts' => 'aac',
                'audio/wav' => 'wav',
                'audio/x-wav' => 'wav',
                'audio/wave' => 'wav',
                'audio/vnd.wave' => 'wav',
                'audio/ogg' => 'ogg',
                'application/ogg' => 'ogg',
            ],
            'label' => 'MP3, M4A, AAC, WAV, atau OGG (maks. 50 MB)',
        ],
        'video' => [
            'max_kb' => 204800, // 200 MB
            'extensions' => ['mp4', 'webm'],
            'mimes' => [
                'video/mp4' => 'mp4',
                'video/webm' => 'webm',
            ],
            'label' => 'MP4 atau WEBM (maks. 200 MB)',
        ],
    ];

    private const FOLDERS = [
        'document' => 'documents',
        'audio' => 'audio',
        'video' => 'videos',
    ];

    public static function supports(?string $contentType): bool
    {
        return $contentType !== null && isset(self::TYPES[$contentType]);
    }

    /**
     * Aturan validasi untuk field berkas sesuai tipe konten.
     */
    public static function rules(string $contentType, string $presence = 'required'): array
    {
        $config = self::TYPES[$contentType];

        return [
            $presence,
            'file',
            'max:' . $config['max_kb'],
            'extensions:' . implode(',', $config['extensions']),
            'mimetypes:' . implode(',', array_keys($config['mimes'])),
        ];
    }

    public static function messages(string $field, string $contentType): array
    {
        $label = self::TYPES[$contentType]['label'];

        return [
            "{$field}.required" => 'Berkas wajib diunggah.',
            "{$field}.required_without" => 'Unggah berkas atau isi tautan URL materi.',
            "{$field}.file" => 'Berkas tidak valid.',
            "{$field}.max" => "Ukuran berkas melebihi batas. Format yang diizinkan: {$label}.",
            "{$field}.extensions" => "Format berkas tidak didukung. Gunakan {$label}.",
            "{$field}.mimetypes" => "Isi berkas tidak sesuai format yang diizinkan. Gunakan {$label}.",
        ];
    }

    /**
     * Simpan berkas (yang sudah lolos validasi) dengan nama acak dan ekstensi aman.
     *
     * @return array{path:string, original_name:string, size:int}
     */
    public static function store(UploadedFile $file, string $contentType, string $baseDirectory, string $disk = 'public'): array
    {
        $config = self::TYPES[$contentType];
        $clientExtension = strtolower($file->getClientOriginalExtension());

        $extension = $config['mimes'][$file->getMimeType()] ?? null;
        if (!$extension) {
            // MIME generik: pakai ekstensi klien yang sudah lolos whitelist
            $extension = in_array($clientExtension, $config['extensions'], true)
                ? $clientExtension
                : $config['extensions'][0];
        }

        $directory = trim($baseDirectory, '/') . '/' . self::FOLDERS[$contentType];
        $path = $file->storeAs($directory, Str::random(40) . '.' . $extension, $disk);

        $originalName = basename(str_replace('\\', '/', (string) $file->getClientOriginalName()));

        return [
            'path' => $path,
            'original_name' => mb_substr($originalName, 0, 250),
            'size' => (int) $file->getSize(),
        ];
    }
}
