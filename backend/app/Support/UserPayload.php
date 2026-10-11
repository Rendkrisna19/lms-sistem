<?php

namespace App\Support;

use App\Models\User;

/**
 * Bentuk data pengguna yang konsisten untuk endpoint login / me / profil.
 */
class UserPayload
{
    public static function make(User $user): array
    {
        $user->loadMissing(['school:id,name,npsn', 'classroom:id,name,code']);

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'school_id' => $user->school_id,
            'school' => $user->school ? [
                'id' => $user->school->id,
                'name' => $user->school->name,
                'npsn' => $user->school->npsn,
            ] : null,
            'classroom_id' => $user->classroom_id,
            'classroom' => $user->classroom ? [
                'id' => $user->classroom->id,
                'name' => $user->classroom->name,
                'code' => $user->classroom->code,
            ] : null,
            'nomor_induk' => $user->nomor_induk ?? $user->nim_nip,
        ];
    }
}
