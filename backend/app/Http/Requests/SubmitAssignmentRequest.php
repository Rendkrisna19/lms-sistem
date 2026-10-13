<?php

namespace App\Http\Requests;

use App\Support\AssignmentFiles;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Pengumpulan tugas oleh siswa: jawaban teks dan/atau berkas.
 */
class SubmitAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'murid';
    }

    public function rules(): array
    {
        return [
            'answer_text' => 'nullable|string|max:20000',
            'file' => 'nullable|file|mimes:' . AssignmentFiles::EXTENSIONS . '|max:' . AssignmentFiles::MAX_KB,
        ];
    }

    public function messages(): array
    {
        return [
            'file.mimes' => 'Berkas harus berupa PDF, Office, ZIP, JPG, atau PNG.',
            'file.max' => 'Ukuran berkas maksimal 10 MB.',
        ];
    }
}
