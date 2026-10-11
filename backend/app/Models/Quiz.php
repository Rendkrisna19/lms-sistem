<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quiz extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'teacher_id',
        'classroom_id',
        'course_id',
        'lesson_id',
        'title',
        'instructions',
        'duration_minutes',
        'passing_score',
        'starts_at',
        'ends_at',
        'is_active',
        'is_published',
        'show_result_immediately',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_published' => 'boolean',
        'show_result_immediately' => 'boolean',
        'duration_minutes' => 'integer',
        'passing_score' => 'integer',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    protected $appends = [
        'status_state',
    ];

    public function classroom()
    {
        return $this->belongsTo(Classroom::class);
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function questions()
    {
        return $this->hasMany(QuizQuestion::class)->orderBy('order_index');
    }

    public function attempts()
    {
        return $this->hasMany(QuizAttempt::class);
    }

    public function getStatusStateAttribute(): string
    {
        if (!$this->is_active) {
            return 'inactive';
        }
        if ($this->starts_at && $this->starts_at->isFuture()) {
            return 'upcoming';
        }
        if ($this->ends_at && $this->ends_at->isPast()) {
            return 'closed';
        }
        return 'active';
    }
}
