<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassSubjectAssignment;
use App\Models\LearningMaterial;
use App\Models\MaterialAccess;
use App\Support\MediaUpload;
use App\Support\TeacherScope;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class TeacherMaterialController extends Controller
{
    /** Jeda minimum antar pencatatan akses materi yang sama oleh siswa yang sama */
    private const ACCESS_THROTTLE_MINUTES = 5;

    /**
     * Daftar bahan ajar yang diunggah oleh guru (lengkap dengan filter & statistik)
     */
    public function index(Request $request)
    {
        $teacher = $request->user();

        $assignments = $this->teacherAssignments($teacher->id);

        $query = LearningMaterial::where('teacher_id', $teacher->id)
            ->with(['classroom:id,name,code', 'course:id,title']);

        // Filter per Kelas
        if ($request->filled('classroom_id') && $request->classroom_id !== 'all') {
            $query->where('classroom_id', $request->classroom_id);
        }

        // Filter per Mapel
        if ($request->filled('course_id') && $request->course_id !== 'all') {
            $query->where('course_id', $request->course_id);
        }

        // Filter per Tipe Konten
        if ($request->filled('content_type') && $request->content_type !== 'all') {
            $query->where('content_type', $request->content_type);
        }

        // Filter per Status Aktif/Nonaktif
        if ($request->filled('status') && $request->status !== 'all') {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            } elseif ($request->status === 'expired') {
                $query->whereNotNull('expires_at')->where('expires_at', '<', now());
            }
        }

        // Pencarian Judul / Deskripsi
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $materials = $query->orderBy('id', 'desc')->get();

        // Statistik keseluruhan materi milik guru ini (satu query agregat)
        $summaryRow = LearningMaterial::where('teacher_id', $teacher->id)
            ->toBase()
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN content_type = 'document' THEN 1 ELSE 0 END) as total_document")
            ->selectRaw("SUM(CASE WHEN content_type = 'audio' THEN 1 ELSE 0 END) as total_audio")
            ->selectRaw("SUM(CASE WHEN content_type = 'video' THEN 1 ELSE 0 END) as total_video")
            ->selectRaw('SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as total_active')
            ->first();

        $total = (int) ($summaryRow->total ?? 0);
        $active = (int) ($summaryRow->total_active ?? 0);

        return response()->json([
            'status' => 'success',
            'data' => [
                'teacher' => [
                    'id' => $teacher->id,
                    'name' => $teacher->name,
                    'nip' => $teacher->nomor_induk ?? $teacher->nim_nip,
                ],
                'summary' => [
                    'total' => $total,
                    'total_document' => (int) ($summaryRow->total_document ?? 0),
                    'total_audio' => (int) ($summaryRow->total_audio ?? 0),
                    'total_video' => (int) ($summaryRow->total_video ?? 0),
                    'total_active' => $active,
                    'total_inactive' => $total - $active,
                ],
                'materials' => $materials,
                'assigned_options' => $assignments->map(fn ($a) => [
                    'assignment_id' => $a->id,
                    'classroom_id' => $a->classroom_id,
                    'classroom_name' => $a->classroom?->name,
                    'classroom_code' => $a->classroom?->code,
                    'course_id' => $a->course_id,
                    'course_title' => $a->course?->title,
                    'schedule' => trim(implode(', ', array_filter([$a->schedule_day, $a->schedule_time]))) ?: null,
                    'room' => $a->room,
                ]),
            ],
        ]);
    }

    /**
     * Mengambil opsi plotting rombel & mapel yang ditugaskan khusus untuk guru ini
     */
    public function getOptions(Request $request)
    {
        $assignments = $this->teacherAssignments($request->user()->id);

        return response()->json([
            'status' => 'success',
            'data' => $assignments->map(fn ($a) => [
                'classroom_id' => $a->classroom_id,
                'classroom_name' => $a->classroom?->name,
                'classroom_code' => $a->classroom?->code,
                'course_id' => $a->course_id,
                'course_title' => $a->course?->title,
                'label' => "{$a->classroom?->name} ({$a->classroom?->code}) - {$a->course?->title}",
            ]),
        ]);
    }

    /**
     * Upload & Simpan Bahan Ajar Baru
     */
    public function store(Request $request)
    {
        $teacher = $request->user();

        $validated = $request->validate([
            'classroom_id' => 'required|integer',
            'course_id' => 'required|integer',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'content_type' => 'required|in:document,audio,video',
            'video_source_type' => 'nullable|required_if:content_type,video|in:upload,youtube,google_drive',
            'is_active' => 'nullable',
            'expires_at' => 'nullable|date',
            'external_url' => 'nullable|url:http,https|max:500',
        ], [
            'video_source_type.required_if' => 'Pilih sumber video: Upload Video Asli, Link YouTube, atau Link Google Drive.',
            'external_url.url' => 'Tautan URL tidak valid (harus diawali http:// atau https://).',
        ]);

        // Guru hanya boleh mengunggah ke kelas + mapel yang diplotkan kepadanya
        if (!TeacherScope::for($teacher)->hasAssignment($validated['classroom_id'], $validated['course_id'])) {
            throw ValidationException::withMessages([
                'classroom_id' => ['Anda tidak ditugaskan mengajar mata pelajaran ini di kelas tersebut.'],
            ]);
        }

        $contentType = $validated['content_type'];
        $videoSourceType = $contentType === 'video' ? $validated['video_source_type'] : null;
        $externalUrl = $validated['external_url'] ?? null;

        // Tentukan apakah berkas wajib / opsional, lalu validasi berdasarkan MIME sebenarnya
        $needsFile = match ($contentType) {
            'video' => $videoSourceType === 'upload',
            default => true,
        };

        if ($contentType === 'video' && $videoSourceType !== 'upload') {
            if (empty($externalUrl)) {
                throw ValidationException::withMessages([
                    'external_url' => ['Tautan URL ' . ($videoSourceType === 'youtube' ? 'YouTube' : 'Google Drive') . ' wajib diisi.'],
                ]);
            }
        } elseif ($needsFile) {
            // Dokumen & audio boleh berupa tautan eksternal sebagai pengganti berkas
            $presence = $contentType === 'video' ? 'required' : 'required_without:external_url';
            $request->validate(
                ['file' => MediaUpload::rules($contentType, $presence)],
                MediaUpload::messages('file', $contentType)
            );
        }

        $stored = null;
        if ($needsFile && $request->hasFile('file')) {
            $stored = MediaUpload::store($request->file('file'), $contentType, 'materials');
            if ($contentType === 'video') {
                $externalUrl = null;
            }
        }

        $expiresAt = !empty($validated['expires_at']) ? Carbon::parse($validated['expires_at']) : null;

        $material = LearningMaterial::create([
            'school_id' => $teacher->school_id,
            'teacher_id' => $teacher->id,
            'classroom_id' => $validated['classroom_id'],
            'course_id' => $validated['course_id'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'content_type' => $contentType,
            'video_source_type' => $videoSourceType,
            'file_path' => $stored['path'] ?? null,
            'file_name_original' => $stored['original_name'] ?? null,
            'file_size_bytes' => $stored['size'] ?? null,
            'external_url' => $externalUrl,
            'is_active' => $request->boolean('is_active', true),
            'expires_at' => $expiresAt,
        ]);

        $material->load(['classroom:id,name,code', 'course:id,title']);

        return response()->json([
            'status' => 'success',
            'message' => "Bahan ajar \"{$material->title}\" berhasil diunggah untuk kelas {$material->classroom?->name}.",
            'data' => $material,
        ], 201);
    }

    /**
     * Toggle status aktif / nonaktif bahan ajar
     */
    public function toggleStatus(Request $request, $id)
    {
        $material = $this->ownMaterial($request, $id);

        $material->is_active = !$material->is_active;
        $material->save();
        $material->load(['classroom:id,name,code', 'course:id,title']);

        $statusText = $material->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return response()->json([
            'status' => 'success',
            'message' => "Bahan ajar \"{$material->title}\" berhasil {$statusText}.",
            'data' => $material,
        ]);
    }

    /**
     * Hapus Bahan Ajar
     */
    public function destroy(Request $request, $id)
    {
        $material = $this->ownMaterial($request, $id);

        if ($material->file_path && Storage::disk('public')->exists($material->file_path)) {
            Storage::disk('public')->delete($material->file_path);
        }

        $materialTitle = $material->title;
        $material->delete();

        return response()->json([
            'status' => 'success',
            'message' => "Bahan ajar \"{$materialTitle}\" berhasil dihapus.",
        ]);
    }

    /**
     * Endpoint untuk Siswa di Ruang Belajar:
     * Menampilkan bahan ajar khusus kelas siswa yang masih aktif dan belum kadaluarsa.
     */
    public function studentMaterials(Request $request)
    {
        $student = $request->user()->load('classroom:id,name,code');

        if (!$student->classroom) {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'classroom' => null,
                    'materials' => [],
                ],
            ]);
        }

        $query = LearningMaterial::where('classroom_id', $student->classroom_id)
            ->available()
            ->with(['course:id,title', 'teacher:id,name']);

        if ($request->filled('content_type') && $request->content_type !== 'all') {
            $query->where('content_type', $request->content_type);
        }

        if ($request->filled('course_id') && $request->course_id !== 'all') {
            $query->where('course_id', $request->course_id);
        }

        $materials = $query->orderBy('id', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'classroom' => [
                    'id' => $student->classroom->id,
                    'name' => $student->classroom->name,
                    'code' => $student->classroom->code,
                ],
                'materials' => $materials,
            ],
        ]);
    }

    /**
     * Catat akses siswa terhadap bahan ajar (dasar analitik gaya belajar).
     * Akses berulang pada materi yang sama dalam 5 menit tidak dicatat ulang.
     */
    public function recordAccess(Request $request, $id)
    {
        $student = $request->user();

        $material = LearningMaterial::whereKey($id)
            ->whereNotNull('classroom_id')
            ->where('classroom_id', $student->classroom_id)
            ->available()
            ->firstOrFail();

        $recentlyLogged = MaterialAccess::where('user_id', $student->id)
            ->where('learning_material_id', $material->id)
            ->where('accessed_at', '>=', now()->subMinutes(self::ACCESS_THROTTLE_MINUTES))
            ->exists();

        if (!$recentlyLogged) {
            MaterialAccess::create([
                'user_id' => $student->id,
                'learning_material_id' => $material->id,
                'content_type' => $material->content_type,
                'accessed_at' => now(),
            ]);
        }

        return response()->json(['status' => 'success']);
    }

    private function teacherAssignments(int $teacherId)
    {
        return ClassSubjectAssignment::where('teacher_id', $teacherId)
            ->with(['classroom:id,name,code', 'course:id,title'])
            ->get();
    }

    /**
     * Bahan ajar milik guru yang sedang login; selain itu 404.
     */
    private function ownMaterial(Request $request, $id): LearningMaterial
    {
        return LearningMaterial::where('teacher_id', $request->user()->id)->findOrFail($id);
    }
}
