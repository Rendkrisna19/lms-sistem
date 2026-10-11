<?php

namespace App\Http\Requests;

use App\Models\ClassSubjectAssignment;
use App\Support\HtmlSanitizer;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Validasi pembuatan / pembaruan ujian beserta butir soal & kunci jawaban.
 */
class SaveQuizRequest extends FormRequest
{
    public const MIN_OPTIONS = 2;
    public const MAX_OPTIONS = 5;

    public function authorize(): bool
    {
        return $this->user()?->role === 'guru';
    }

    public function rules(): array
    {
        return [
            'classroom_id' => 'required|integer',
            'course_id' => 'required|integer',
            'title' => 'required|string|max:255',
            'instructions' => 'nullable|string|max:5000',
            'duration_minutes' => 'required|integer|min:1|max:600',
            'passing_score' => 'required|integer|min:0|max:100',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date',
            'is_active' => 'required|boolean',
            'show_result_immediately' => 'required|boolean',

            'questions' => 'required|array|min:1|max:200',
            'questions.*.id' => 'nullable|integer',
            'questions.*.question_text' => 'required|string|max:60000',
            'questions.*.image_url' => 'nullable|url|max:500',
            'questions.*.points' => 'required|integer|min:1|max:1000',
            'questions.*.explanation' => 'nullable|string|max:20000',
            'questions.*.options' => 'required|array|min:' . self::MIN_OPTIONS . '|max:' . self::MAX_OPTIONS,
            'questions.*.options.*.id' => 'nullable|integer',
            'questions.*.options.*.option_text' => 'nullable|string|max:20000',
            'questions.*.options.*.image_url' => 'nullable|url|max:500',
            'questions.*.options.*.is_correct' => 'required|boolean',
        ];
    }

    public function attributes(): array
    {
        return [
            'classroom_id' => 'kelas',
            'course_id' => 'mata pelajaran',
            'title' => 'judul ujian',
            'instructions' => 'instruksi',
            'duration_minutes' => 'durasi',
            'passing_score' => 'KKM',
            'starts_at' => 'jadwal dibuka',
            'ends_at' => 'jadwal ditutup',
            'questions' => 'butir soal',
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $this->validateAssignment($validator);
                $this->validateSchedule($validator);
                $this->validateQuestions($validator);
            },
        ];
    }

    /** Waktu dari frontend (ISO dengan offset) dikonversi ke zona waktu aplikasi. */
    public function scheduleValue(string $key): ?Carbon
    {
        $value = $this->input($key);
        if (empty($value)) {
            return null;
        }
        return Carbon::parse($value)->setTimezone(config('app.timezone'));
    }

    private function validateAssignment(Validator $validator): void
    {
        $isAssigned = ClassSubjectAssignment::where('teacher_id', $this->user()->id)
            ->where('classroom_id', $this->input('classroom_id'))
            ->where('course_id', $this->input('course_id'))
            ->exists();

        if (!$isAssigned) {
            $validator->errors()->add('classroom_id', 'Kelas & mata pelajaran ini tidak termasuk plotting mengajar Anda.');
        }
    }

    private function validateSchedule(Validator $validator): void
    {
        $startsAt = $this->scheduleValue('starts_at');
        $endsAt = $this->scheduleValue('ends_at');

        if ($startsAt && $endsAt && $endsAt->lessThanOrEqualTo($startsAt)) {
            $validator->errors()->add('ends_at', 'Jadwal ditutup harus setelah jadwal dibuka.');
        }
    }

    private function validateQuestions(Validator $validator): void
    {
        $sanitizer = app(HtmlSanitizer::class);

        foreach ($this->input('questions', []) as $index => $question) {
            $number = $index + 1;

            if ($sanitizer->isBlank($sanitizer->clean($question['question_text'] ?? ''))) {
                $validator->errors()->add("questions.$index.question_text", "Teks soal nomor $number belum diisi.");
            }

            $options = $question['options'] ?? [];
            $correctCount = collect($options)->filter(fn ($opt) => filter_var($opt['is_correct'] ?? false, FILTER_VALIDATE_BOOLEAN))->count();

            if ($correctCount !== 1) {
                $validator->errors()->add("questions.$index.options", "Soal nomor $number harus memiliki tepat satu kunci jawaban.");
            }

            foreach ($options as $optIndex => $option) {
                $hasText = !$sanitizer->isBlank($sanitizer->clean($option['option_text'] ?? ''));
                $hasImage = !empty($option['image_url']);

                if (!$hasText && !$hasImage) {
                    $label = chr(65 + $optIndex);
                    $validator->errors()->add(
                        "questions.$index.options.$optIndex.option_text",
                        "Pilihan $label pada soal nomor $number harus berisi teks atau gambar."
                    );
                }
            }
        }
    }
}
