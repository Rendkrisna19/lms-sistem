<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Assignment extends Model
{
    use HasFactory;

    /** open: masih menerima pengumpulan · late: lewat tenggat tapi masih boleh dikumpulkan · closed: ditutup · inactive: dinonaktifkan guru */
    public const STATE_OPEN = 'open';
    public const STATE_LATE = 'late';
    public const STATE_CLOSED = 'closed';
    public const STATE_INACTIVE = 'inactive';

    protected $fillable = [
        'school_id',
        'teacher_id',
        'classroom_id',
        'course_id',
        'title',
        'instructions',
        'due_at',
        'allow_late',
        'max_score',
        'attachment_path',
        'attachment_name',
        'is_active',
    ];

    protected $casts = [
        'due_at' => 'datetime',
        'allow_late' => 'boolean',
        'is_active' => 'boolean',
        'max_score' => 'integer',
    ];

    protected $appends = ['status_state'];

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(AssignmentSubmission::class);
    }

    public function getStatusStateAttribute(): string
    {
        if (!$this->is_active) {
            return self::STATE_INACTIVE;
        }
        if (now()->lessThanOrEqualTo($this->due_at)) {
            return self::STATE_OPEN;
        }
        return $this->allow_late ? self::STATE_LATE : self::STATE_CLOSED;
    }

    public function getAttachmentUrlAttribute(): ?string
    {
        return $this->attachment_path ? asset('storage/' . $this->attachment_path) : null;
    }

    /** Pengumpulan masih diterima (sebelum atau setelah tenggat bila diizinkan). */
    public function acceptsSubmissions(): bool
    {
        return in_array($this->status_state, [self::STATE_OPEN, self::STATE_LATE], true);
    }
}
