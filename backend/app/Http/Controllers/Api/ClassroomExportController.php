<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Classroom;
use App\Support\Spreadsheet\ClassroomExporter;
use Illuminate\Http\Request;

/**
 * Ekspor daftar kelas. Admin sekolah mengekspor sekolahnya; admin master mengekspor semua sekolah
 * atau satu sekolah bila school_id dikirim.
 */
class ClassroomExportController extends Controller
{
    public function export(Request $request)
    {
        $validated = $request->validate([
            'format' => 'required|in:xlsx,pdf',
            'ids' => 'nullable|array|max:5000',
            'ids.*' => 'integer',
        ]);

        $user = $request->user();
        $query = Classroom::with(['school:id,name', 'homeroomTeacher:id,name', 'subjectAssignments.course:id,title', 'subjectAssignments.teacher:id,name'])
            ->withCount('students');

        if ($user->role === 'admin') {
            $query->where('school_id', $user->school_id);
        } elseif ($request->filled('school_id') && $request->input('school_id') !== 'all') {
            $query->where('school_id', (int) $request->input('school_id'));
        }

        if (($validated['ids'] ?? null) !== null) {
            $ids = array_values(array_unique(array_map('intval', $validated['ids'])));
            $query->whereIn('id', $ids);
            $classrooms = $query->get()->sortBy(fn (Classroom $c) => array_search($c->id, $ids, true))->values();
        } else {
            $classrooms = $query->orderBy('name')->get();
        }

        $base = 'Daftar_Kelas_' . now('Asia/Jakarta')->format('Y-m-d');
        if ($validated['format'] === 'pdf') {
            return response(ClassroomExporter::toPdf($classrooms), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => "attachment; filename=\"{$base}.pdf\"",
            ]);
        }

        return response(ClassroomExporter::toXlsx($classrooms), 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$base}.xlsx\"",
        ]);
    }
}
