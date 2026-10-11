<?php

namespace Tests\Feature;

use App\Models\MaterialAccess;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\LmsFixtures;
use Tests\TestCase;

class TeacherDashboardTest extends TestCase
{
    use LmsFixtures, RefreshDatabase;

    public function test_overview_uses_real_counts_without_placeholders(): void
    {
        $world = $this->createSchoolWorld();
        Sanctum::actingAs($world['teacher']);

        $this->getJson('/api/teacher/overview')
            ->assertOk()
            ->assertJsonPath('data.summary.total_materials', 0)
            ->assertJsonPath('data.summary.total_quizzes', 0)
            ->assertJsonPath('data.summary.average_student_score', 0)
            ->assertJsonPath('data.summary.total_students_guided', 1)
            ->assertJsonPath('data.teacher.school_name', $world['school']->name);
    }

    public function test_grades_only_include_own_quizzes_and_average_excludes_in_progress(): void
    {
        $world = $this->createSchoolWorld();
        $colleague = User::factory()->guru()->create(['school_id' => $world['school']->id]);

        $myQuiz = $this->createQuiz($world, ['passing_score' => 75]);
        $colleagueQuiz = $this->createQuiz($world, ['teacher_id' => $colleague->id]);
        $peer = User::factory()->murid()->create(['school_id' => $world['school']->id, 'classroom_id' => $world['classroom']->id]);

        $this->createAttempt($myQuiz, $world['student'], ['score' => 80]);
        $this->createAttempt($myQuiz, $peer, ['score' => null, 'status' => 'in_progress', 'submitted_at' => null]);
        $this->createAttempt($colleagueQuiz, $world['student'], ['score' => 10]);

        Sanctum::actingAs($world['teacher']);

        $grades = $this->getJson('/api/teacher/grades')->assertOk()->json('data');
        $this->assertCount(2, $grades);
        $this->assertEqualsCanonicalizing([$myQuiz->id], collect($grades)->pluck('quiz_id')->unique()->all());

        $inProgress = collect($grades)->firstWhere('attempt_status', 'in_progress');
        $this->assertNull($inProgress['submitTime']);
        $this->assertNull($inProgress['nilai']);

        $submitted = collect($grades)->firstWhere('attempt_status', 'submitted');
        $this->assertSame('Lulus', $submitted['status']);

        $this->getJson('/api/teacher/overview')
            ->assertOk()
            ->assertJsonPath('data.summary.average_student_score', 80)
            ->assertJsonPath('data.summary.total_quizzes', 1)
            ->assertJsonCount(1, 'data.recent_submissions');
    }

    public function test_learning_analytics_counts_material_accesses_of_teacher_students(): void
    {
        $world = $this->createSchoolWorld();
        $outsider = $this->createSchoolWorld();
        $audio = $this->createMaterial($world, ['content_type' => 'audio']);
        $video = $this->createMaterial($world, ['content_type' => 'video']);

        foreach ([[$audio, 3], [$video, 1]] as [$material, $times]) {
            for ($i = 0; $i < $times; $i++) {
                MaterialAccess::create([
                    'user_id' => $world['student']->id,
                    'learning_material_id' => $material->id,
                    'content_type' => $material->content_type,
                    'accessed_at' => now()->subDays($i),
                ]);
            }
        }

        Sanctum::actingAs($world['teacher']);

        $response = $this->getJson('/api/teacher/learning-analytics')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'summary' => ['total_students_analyzed', 'pdf_percentage', 'audio_percentage', 'video_percentage', 'total_media_interactions'],
                    'students' => [['id', 'name', 'nis', 'school_name', 'classroom_name', 'classroom_id', 'pdf_access_count', 'audio_access_count', 'video_access_count', 'total_access', 'dominant_style', 'learning_pace']],
                ],
            ])
            ->assertJsonPath('data.summary.total_students_analyzed', 1)
            ->assertJsonPath('data.summary.total_media_interactions', 4)
            ->assertJsonPath('data.summary.audio_percentage', 75)
            ->assertJsonPath('data.summary.video_percentage', 25)
            ->assertJsonPath('data.students.0.audio_access_count', 3)
            ->assertJsonPath('data.students.0.dominant_style', 'Auditori (Audio Suara Guru)')
            ->assertJsonPath('data.students.0.learning_pace', 'Perlu Pendampingan');

        $this->assertNotContains($outsider['student']->id, collect($response->json('data.students'))->pluck('id'));
    }
}
