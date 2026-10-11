<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class School extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'npsn',
        'jenjang',
        'address',
        'phone',
        'email',
        'logo',
        'status',
    ];

    public function users()
    {
        return $this->hasMany(User::class, 'school_id');
    }

    public function teachers()
    {
        return $this->hasMany(User::class, 'school_id')->where('role', 'guru');
    }

    public function students()
    {
        return $this->hasMany(User::class, 'school_id')->where('role', 'murid');
    }

    public function classrooms()
    {
        return $this->hasMany(Classroom::class, 'school_id');
    }

    public function courses()
    {
        return $this->hasMany(Course::class, 'school_id');
    }

    public function admin()
    {
        return $this->hasOne(User::class, 'school_id')->where('role', 'admin');
    }
}
