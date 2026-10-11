<?php

namespace Tests\Feature\Quiz;

use App\Models\ClassSubjectAssignment;
use App\Models\Classroom;
use App\Models\Course;
use App\Models\Quiz;
use App\Models\QuizOption;
use App\Models\QuizQuestion;
use App\Models\School;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * Data uji minimal untuk subsistem ujian: sekolah, kelas, mapel, guru (dengan plotting) dan siswa.
 */
trait QuizFixtures
{
    protected function makeSchool(): School
    {
        return School::create(['name' => 'Sekolah ' . Str::random(5), 'status' => 'active']);
    }

    protected function makeUser(string $role, School $school, ?Classroom $classroom = null): User
    {
        return User::create([
            'name' => ucfirst($role) . ' ' . Str::random(4),
            'email' => Str::random(10) . '@example.test',
            'password' => 'rahasia-123',
            'role' => $role,
            'school_id' => $school->id,
            'classroom_id' => $classroom?->id,
            'nomor_induk' => (string) random_int(10000000, 99999999) . Str::random(3),
        ]);
    }

    /**
     * @return array{school: School, teacher: User, classroom: Classroom, course: Course, student: User}
     */
    protected function makeTeachingSetup(?School $school = null): array
    {
        $school ??= $this->makeSchool();
        $teacher = $this->makeUser('guru', $school);
        $classroom = Classroom::create([
            'school_id' => $school->id,
            'name' => 'Kelas ' . Str::random(4),
            'code' => strtoupper(Str::random(6)),
        ]);
        $course = Course::create([
            'school_id' => $school->id,
            'title' => 'Mapel ' . Str::random(4),
            'description' => '',
            'instructor_id' => $teacher->id,
        ]);
        ClassSubjectAssignment::create([
            'classroom_id' => $classroom->id,
            'course_id' => $course->id,
            'teacher_id' => $teacher->id,
        ]);
        $student = $this->makeUser('murid', $school, $classroom);

        return compact('school', 'teacher', 'classroom', 'course', 'student');
    }

    /** Payload valid untuk endpoint simpan ujian guru. */
    protected function quizPayload(Classroom $classroom, Course $course, array $overrides = []): array
    {
        return array_merge([
            'classroom_id' => $classroom->id,
            'course_id' => $course->id,
            'title' => 'Kuis Basis Data',
            'instructions' => 'Kerjakan dengan jujur.',
            'duration_minutes' => 30,
            'passing_score' => 70,
            'starts_at' => null,
            'ends_at' => null,
            'is_active' => true,
            'show_result_immediately' => true,
            'questions' => [
                [
                    'question_text' => '<p>Apa itu <strong>1NF</strong>?</p>',
                    'points' => 60,
                    'explanation' => '<p>Nilai atomik.</p>',
                    'options' => [
                        ['option_text' => '<p>Nilai atomik</p>', 'is_correct' => true],
                        ['option_text' => '<p>Ada foreign key</p>', 'is_correct' => false],
                        ['option_text' => '', 'image_url' => 'https://example.test/gambar.png', 'is_correct' => false],
                    ],
                ],
                [
                    'question_text' => '<p>Perintah DDL adalah?</p>',
                    'points' => 40,
                    'options' => [
                        ['option_text' => 'SELECT', 'is_correct' => false],
                        ['option_text' => 'CREATE', 'is_correct' => true],
                    ],
                ],
            ],
        ], $overrides);
    }

    /**
     * Membuat ujian langsung lewat model.
     * Soal: [poin, indeks opsi benar, jumlah opsi]
     */
    protected function makeQuiz(array $setup, array $attributes = [], array $questions = [[60, 0, 3], [40, 1, 2]]): Quiz
    {
        $quiz = Quiz::create(array_merge([
            'school_id' => $setup['school']->id,
            'teacher_id' => $setup['teacher']->id,
            'classroom_id' => $setup['classroom']->id,
            'course_id' => $setup['course']->id,
            'title' => 'Kuis ' . Str::random(4),
            'duration_minutes' => 30,
            'passing_score' => 70,
            'is_active' => true,
            'is_published' => true,
            'show_result_immediately' => true,
        ], $attributes));

        foreach ($questions as $index => [$points, $correctIndex, $optionCount]) {
            $question = QuizQuestion::create([
                'quiz_id' => $quiz->id,
                'question_text' => '<p>Soal ' . ($index + 1) . '</p>',
                'points' => $points,
                'explanation' => 'Pembahasan rahasia',
                'order_index' => $index + 1,
            ]);
            for ($o = 0; $o < $optionCount; $o++) {
                QuizOption::create([
                    'question_id' => $question->id,
                    'option_label' => chr(65 + $o),
                    'option_text' => 'Opsi ' . chr(65 + $o),
                    'is_correct' => $o === $correctIndex,
                ]);
            }
        }

        return $quiz->fresh('questions.options');
    }

    protected function correctOptionId(QuizQuestion $question): int
    {
        return $question->options->firstWhere('is_correct', true)->id;
    }

    protected function wrongOptionId(QuizQuestion $question): int
    {
        return $question->options->firstWhere('is_correct', false)->id;
    }
}
