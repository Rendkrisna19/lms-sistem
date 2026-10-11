<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'title',
        'description',
        'instructor_id',
    ];

    public function school()
    {
        return $this->belongsTo(School::class, 'school_id');
    }

    public function instructor()
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function lessons()
    {
        return $this->hasMany(Lesson::class)->orderBy('order_index');
    }

    public function quizzes()
    {
        return $this->hasMany(Quiz::class);
    }
}
