<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Kode kelas cukup unik di dalam satu sekolah (bukan global seluruh platform).
     */
    public function up(): void
    {
        Schema::table('classrooms', function (Blueprint $table) {
            $table->dropUnique('classrooms_code_unique');
            $table->unique(['school_id', 'code'], 'classrooms_school_code_unique');
        });
    }

    public function down(): void
    {
        Schema::table('classrooms', function (Blueprint $table) {
            $table->dropUnique('classrooms_school_code_unique');
            $table->unique('code');
        });
    }
};
