<?php
// app/Models/Manquement.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Manquement extends Model
{
    protected $fillable = [
        'patient_id',
        'type',
        'ref_id',
        'date',
        'email_envoye',
    ];

    protected $casts = [
        'email_envoye' => 'boolean',
    ];
}
