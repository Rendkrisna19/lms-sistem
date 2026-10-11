<?php

namespace Tests\Concerns;

use App\Models\ClassSubjectAssignment;
use App\Models\Classroom;
use App\Models\Course;
use App\Models\LearningMaterial;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\School;
use App\Models\User;

/**
 * Data uji minimal untuk satu sekolah: admin, guru, kelas, mapel, plotting, dan siswa.
 */
trait LmsFixtures
{
    /**
     * @return array{school:School, admin:User, teacher:User, classroom:Classroom, course:Course, assignment:ClassSubjectAssignment, student:User}
     */
    protected function createSchoolWorld(): array
    {
        $school = School::factory()->create();
        $admin = User::factory()->schoolAdmin()->create(['school_id' => $school->id]);
        $teacher = User::factory()->guru()->create(['school_id' => $school->id]);
        $classroom = Classroom::factory()->create(['school_id' => $school->id]);
        $course = Course::factory()->create(['school_id' => $school->id, 'instructor_id' => $teacher->id]);
        $assignment = ClassSubjectAssignment::factory()->create([
            'classroom_id' => $classroom->id,
            'course_id' => $course->id,
            'teacher_id' => $teacher->id,
        ]);
        $student = User::factory()->murid()->create([
            'school_id' => $school->id,
            'classroom_id' => $classroom->id,
        ]);

        return compact('school', 'admin', 'teacher', 'classroom', 'course', 'assignment', 'student');
    }

    protected function createMaterial(array $world, array $attributes = []): LearningMaterial
    {
        return LearningMaterial::factory()->create($attributes + [
            'school_id' => $world['school']->id,
            'teacher_id' => $world['teacher']->id,
            'classroom_id' => $world['classroom']->id,
            'course_id' => $world['course']->id,
        ]);
    }

    protected function createQuiz(array $world, array $attributes = []): Quiz
    {
        return Quiz::create($attributes + [
            'school_id' => $world['school']->id,
            'teacher_id' => $world['teacher']->id,
            'classroom_id' => $world['classroom']->id,
            'course_id' => $world['course']->id,
            'title' => 'Kuis ' . uniqid(),
            'duration_minutes' => 30,
            'passing_score' => 70,
            'is_active' => true,
            'is_published' => true,
            'show_result_immediately' => true,
        ]);
    }

    protected function createAttempt(Quiz $quiz, User $student, array $attributes = []): QuizAttempt
    {
        return QuizAttempt::create($attributes + [
            'quiz_id' => $quiz->id,
            'user_id' => $student->id,
            'started_at' => now()->subMinutes(20),
            'submitted_at' => now()->subMinutes(5),
            'score' => 80,
            'total_correct' => 4,
            'total_questions' => 5,
            'status' => 'submitted',
        ]);
    }
}
