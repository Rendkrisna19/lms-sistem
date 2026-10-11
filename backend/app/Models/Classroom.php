<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Classroom extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'name',
        'code',
        'homeroom_teacher_id',
        'academic_year',
        'description',
    ];

    public function school()
    {
        return $this->belongsTo(School::class, 'school_id');
    }

    public function homeroomTeacher()
    {
        return $this->belongsTo(User::class, 'homeroom_teacher_id');
    }

    public function students()
    {
        return $this->hasMany(User::class, 'classroom_id')->where('role', 'murid');
    }

    public function assignments()
    {
        return $this->hasMany(ClassSubjectAssignment::class, 'classroom_id');
    }

    public function subjectAssignments()
    {
        return $this->hasMany(ClassSubjectAssignment::class, 'classroom_id');
    }

    public function courses()
    {
        return $this->belongsToMany(Course::class, 'class_subject_assignments', 'classroom_id', 'course_id')
            ->withPivot('teacher_id', 'schedule_day', 'schedule_time', 'room')
            ->withTimestamps();
    }
}
