<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Log akses siswa terhadap bahan ajar (dasar analitik gaya belajar).
     */
    public function up(): void
    {
        Schema::create('material_accesses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('learning_material_id')->constrained('learning_materials')->cascadeOnDelete();
            $table->string('content_type', 20); // document | audio | video
            $table->timestamp('accessed_at')->useCurrent();
            $table->timestamps();

            $table->index(['user_id', 'learning_material_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('material_accesses');
    }
};
