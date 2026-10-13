<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SubmitAssignmentRequest;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Support\AssignmentFiles;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Penugasan dari sisi siswa: daftar tugas kelasnya, detail, dan pengumpulan jawaban.
 */
class StudentAssignmentController extends Controller
{
    /** Daftar tugas aktif kelas siswa beserta status pengumpulannya. */
    public function index(Request $request)
    {
        $student = $request->user();

        if (!$student->classroom_id) {
            return response()->json([
                'status' => 'success',
                'data' => ['classroom' => null, 'assignments' => []],
            ]);
        }

        $assignments = $this->classroomAssignments($student->classroom_id)
            ->with(['teacher:id,name', 'course:id,title'])
            ->orderBy('due_at')
            ->get();

        $mine = AssignmentSubmission::where('user_id', $student->id)
            ->whereIn('assignment_id', $assignments->pluck('id'))
            ->get()
            ->keyBy('assignment_id');

        return response()->json([
            'status' => 'success',
            'data' => [
                'classroom' => $student->classroom()->first(['id', 'name', 'code']),
                'server_time' => now()->toIso8601String(),
                'assignments' => $assignments->map(fn (Assignment $a) => $this->formatListItem($a, $mine->get($a->id)))->values(),
            ],
        ]);
    }

    /** Detail tugas beserta lampiran dan pengumpulan milik siswa sendiri. */
    public function show(Request $request, $id)
    {
        $student = $request->user();
        $assignment = $this->accessibleAssignment($student->classroom_id, $id)
            ->load(['teacher:id,name', 'course:id,title', 'classroom:id,name,code']);

        $submission = AssignmentSubmission::where('assignment_id', $assignment->id)->where('user_id', $student->id)->first();

        return response()->json([
            'status' => 'success',
            'data' => [
                'server_time' => now()->toIso8601String(),
                'assignment' => $this->formatDetail($assignment),
                'submission' => $submission ? $this->formatSubmission($submission) : null,
            ],
        ]);
    }

    /**
     * Kumpulkan (atau perbarui) jawaban. Aturan tenggat ditegakkan di server:
     * - setelah tenggat hanya diterima bila guru mengizinkan (ditandai terlambat),
     * - tugas yang sudah dinilai tidak dapat diubah.
     */
    public function submit(SubmitAssignmentRequest $request, $id)
    {
        $student = $request->user();
        $assignment = $this->accessibleAssignment($student->classroom_id, $id);

        if ($assignment->status_state === Assignment::STATE_INACTIVE) {
            return $this->error('Penugasan ini sudah tidak aktif.', 404);
        }
        if ($assignment->status_state === Assignment::STATE_CLOSED) {
            return $this->error('Batas waktu pengumpulan sudah lewat dan guru tidak menerima pengumpulan terlambat.', 422);
        }

        $existing = AssignmentSubmission::where('assignment_id', $assignment->id)->where('user_id', $student->id)->first();
        if ($existing?->isGraded()) {
            return $this->error('Tugas sudah dinilai dan tidak dapat diubah.', 409);
        }

        $answer = $request->has('answer_text') ? trim((string) $request->input('answer_text')) : ($existing?->answer_text);
        $hasNewFile = $request->hasFile('file');
        $hasFile = $hasNewFile || filled($existing?->file_path);

        if (blank($answer) && !$hasFile) {
            return $this->error('Isi jawaban atau unggah berkas terlebih dahulu.', 422);
        }

        $submission = DB::transaction(function () use ($request, $assignment, $student, $existing, $answer, $hasNewFile) {
            $attributes = [
                'answer_text' => filled($answer) ? $answer : null,
                'submitted_at' => now(),
                'is_late' => $assignment->due_at->isPast(),
            ];

            if ($hasNewFile) {
                AssignmentFiles::delete($existing?->file_path);
                $file = AssignmentFiles::store($request->file('file'), 'assignments/submissions/' . $assignment->id);
                $attributes['file_path'] = $file['path'];
                $attributes['file_name'] = $file['name'];
            }

            return AssignmentSubmission::updateOrCreate(
                ['assignment_id' => $assignment->id, 'user_id' => $student->id],
                $attributes
            );
        });

        return response()->json([
            'status' => 'success',
            'message' => $submission->is_late ? 'Tugas tersimpan (terlambat).' : 'Tugas berhasil dikumpulkan.',
            'data' => ['submission' => $this->formatSubmission($submission)],
        ]);
    }

    private function classroomAssignments(?int $classroomId)
    {
        return Assignment::where('classroom_id', $classroomId)->where('is_active', true);
    }

    private function accessibleAssignment(?int $classroomId, $id): Assignment
    {
        return $this->classroomAssignments($classroomId)->findOrFail($id);
    }

    private function formatListItem(Assignment $assignment, ?AssignmentSubmission $submission): array
    {
        return [
            'id' => $assignment->id,
            'title' => $assignment->title,
            'course_title' => $assignment->course?->title,
            'teacher_name' => $assignment->teacher?->name,
            'due_at' => $assignment->due_at?->toIso8601String(),
            'allow_late' => $assignment->allow_late,
            'max_score' => $assignment->max_score,
            'status_state' => $assignment->status_state,
            'can_submit' => $assignment->acceptsSubmissions() && !$submission?->isGraded(),
            'submission' => $submission ? [
                'state' => $this->submissionState($submission),
                'submitted_at' => $submission->submitted_at?->toIso8601String(),
                'is_late' => $submission->is_late,
                'score' => $submission->score,
            ] : null,
        ];
    }

    private function formatDetail(Assignment $assignment): array
    {
        return [
            'id' => $assignment->id,
            'title' => $assignment->title,
            'instructions' => $assignment->instructions,
            'course_title' => $assignment->course?->title,
            'classroom' => $assignment->classroom,
            'teacher_name' => $assignment->teacher?->name,
            'due_at' => $assignment->due_at?->toIso8601String(),
            'allow_late' => $assignment->allow_late,
            'max_score' => $assignment->max_score,
            'status_state' => $assignment->status_state,
            'can_submit' => $assignment->acceptsSubmissions(),
            'attachment' => $assignment->attachment_path ? [
                'name' => $assignment->attachment_name,
                'url' => $assignment->attachment_url,
            ] : null,
        ];
    }

    private function formatSubmission(AssignmentSubmission $submission): array
    {
        return [
            'state' => $this->submissionState($submission),
            'answer_text' => $submission->answer_text,
            'file' => $submission->file_path ? [
                'name' => $submission->file_name,
                'url' => $submission->file_url,
            ] : null,
            'submitted_at' => $submission->submitted_at?->toIso8601String(),
            'is_late' => $submission->is_late,
            'score' => $submission->score,
            'feedback' => $submission->feedback,
            'graded_at' => $submission->graded_at?->toIso8601String(),
        ];
    }

    private function submissionState(AssignmentSubmission $submission): string
    {
        if ($submission->isGraded()) {
            return 'graded';
        }
        return $submission->is_late ? 'late' : 'submitted';
    }

    private function error(string $message, int $status)
    {
        return response()->json(['status' => 'error', 'message' => $message], $status);
    }
}
