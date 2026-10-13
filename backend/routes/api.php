<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\LessonController;
use App\Http\Controllers\Api\MasterAdminController;
use App\Http\Controllers\Api\SchoolAdminController;
use App\Http\Controllers\Api\AdminUserSpreadsheetController;
use App\Http\Controllers\Api\TeacherDashboardController;
use App\Http\Controllers\Api\StudentDashboardController;
use App\Http\Controllers\Api\StudentQuizController;
use App\Http\Controllers\Api\SchoolController;
use App\Http\Controllers\Api\TeacherMaterialController;
use App\Http\Controllers\Api\TeacherQuizController;
use App\Http\Controllers\Api\TeacherAssignmentController;
use App\Http\Controllers\Api\StudentAssignmentController;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

Route::middleware('auth:sanctum')->group(function () {
    // ==========================================
    // AKUN (SEMUA ROLE)
    // ==========================================
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/me/profile', [AuthController::class, 'updateProfile']);
    Route::put('/me/password', [AuthController::class, 'updatePassword']);

    // ==========================================
    // 1. KHUSUS ROLE ADMIN MASTER (PUSAT)
    // ==========================================
    Route::middleware('role:admin_master')->group(function () {
        Route::prefix('master')->group(function () {
            Route::get('/overview', [MasterAdminController::class, 'overview']);
            Route::get('/teachers', [MasterAdminController::class, 'allTeachers']);
            Route::get('/students', [MasterAdminController::class, 'allStudents']);
            Route::get('/classrooms', [MasterAdminController::class, 'allClassrooms']);
            Route::get('/courses', [MasterAdminController::class, 'allCourses']);
            Route::get('/learning-analytics', [MasterAdminController::class, 'learningAnalytics']);
        });

        // Manajemen Sekolah Mitra
        Route::get('/admin/schools', [SchoolController::class, 'index']);
        Route::get('/admin/schools/{id}', [SchoolController::class, 'show']);
        Route::post('/admin/schools', [SchoolController::class, 'store']);
        Route::put('/admin/schools/{id}', [SchoolController::class, 'update']);
        Route::delete('/admin/schools/{id}', [SchoolController::class, 'destroy']);
        Route::get('/admin/schools/{id}/analytics', [SchoolController::class, 'analytics']);
        Route::post('/admin/schools/export', [SchoolController::class, 'export']);
    });

    // ==========================================
    // 2. ADMIN SEKOLAH (admin_master boleh mengakses dengan parameter school_id)
    // ==========================================
    Route::middleware('role:admin,admin_master')->group(function () {
        $schoolAdminRoutes = function () {
            Route::get('/overview', [SchoolAdminController::class, 'overview']);
            Route::get('/learning-analytics', [SchoolAdminController::class, 'learningAnalytics']);

            Route::get('/teachers', [SchoolAdminController::class, 'teachers']);
            Route::post('/teachers', [SchoolAdminController::class, 'createTeacher']);
            Route::put('/teachers/{id}', [SchoolAdminController::class, 'updateTeacher']);
            Route::delete('/teachers/{id}', [SchoolAdminController::class, 'deleteTeacher']);

            Route::get('/students', [SchoolAdminController::class, 'students']);
            Route::post('/students', [SchoolAdminController::class, 'createStudent']);
            Route::put('/students/{id}', [SchoolAdminController::class, 'updateStudent']);
            Route::delete('/students/{id}', [SchoolAdminController::class, 'deleteStudent']);

            Route::get('/classrooms', [SchoolAdminController::class, 'classrooms']);
            Route::get('/classrooms/{id}', [SchoolAdminController::class, 'classroomDetail']);
            Route::post('/classrooms', [SchoolAdminController::class, 'createClassroom']);
            Route::put('/classrooms/{id}', [SchoolAdminController::class, 'updateClassroom']);
            Route::delete('/classrooms/{id}', [SchoolAdminController::class, 'deleteClassroom']);
            Route::post('/classrooms/{id}/assignments', [SchoolAdminController::class, 'createAssignment']);
            Route::delete('/assignments/{id}', [SchoolAdminController::class, 'deleteAssignment']);
            Route::post('/classrooms/{id}/assign-student', [SchoolAdminController::class, 'assignStudentToClass']);
            Route::delete('/classrooms/{id}/students/{studentId}', [SchoolAdminController::class, 'removeStudentFromClass']);

            Route::get('/courses', [SchoolAdminController::class, 'courses']);
            Route::post('/courses', [SchoolAdminController::class, 'createCourse']);
            Route::put('/courses/{id}', [SchoolAdminController::class, 'updateCourse']);
            Route::delete('/courses/{id}', [SchoolAdminController::class, 'deleteCourse']);

            // Template, impor, dan ekspor Excel/PDF untuk data guru dan siswa
            Route::get('/{resource}/template', [AdminUserSpreadsheetController::class, 'template'])
                ->whereIn('resource', ['teachers', 'students']);
            Route::post('/{resource}/import', [AdminUserSpreadsheetController::class, 'import'])
                ->whereIn('resource', ['teachers', 'students']);
            Route::post('/{resource}/export', [AdminUserSpreadsheetController::class, 'export'])
                ->whereIn('resource', ['teachers', 'students']);
        };

        Route::prefix('school-admin')->group($schoolAdminRoutes);
        // Alias /admin/* yang dipakai frontend
        Route::prefix('admin')->group($schoolAdminRoutes);
    });

    // ==========================================
    // 3. KHUSUS ROLE GURU PENGAMPU
    // ==========================================
    Route::middleware('role:guru')->prefix('teacher')->group(function () {
        Route::get('/overview', [TeacherDashboardController::class, 'overview']);
        Route::get('/courses', [TeacherDashboardController::class, 'courses']);
        Route::get('/classrooms', [TeacherDashboardController::class, 'classrooms']);
        Route::get('/students', [TeacherDashboardController::class, 'students']);
        Route::get('/grades', [TeacherDashboardController::class, 'grades']);
        Route::get('/learning-analytics', [TeacherDashboardController::class, 'learningAnalytics']);
        Route::get('/progress-report', [LessonController::class, 'teacherProgressReport']);

        Route::get('/materials', [TeacherMaterialController::class, 'index']);
        Route::get('/material-options', [TeacherMaterialController::class, 'getOptions']);
        Route::post('/materials', [TeacherMaterialController::class, 'store']);
        Route::patch('/materials/{id}/toggle-status', [TeacherMaterialController::class, 'toggleStatus']);
        Route::delete('/materials/{id}', [TeacherMaterialController::class, 'destroy']);

        Route::get('/quizzes', [TeacherQuizController::class, 'index']);
        Route::get('/quiz-options', [TeacherQuizController::class, 'options']);
        Route::post('/quizzes/upload-image', [TeacherQuizController::class, 'uploadImage'])->middleware('throttle:60,1');
        Route::get('/quizzes/{id}', [TeacherQuizController::class, 'show']);
        Route::post('/quizzes', [TeacherQuizController::class, 'store']);
        Route::put('/quizzes/{id}', [TeacherQuizController::class, 'update']);
        Route::patch('/quizzes/{id}/toggle-status', [TeacherQuizController::class, 'toggleStatus']);
        Route::delete('/quizzes/{id}', [TeacherQuizController::class, 'destroy']);
        Route::get('/quizzes/{id}/grades', [TeacherQuizController::class, 'grades']);
        Route::get('/quizzes/{id}/export-csv', [TeacherQuizController::class, 'exportGrades']);
        // Penugasan: POST /assignments/{id} dipakai untuk ubah (multipart, _method=PUT)
        Route::get('/assignments', [TeacherAssignmentController::class, 'index']);
        Route::post('/assignments', [TeacherAssignmentController::class, 'store']);
        Route::get('/assignments/{id}', [TeacherAssignmentController::class, 'show']);
        Route::match(['put', 'post'], '/assignments/{id}', [TeacherAssignmentController::class, 'update']);
        Route::delete('/assignments/{id}', [TeacherAssignmentController::class, 'destroy']);
        Route::put('/assignments/{id}/submissions/{submissionId}', [TeacherAssignmentController::class, 'grade']);

        Route::post('/quizzes/{id}/students/{studentId}/retake', [TeacherQuizController::class, 'grantRetake']);
        Route::delete('/quizzes/{id}/students/{studentId}/retake', [TeacherQuizController::class, 'revokeRetake']);
    });

    // ==========================================
    // 4. KHUSUS ROLE SISWA
    // ==========================================
    Route::middleware('role:murid')->prefix('student')->group(function () {
        Route::get('/overview', [StudentDashboardController::class, 'overview']);
        Route::get('/grades', [StudentDashboardController::class, 'grades']);
        Route::get('/schedule', [StudentDashboardController::class, 'schedule']);

        Route::get('/materials', [TeacherMaterialController::class, 'studentMaterials']);
        Route::post('/materials/{id}/access', [TeacherMaterialController::class, 'recordAccess']);

        // Ujian online (CBT): mulai -> simpan jawaban -> kumpulkan
        Route::get('/quizzes', [StudentQuizController::class, 'index']);
        Route::post('/quizzes/{id}/start', [StudentQuizController::class, 'start']);
        Route::post('/attempts/{id}/answers', [StudentQuizController::class, 'saveAnswer']);
        Route::post('/attempts/{id}/submit', [StudentQuizController::class, 'submit']);
        Route::get('/attempts/{id}', [StudentQuizController::class, 'result']);

        // Penugasan: pengumpulan memakai POST multipart (teks dan/atau berkas)
        Route::get('/assignments', [StudentAssignmentController::class, 'index']);
        Route::get('/assignments/{id}', [StudentAssignmentController::class, 'show']);
        Route::post('/assignments/{id}/submit', [StudentAssignmentController::class, 'submit']);
    });

    // ==========================================
    // PEMBELAJARAN (LESSON) — akses dibatasi di controller per kelas / pemilik
    // ==========================================
    Route::get('/lessons', [LessonController::class, 'index']);
    Route::get('/lessons/{id}', [LessonController::class, 'show']);
    Route::post('/lessons', [LessonController::class, 'store'])->middleware('role:guru');
    Route::post('/lessons/{id}/contents', [LessonController::class, 'storeContent'])->middleware('role:guru');
    Route::post('/lessons/{id}/progress', [LessonController::class, 'markProgress'])->middleware('role:murid');
});
