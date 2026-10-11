<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuizAttempt extends Model
{
    use HasFactory;

    /** Toleransi keterlambatan jaringan saat menyimpan / mengumpulkan jawaban (detik). */
    public const GRACE_SECONDS = 30;

    protected $fillable = [
        'quiz_id',
        'user_id',
        'started_at',
        'deadline_at',
        'submitted_at',
        'score',
        'total_correct',
        'total_questions',
        'status',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'deadline_at' => 'datetime',
        'submitted_at' => 'datetime',
        'score' => 'float',
        'total_correct' => 'integer',
        'total_questions' => 'integer',
    ];

    protected $appends = [
        'is_passed',
    ];

    public function getIsPassedAttribute(): bool
    {
        if (is_null($this->score) || $this->status === 'in_progress') {
            return false;
        }
        $passingScore = $this->quiz?->passing_score ?? 70;
        return $this->score >= $passingScore;
    }

    public function isFinished(): bool
    {
        return in_array($this->status, ['submitted', 'timed_out'], true);
    }

    /** Waktu pengerjaan sudah melewati batas (termasuk toleransi jaringan). */
    public function isExpired(): bool
    {
        return $this->deadline_at !== null
            && now()->greaterThan($this->deadline_at->copy()->addSeconds(self::GRACE_SECONDS));
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
