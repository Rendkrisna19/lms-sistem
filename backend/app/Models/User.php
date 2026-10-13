<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable([
    'name', 'email', 'password', 'role', 'school_id', 'classroom_id', 'nomor_induk', 'nim_nip',
    'gender', 'birth_place', 'birth_date', 'phone', 'city', 'address',
    'education_level', 'education_major', 'employment_status', 'join_date',
    'admission_year', 'previous_school', 'parent_name', 'parent_phone', 'parent_job',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'birth_date' => 'date:Y-m-d',
            'join_date' => 'date:Y-m-d',
            'admission_year' => 'integer',
        ];
    }

    public function school()
    {
        return $this->belongsTo(School::class, 'school_id');
    }

    public function classroom()
    {
        return $this->belongsTo(Classroom::class, 'classroom_id');
    }

    public function teachingAssignments()
    {
        return $this->hasMany(ClassSubjectAssignment::class, 'teacher_id');
    }

    public function quizAttempts()
    {
        return $this->hasMany(QuizAttempt::class, 'user_id');
    }

    public function materialAccesses()
    {
        return $this->hasMany(MaterialAccess::class, 'user_id');
    }
}
