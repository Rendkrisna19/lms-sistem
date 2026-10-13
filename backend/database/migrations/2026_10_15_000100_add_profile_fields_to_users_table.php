<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Data profil guru & siswa untuk kebutuhan LMS. Semua opsional; kolom yang tidak relevan untuk role dibiarkan kosong.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Data pribadi (guru & siswa)
            $table->string('gender', 1)->nullable()->after('email');        // L | P
            $table->string('birth_place', 100)->nullable();
            $table->date('birth_date')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('city', 100)->nullable();                         // kota / kabupaten tempat tinggal
            $table->text('address')->nullable();                             // alamat lengkap

            // Guru
            $table->string('education_level', 10)->nullable();               // SMA/SMK, D3, S1, S2, S3
            $table->string('education_major', 120)->nullable();              // jurusan / program studi
            $table->string('employment_status', 30)->nullable();             // PNS, PPPK, Honorer, dst.
            $table->date('join_date')->nullable();                           // tanggal bergabung

            // Siswa
            $table->unsignedSmallInteger('admission_year')->nullable();      // tahun masuk
            $table->string('previous_school', 150)->nullable();              // asal sekolah
            $table->string('parent_name', 150)->nullable();                  // nama orang tua / wali
            $table->string('parent_phone', 20)->nullable();
            $table->string('parent_job', 100)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'gender', 'birth_place', 'birth_date', 'phone', 'city', 'address',
                'education_level', 'education_major', 'employment_status', 'join_date',
                'admission_year', 'previous_school', 'parent_name', 'parent_phone', 'parent_job',
            ]);
        });
    }
};
