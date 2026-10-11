<?php

namespace App\Support;

use App\Models\Quiz;
use App\Models\QuizOption;
use App\Models\QuizQuestion;

/**
 * Menyinkronkan butir soal & opsi jawaban sebuah ujian berdasarkan payload editor.
 * Soal / opsi yang sudah ada diperbarui berdasarkan ID (bukan dihapus lalu dibuat ulang),
 * sehingga jawaban siswa pada soal yang tidak diubah tetap tersimpan.
 */
class QuizQuestionSync
{
    public function __construct(private HtmlSanitizer $sanitizer)
    {
    }

    public function sync(Quiz $quiz, array $questions): void
    {
        $existingQuestions = $quiz->questions()->with('options')->get()->keyBy('id');
        $keptQuestionIds = [];

        foreach (array_values($questions) as $index => $data) {
            $attributes = [
                'question_text' => $this->sanitizer->clean($data['question_text'] ?? ''),
                'image_url' => $data['image_url'] ?? null,
                'points' => (int) ($data['points'] ?? 10),
                'explanation' => $this->cleanNullable($data['explanation'] ?? null),
                'order_index' => $index + 1,
            ];

            $question = isset($data['id']) ? $existingQuestions->get((int) $data['id']) : null;

            if ($question) {
                $question->update($attributes);
            } else {
                $question = $quiz->questions()->create($attributes);
            }

            $keptQuestionIds[] = $question->id;
            $this->syncOptions($question, $data['options'] ?? []);
        }

        $quiz->questions()->whereNotIn('id', $keptQuestionIds)->delete();
    }

    private function syncOptions(QuizQuestion $question, array $options): void
    {
        $existingOptions = $question->relationLoaded('options')
            ? $question->options->keyBy('id')
            : $question->options()->get()->keyBy('id');
        $keptOptionIds = [];

        foreach (array_values($options) as $index => $data) {
            $attributes = [
                // Label ditentukan server berdasarkan urutan: A, B, C, D, E
                'option_label' => chr(65 + $index),
                'option_text' => $this->sanitizer->clean($data['option_text'] ?? ''),
                'image_url' => $data['image_url'] ?? null,
                'is_correct' => filter_var($data['is_correct'] ?? false, FILTER_VALIDATE_BOOLEAN),
            ];

            $option = isset($data['id']) ? $existingOptions->get((int) $data['id']) : null;

            if ($option) {
                $option->update($attributes);
            } else {
                $option = QuizOption::create($attributes + ['question_id' => $question->id]);
            }

            $keptOptionIds[] = $option->id;
        }

        QuizOption::where('question_id', $question->id)->whereNotIn('id', $keptOptionIds)->delete();
    }

    private function cleanNullable(?string $html): ?string
    {
        $clean = $this->sanitizer->clean($html);
        return $this->sanitizer->isBlank($clean) ? null : $clean;
    }
}
