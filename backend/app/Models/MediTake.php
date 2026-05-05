<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MediTake extends Model
{
    // On précise la table car le nom du modèle (MediTake)
    // ne correspond pas au pluriel automatique (medi_takes)
    protected $table = 'medication_takes';

    protected $fillable = ['medication_id', 'take_time', 'dose', 'unit','status'];

    /**
     * Un horaire de prise appartient à un Médicament
     */
    public function medication(): BelongsTo
    {
        // Correction ici : On lie au modèle Medication
        return $this->belongsTo(Medication::class, 'medication_id');
    }

     public function logs()
    {
        return $this->hasMany(MedicationTakeLog::class, 'take_id');
    }
}
