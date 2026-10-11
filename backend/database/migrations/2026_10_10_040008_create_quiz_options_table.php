<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained('quiz_questions')->onDelete('cascade');
            $table->string('option_label', 5); // 'A', 'B', 'C', 'D', 'E'
            $table->text('option_text');
            $table->boolean('is_correct')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_options');
    }
};
