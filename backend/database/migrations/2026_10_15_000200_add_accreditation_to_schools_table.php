<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Akreditasi sekolah: A, B, C, atau belum terakreditasi. */
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->string('accreditation', 20)->nullable()->after('jenjang');
        });
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn('accreditation');
        });
    }
};
