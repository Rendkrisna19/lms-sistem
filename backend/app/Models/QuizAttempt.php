<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuizAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'quiz_id',
        'user_id',
        'started_at',
        'submitted_at',
        'score',
        'total_correct',
        'total_questions',
        'status',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'submitted_at' => 'datetime',
        'score' => 'float',
    ];

    protected $appends = [
        'is_passed',
    ];

    public function getIsPassedAttribute(): bool
    {
        if (is_null($this->score)) {
            return false;
        }
        $passingScore = $this->quiz?->passing_score ?? 70;
        return $this->score >= $passingScore;
    }

    public function quiz()
    {
        return $this->belongsTo(Quiz::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function answers()
    {
        return $this->hasMany(QuizAnswer::class, 'attempt_id');
    }
}
