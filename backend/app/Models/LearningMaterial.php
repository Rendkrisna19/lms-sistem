<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class LearningMaterial extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'teacher_id',
        'classroom_id',
        'course_id',
        'lesson_id',
        'title',
        'description',
        'content_type',
        'video_source_type',
        'file_path',
        'file_name_original',
        'file_size_bytes',
        'external_url',
        'is_active',
        'expires_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'expires_at' => 'datetime',
        'file_size_bytes' => 'integer',
    ];

    protected $appends = [
        'is_expired',
        'file_url',
        'formatted_file_size',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function classroom()
    {
        return $this->belongsTo(Classroom::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }

    public function getIsExpiredAttribute(): bool
    {
        if (!$this->expires_at) {
            return false;
        }
        return $this->expires_at->isPast();
    }

    public function getFileUrlAttribute(): ?string
    {
        if (!$this->file_path) {
            return null;
        }
        return asset('storage/' . $this->file_path);
    }

    public function getFormattedFileSizeAttribute(): ?string
    {
        if (!$this->file_size_bytes) {
            return null;
        }
        $bytes = $this->file_size_bytes;
        if ($bytes >= 1048576) {
            return round($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return round($bytes / 1024, 1) . ' KB';
        }
        return $bytes . ' B';
    }
}
