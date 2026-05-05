<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MedicationTakeLog extends Model
{
    protected $fillable = [
        'take_id',
        'user_id',
        'taken_at',
        'status',
    ];

    protected $casts = [
        'taken_at' => 'date',
    ];

    public function take()
    {
        return $this->belongsTo(MedicationTake::class, 'take_id');
    }

     public function user(): BelongsTo
    {
        // On précise 'utilisateurs' car c'est le nom de ta table personnalisée
        return $this->belongsTo(Utilisateur::class, 'user_id');
    }
}
