<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'title',
        'description',
        'order_index',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function contents()
    {
        return $this->hasMany(LessonContent::class);
    }

    public function quiz()
    {
        return $this->hasOne(Quiz::class);
    }

    public function progress()
    {
        return $this->hasMany(StudentLessonProgress::class);
    }
}
