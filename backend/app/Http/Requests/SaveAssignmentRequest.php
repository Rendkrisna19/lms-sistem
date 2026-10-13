<?php

namespace App\Http\Requests;

use App\Support\AssignmentFiles;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validasi pembuatan / pembaruan penugasan oleh guru.
 */
class SaveAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'guru';
    }

    public function rules(): array
    {
        $isCreate = $this->isMethod('post') && !$this->route('id');

        return [
            'classroom_id' => 'required|integer',
            'course_id' => 'required|integer',
            'title' => 'required|string|max:255',
            'instructions' => 'nullable|string|max:5000',
            'due_at' => ($isCreate ? 'required|date|after:now' : 'required|date'),
            'allow_late' => 'required|boolean',
            'max_score' => 'required|integer|min:1|max:1000',
            'is_active' => 'required|boolean',
            'remove_attachment' => 'sometimes|boolean',
            'attachment' => 'nullable|file|mimes:' . AssignmentFiles::EXTENSIONS . '|max:' . AssignmentFiles::MAX_KB,
        ];
    }

    public function messages(): array
    {
        return [
            'due_at.after' => 'Batas waktu harus berada di masa depan.',
            'attachment.mimes' => 'Lampiran harus berupa PDF, Office, ZIP, JPG, atau PNG.',
            'attachment.max' => 'Ukuran lampiran maksimal 10 MB.',
        ];
    }
}
