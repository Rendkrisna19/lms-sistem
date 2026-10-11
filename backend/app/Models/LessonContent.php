<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LessonContent extends Model
{
    use HasFactory;

    protected $fillable = [
        'lesson_id',
        'content_type',
        'title',
        'file_path',
        'file_name_original',
        'file_size_bytes',
        'duration_seconds',
        'external_url',
        'notes',
    ];

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }
}
