<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'guru', 'murid'])->default('murid')->after('email');
            $table->string('nomor_induk', 50)->nullable()->unique()->after('role'); // ID Admin, NIP Guru, NIS Siswa
            $table->string('nim_nip', 50)->nullable()->after('nomor_induk');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'nomor_induk', 'nim_nip']);
        });
    }
};
