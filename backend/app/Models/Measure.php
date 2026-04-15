<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Measure extends Model
{
    protected $fillable = [
    'user_id', 'disease_name', 'severity', 'start_day', 
    'number_of_days', 'frequency_type', 'selected_days', 
    'instruction', 'reminder_color', 'comment'
    ];

    /**
     * CRUCIAL : Transforme automatiquement l'array en JSON et inversement.
     */
    protected $casts = [
        'selected_days' => 'array',
        'start_day' => 'date',
    ];

    /**
     * Relation avec l'utilisateur (Utilisateur ou User selon votre projet)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'user_id');
    }
}