<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveAssignmentRequest;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\ClassSubjectAssignment;
use App\Models\User;
use App\Support\AssignmentFiles;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Penugasan dari sisi guru: kelola tugas per kelas & mapel, lihat pengumpulan, dan beri nilai.
 */
class TeacherAssignmentController extends Controller
{
    /** Daftar penugasan milik guru beserta ringkasan pengumpulan. */
    public function index(Request $request)
    {
        $teacher = $request->user();

        $assignments = Assignment::where('teacher_id', $teacher->id)
            ->with(['classroom:id,name,code', 'course:id,title'])
            ->withCount([
                'submissions',
                'submissions as graded_count' => fn ($q) => $q->whereNotNull('score'),
                'submissions as late_count' => fn ($q) => $q->where('is_late', true),
            ])
            ->orderByDesc('due_at')
            ->get();

        $studentCounts = $this->studentCounts($assignments->pluck('classroom_id')->unique());

        return response()->json([
            'status' => 'success',
            'data' => [
                'assignments' => $assignments
                    ->map(fn (Assignment $assignment) => $this->formatListItem($assignment, (int) $studentCounts->get($assignment->classroom_id, 0)))
                    ->values(),
            ],
        ]);
    }

    /** Detail penugasan beserta status pengumpulan setiap siswa di kelas. */
    public function show(Request $request, $id)
    {
        $assignment = $this->ownAssignment($request, $id)->load(['classroom:id,name,code', 'course:id,title']);

        $students = User::where('role', 'murid')
            ->where('classroom_id', $assignment->classroom_id)
            ->orderBy('name')
            ->get(['id', 'name', 'nomor_induk', 'nim_nip']);

        $submissions = AssignmentSubmission::where('assignment_id', $assignment->id)->get()->keyBy('user_id');

        $rows = $students->map(function (User $student) use ($submissions) {
            $submission = $submissions->get($student->id);

            return [
                'student_id' => $student->id,
                'name' => $student->name,
                'nomor_induk' => $student->nomor_induk ?? $student->nim_nip,
                'submission' => $submission ? $this->formatSubmission($submission) : null,
            ];
        })->values();

        return response()->json([
            'status' => 'success',
            'data' => [
                'assignment' => $this->formatDetail($assignment),
                'summary' => [
                    'total_students' => $rows->count(),
                    'submitted' => $rows->filter(fn ($row) => $row['submission'] !== null)->count(),
                    'graded' => $rows->filter(fn ($row) => $row['submission']['is_graded'] ?? false)->count(),
                    'late' => $rows->filter(fn ($row) => $row['submission']['is_late'] ?? false)->count(),
                    'not_submitted' => $rows->filter(fn ($row) => $row['submission'] === null)->count(),
                ],
                'students' => $rows,
            ],
        ]);
    }

    public function store(SaveAssignmentRequest $request)
    {
        $teacher = $request->user();
        $this->ensureTeachesClassroomCourse($teacher->id, $request->integer('classroom_id'), $request->integer('course_id'));

        $assignment = DB::transaction(function () use ($request, $teacher) {
            $assignment = Assignment::create($this->attributes($request) + [
                'school_id' => $teacher->school_id,
                'teacher_id' => $teacher->id,
            ]);

            if ($request->hasFile('attachment')) {
                $file = AssignmentFiles::store($request->file('attachment'), 'assignments/attachments');
                $assignment->update(['attachment_path' => $file['path'], 'attachment_name' => $file['name']]);
            }

            return $assignment;
        });

        return response()->json([
            'status' => 'success',
            'message' => "Penugasan \"{$assignment->title}\" berhasil dibuat.",
            'data' => $this->formatDetail($assignment->load(['classroom:id,name,code', 'course:id,title'])),
        ], 201);
    }

    /** Ubah penugasan. Lampiran diganti bila ada berkas baru; remove_attachment menghapus lampiran lama. */
    public function update(SaveAssignmentRequest $request, $id)
    {
        $assignment = $this->ownAssignment($request, $id);
        $this->ensureTeachesClassroomCourse($request->user()->id, $request->integer('classroom_id'), $request->integer('course_id'));

        DB::transaction(function () use ($request, $assignment) {
            $assignment->update($this->attributes($request));

            if ($request->hasFile('attachment')) {
                AssignmentFiles::delete($assignment->attachment_path);
                $file = AssignmentFiles::store($request->file('attachment'), 'assignments/attachments');
                $assignment->update(['attachment_path' => $file['path'], 'attachment_name' => $file['name']]);
            } elseif ($request->boolean('remove_attachment')) {
                AssignmentFiles::delete($assignment->attachment_path);
                $assignment->update(['attachment_path' => null, 'attachment_name' => null]);
            }
        });

        $assignment->refresh()->load(['classroom:id,name,code', 'course:id,title']);

        return response()->json([
            'status' => 'success',
            'message' => "Penugasan \"{$assignment->title}\" berhasil diperbarui.",
            'data' => $this->formatDetail($assignment),
        ]);
    }

    /** Hapus penugasan beserta lampiran dan seluruh berkas pengumpulan siswa. */
    public function destroy(Request $request, $id)
    {
        $assignment = $this->ownAssignment($request, $id);
        $title = $assignment->title;

        DB::transaction(function () use ($assignment) {
            AssignmentFiles::delete($assignment->attachment_path);
            $assignment->submissions()->get()->each(fn (AssignmentSubmission $submission) => AssignmentFiles::delete($submission->file_path));
            $assignment->delete();
        });

        return response()->json([
            'status' => 'success',
            'message' => "Penugasan \"{$title}\" berhasil dihapus.",
        ]);
    }

    /** Beri nilai dan umpan balik pada satu pengumpulan siswa. */
    public function grade(Request $request, $id, $submissionId)
    {
        $assignment = $this->ownAssignment($request, $id);
        $submission = AssignmentSubmission::where('assignment_id', $assignment->id)->findOrFail($submissionId);

        $validated = $request->validate([
            'score' => 'required|numeric|min:0|max:' . $assignment->max_score,
            'feedback' => 'nullable|string|max:5000',
        ]);

        $submission->update([
            'score' => $validated['score'],
            'feedback' => filled($validated['feedback'] ?? null) ? trim($validated['feedback']) : null,
            'graded_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Nilai tersimpan.',
            'data' => ['submission' => $this->formatSubmission($submission->refresh())],
        ]);
    }

    private function ownAssignment(Request $request, $id): Assignment
    {
        return Assignment::where('teacher_id', $request->user()->id)->findOrFail($id);
    }

    private function ensureTeachesClassroomCourse(int $teacherId, int $classroomId, int $courseId): void
    {
        $allowed = ClassSubjectAssignment::where('teacher_id', $teacherId)
            ->where('classroom_id', $classroomId)
            ->where('course_id', $courseId)
            ->exists();

        abort_unless($allowed, 422, 'Anda hanya dapat membuat penugasan untuk kelas dan mapel yang Anda ajar.');
    }

    private function attributes(SaveAssignmentRequest $request): array
    {
        return [
            'classroom_id' => $request->integer('classroom_id'),
            'course_id' => $request->integer('course_id'),
            'title' => trim($request->input('title')),
            'instructions' => filled($request->input('instructions')) ? trim($request->input('instructions')) : null,
            'due_at' => $request->date('due_at'),
            'allow_late' => $request->boolean('allow_late'),
            'max_score' => $request->integer('max_score'),
            'is_active' => $request->boolean('is_active'),
        ];
    }

    /** @param  Collection<int, int|null>  $classroomIds */
    private function studentCounts(Collection $classroomIds): Collection
    {
        return User::where('role', 'murid')
            ->whereIn('classroom_id', $classroomIds)
            ->selectRaw('classroom_id, COUNT(*) as total')
            ->groupBy('classroom_id')
            ->pluck('total', 'classroom_id');
    }

    private function formatListItem(Assignment $assignment, int $studentCount): array
    {
        return [
            'id' => $assignment->id,
            'title' => $assignment->title,
            'classroom' => $assignment->classroom,
            'course' => $assignment->course,
            'due_at' => $assignment->due_at?->toIso8601String(),
            'allow_late' => $assignment->allow_late,
            'max_score' => $assignment->max_score,
            'is_active' => $assignment->is_active,
            'status_state' => $assignment->status_state,
            'student_count' => $studentCount,
            'submitted_count' => (int) $assignment->submissions_count,
            'graded_count' => (int) $assignment->graded_count,
            'late_count' => (int) $assignment->late_count,
        ];
    }

    private function formatDetail(Assignment $assignment): array
    {
        return [
            'id' => $assignment->id,
            'title' => $assignment->title,
            'instructions' => $assignment->instructions,
            'classroom' => $assignment->classroom,
            'course' => $assignment->course,
            'due_at' => $assignment->due_at?->toIso8601String(),
            'allow_late' => $assignment->allow_late,
            'max_score' => $assignment->max_score,
            'is_active' => $assignment->is_active,
            'status_state' => $assignment->status_state,
            'attachment' => $assignment->attachment_path ? [
                'name' => $assignment->attachment_name,
                'url' => $assignment->attachment_url,
            ] : null,
        ];
    }

    private function formatSubmission(AssignmentSubmission $submission): array
    {
        return [
            'id' => $submission->id,
            'answer_text' => $submission->answer_text,
            'file' => $submission->file_path ? [
                'name' => $submission->file_name,
                'url' => $submission->file_url,
            ] : null,
            'submitted_at' => $submission->submitted_at?->toIso8601String(),
            'is_late' => $submission->is_late,
            'is_graded' => $submission->isGraded(),
            'score' => $submission->score,
            'feedback' => $submission->feedback,
            'graded_at' => $submission->graded_at?->toIso8601String(),
        ];
    }
}
