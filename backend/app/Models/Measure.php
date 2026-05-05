<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Measure extends Model
{
    // Ajout de user_id pour éviter l'erreur "Field doesn't have a default value"
  protected $fillable = [
    'notification_id',
    'user_id',
    'disease_name',
    'severity',
    'unit',        // ← nouveau
    'max_target',  // ← nouveau
    'min_target',  // ← nouveau
    'is_active',
];

    /**
     * Relation avec la notification (le planning)
     */
    public function notification(): BelongsTo
    {
        return $this->belongsTo(Notification::class);
    }

    /**
     * Relation avec l'utilisateur
     */
    public function user(): BelongsTo
    {
        // On précise 'utilisateurs' car c'est le nom de ta table personnalisée
        return $this->belongsTo(Utilisateur::class, 'user_id');
    }


  // Assure-toi que cette fonction existe bien
public function takes()
{
    return $this->hasMany(MeasureTake::class);
}

public function history()
{
    return $this->hasMany(MeasureResult::class);
}
}
