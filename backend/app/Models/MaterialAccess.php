<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MaterialAccess extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'learning_material_id',
        'content_type',
        'accessed_at',
    ];

    protected $casts = [
        'accessed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function material()
    {
        return $this->belongsTo(LearningMaterial::class, 'learning_material_id');
    }
}
