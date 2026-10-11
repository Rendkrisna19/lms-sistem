<?php

namespace App\Support;

use App\Models\ClassSubjectAssignment;
use App\Models\Classroom;
use App\Models\Course;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Ruang lingkup data milik seorang guru: plotting mengajar, kelas (diajar + wali kelas),
 * dan mapel (diplot + instruktur). Selalu dibangun dari pengguna yang sedang login.
 */
class TeacherScope
{
    /**
     * @param  Collection<int, ClassSubjectAssignment>  $assignments
     * @param  Collection<int, int>  $classroomIds
     * @param  Collection<int, int>  $courseIds
     */
    private function __construct(
        public readonly User $teacher,
        public readonly Collection $assignments,
        public readonly Collection $classroomIds,
        public readonly Collection $courseIds,
    ) {
    }

    public static function for(User $teacher): self
    {
        $assignments = ClassSubjectAssignment::where('teacher_id', $teacher->id)
            ->with([
                'classroom:id,name,code,academic_year,school_id',
                'course:id,title,description,school_id',
            ])
            ->get();

        $classroomIds = $assignments->pluck('classroom_id')
            ->merge(Classroom::where('homeroom_teacher_id', $teacher->id)->pluck('id'))
            ->filter()->map(fn ($id) => (int) $id)->unique()->values();

        $courseIds = $assignments->pluck('course_id')
            ->merge(Course::where('instructor_id', $teacher->id)->pluck('id'))
            ->filter()->map(fn ($id) => (int) $id)->unique()->values();

        return new self($teacher, $assignments, $classroomIds, $courseIds);
    }

    public function teachesCourse(int|string|null $courseId): bool
    {
        return $courseId !== null && $this->courseIds->contains((int) $courseId);
    }

    public function hasClassroom(int|string|null $classroomId): bool
    {
        return $classroomId !== null && $this->classroomIds->contains((int) $classroomId);
    }

    /**
     * Apakah guru diplot mengajar mapel tertentu di kelas tertentu.
     */
    public function hasAssignment(int|string|null $classroomId, int|string|null $courseId): bool
    {
        return $this->assignments->contains(
            fn ($a) => (int) $a->classroom_id === (int) $classroomId && (int) $a->course_id === (int) $courseId
        );
    }

    /**
     * Mapel yang diajar guru per kelas: [classroom_id => [course_id, ...]].
     *
     * @return Collection<int, Collection<int, int>>
     */
    public function courseIdsByClassroom(): Collection
    {
        return $this->assignments
            ->groupBy('classroom_id')
            ->map(fn ($items) => $items->pluck('course_id')->map(fn ($id) => (int) $id)->unique()->values());
    }
}
