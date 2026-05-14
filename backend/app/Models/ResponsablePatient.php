<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResponsablePatient extends Model
{
    protected $table    = 'responsables_patient';
    protected $fillable = [
        'patient_id',
        'email_responsable',
        'ordre',
        'is_active',
    ];
    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function patient()
    {
        return $this->belongsTo(Utilisateur::class, 'patient_id');
    }
}
