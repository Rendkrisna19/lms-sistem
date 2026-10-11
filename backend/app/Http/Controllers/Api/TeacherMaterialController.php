<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LearningMaterial;
use App\Models\ClassSubjectAssignment;
use App\Models\Classroom;
use App\Models\Course;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class TeacherMaterialController extends Controller
{
    /**
     * Resolves active teacher from X-Teacher-Id header, query param, or auth user.
     */
    private function resolveTeacher(Request $request): ?User
    {
        $teacher = null;
        if ($request->hasHeader('X-Teacher-Id')) {
            $teacher = User::find($request->header('X-Teacher-Id'));
        }
        if (!$teacher && $request->has('teacher_id')) {
            $teacher = User::find($request->input('teacher_id'));
        }
        if (!$teacher && $request->user()) {
            $teacher = $request->user();
        }
        if (!$teacher || $teacher->role !== 'guru') {
            $teacher = User::where('role', 'guru')->first();
        }
        return $teacher;
    }

    /**
     * Daftar bahan ajar yang diunggah oleh guru (lengkap dengan filter & statistik)
     */
    public function index(Request $request)
    {
        $teacher = $this->resolveTeacher($request);
        if (!$teacher) {
            return response()->json(['status' => 'error', 'message' => 'Guru tidak ditemukan.'], 404);
        }

        // Ambil plotting mapel guru ini
        $assignments = ClassSubjectAssignment::where('teacher_id', $teacher->id)
            ->with(['classroom:id,name,code', 'course:id,title'])
            ->get();

        $assignedClassroomIds = $assignments->pluck('classroom_id')->unique()->values();
        $assignedCourseIds = $assignments->pluck('course_id')->unique()->values();

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

        // Hitung statistik keseluruhan materi milik guru ini
        $allTeacherMaterials = LearningMaterial::where('teacher_id', $teacher->id)->get();
        $summary = [
            'total' => $allTeacherMaterials->count(),
            'total_document' => $allTeacherMaterials->where('content_type', 'document')->count(),
            'total_audio' => $allTeacherMaterials->where('content_type', 'audio')->count(),
            'total_video' => $allTeacherMaterials->where('content_type', 'video')->count(),
            'total_active' => $allTeacherMaterials->where('is_active', true)->count(),
            'total_inactive' => $allTeacherMaterials->where('is_active', false)->count(),
        ];

        return response()->json([
            'status' => 'success',
            'data' => [
                'teacher' => [
                    'id' => $teacher->id,
                    'name' => $teacher->name,
                    'nip' => $teacher->nomor_induk ?? $teacher->nim_nip,
                ],
                'summary' => $summary,
                'materials' => $materials,
                'assigned_options' => $assignments->map(fn($a) => [
                    'assignment_id' => $a->id,
                    'classroom_id' => $a->classroom_id,
                    'classroom_name' => $a->classroom?->name,
                    'classroom_code' => $a->classroom?->code,
                    'course_id' => $a->course_id,
                    'course_title' => $a->course?->title,
                    'schedule' => "{$a->schedule_day}, {$a->schedule_time}",
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
        $teacher = $this->resolveTeacher($request);
        if (!$teacher) {
            return response()->json(['status' => 'error', 'message' => 'Guru tidak ditemukan.'], 404);
        }

        $assignments = ClassSubjectAssignment::where('teacher_id', $teacher->id)
            ->with(['classroom:id,name,code', 'course:id,title'])
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $assignments->map(fn($a) => [
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
        $teacher = $this->resolveTeacher($request);
        if (!$teacher) {
            return response()->json(['status' => 'error', 'message' => 'Guru tidak terverifikasi.'], 403);
        }

        $validated = $request->validate([
            'classroom_id' => 'required|exists:classrooms,id',
            'course_id' => 'required|exists:courses,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'content_type' => 'required|in:document,audio,video',
            'video_source_type' => 'nullable|in:upload,youtube,google_drive',
            'is_active' => 'nullable',
            'expires_at' => 'nullable|date',
            'external_url' => 'nullable|url',
        ]);

        $contentType = $validated['content_type'];
        $filePath = null;
        $fileNameOriginal = null;
        $fileSizeBytes = null;
        $externalUrl = $validated['external_url'] ?? null;
        $videoSourceType = $validated['video_source_type'] ?? null;

        // 1. Validasi Spesifik Dokumen PDF (Maksimal 20 MB)
        if ($contentType === 'document') {
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $ext = strtolower($file->getClientOriginalExtension());
                if ($ext !== 'pdf') {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Format file dokumen wajib berupa berkas PDF (.pdf).'
                    ], 422);
                }

                // Cek ukuran max 20MB (20971520 bytes)
                if ($file->getSize() > 20971520) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Ukuran berkas PDF melebihi batas maksimal 20 MB.'
                    ], 422);
                }

                $fileNameOriginal = $file->getClientOriginalName();
                $fileSizeBytes = $file->getSize();
                $filePath = $file->store('materials/documents', 'public');
            } elseif (empty($externalUrl)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Berkas PDF wajib diunggah.'
                ], 422);
            }
        }

        // 2. Validasi Spesifik Audio Suara / Podcast (Maksimal 20 MB)
        if ($contentType === 'audio') {
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $ext = strtolower($file->getClientOriginalExtension());
                $allowedAudioExt = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'wma'];
                if (!in_array($ext, $allowedAudioExt)) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Format file audio wajib berupa MP3, WAV, M4A, atau OGG.'
                    ], 422);
                }

                // Cek ukuran max 20MB (20971520 bytes)
                if ($file->getSize() > 20971520) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Ukuran berkas Audio melebihi batas maksimal 20 MB.'
                    ], 422);
                }

                $fileNameOriginal = $file->getClientOriginalName();
                $fileSizeBytes = $file->getSize();
                $filePath = $file->store('materials/audio', 'public');
            } elseif (empty($externalUrl)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Berkas rekaman audio wajib diunggah.'
                ], 422);
            }
        }

        // 3. Validasi Spesifik Video (Upload Video Asli, Link YouTube, Link Google Drive)
        if ($contentType === 'video') {
            if ($videoSourceType === 'upload') {
                if (!$request->hasFile('file')) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Berkas video asli wajib diunggah ketika memilih opsi Upload Video Asli.'
                    ], 422);
                }
                $file = $request->file('file');
                $ext = strtolower($file->getClientOriginalExtension());
                $allowedVideoExt = ['mp4', 'webm', 'mov', 'mkv', 'avi'];
                if (!in_array($ext, $allowedVideoExt)) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Format video wajib berupa MP4, WEBM, atau MOV.'
                    ], 422);
                }

                $fileNameOriginal = $file->getClientOriginalName();
                $fileSizeBytes = $file->getSize();
                $filePath = $file->store('materials/videos', 'public');
            } elseif ($videoSourceType === 'youtube' || $videoSourceType === 'google_drive') {
                if (empty($externalUrl)) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Tautan URL ' . ($videoSourceType === 'youtube' ? 'YouTube' : 'Google Drive') . ' wajib diisi.'
                    ], 422);
                }
            } else {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Pilih sumber video: Upload Video Asli, Link YouTube, atau Link Google Drive.'
                ], 422);
            }
        }

        $isActive = filter_var($request->input('is_active', true), FILTER_VALIDATE_BOOLEAN);
        $expiresAt = !empty($request->input('expires_at')) ? Carbon::parse($request->input('expires_at')) : null;

        $material = LearningMaterial::create([
            'school_id' => $teacher->school_id ?? 1,
            'teacher_id' => $teacher->id,
            'classroom_id' => $validated['classroom_id'],
            'course_id' => $validated['course_id'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'content_type' => $contentType,
            'video_source_type' => $videoSourceType,
            'file_path' => $filePath,
            'file_name_original' => $fileNameOriginal,
            'file_size_bytes' => $fileSizeBytes,
            'external_url' => $externalUrl,
            'is_active' => $isActive,
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
        $teacher = $this->resolveTeacher($request);
        $material = LearningMaterial::findOrFail($id);

        if ($teacher && $material->teacher_id !== $teacher->id && $teacher->role === 'guru') {
            return response()->json(['status' => 'error', 'message' => 'Anda tidak memiliki hak akses bahan ajar ini.'], 403);
        }

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
        $teacher = $this->resolveTeacher($request);
        $material = LearningMaterial::findOrFail($id);

        if ($teacher && $material->teacher_id !== $teacher->id && $teacher->role === 'guru') {
            return response()->json(['status' => 'error', 'message' => 'Anda tidak memiliki hak akses untuk menghapus bahan ajar ini.'], 403);
        }

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
        $student = $request->user();
        if (!$student || $student->role !== 'murid') {
            $student = User::where('role', 'murid')->first();
        }

        if (!$student || !$student->classroom_id) {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'classroom' => null,
                    'materials' => [],
                ],
            ]);
        }

        $classroom = Classroom::find($student->classroom_id);

        $query = LearningMaterial::where('classroom_id', $student->classroom_id)
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>=', now());
            })
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
                    'id' => $classroom?->id,
                    'name' => $classroom?->name,
                    'code' => $classroom?->code,
                ],
                'materials' => $materials,
            ],
        ]);
    }
}
