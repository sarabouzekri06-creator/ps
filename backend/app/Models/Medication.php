<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\MediTake;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class Medication extends Model
{

// protected $fillable = ['notification_id','user_id', 'medication_name', 'medication_image', 'current_stock'];

protected $fillable = [
    'user_id',
    'notification_id',
    'medication_name',
    'medication_image',
    'current_stock',
    'is_active'
];

    // Le lien vers la notification (Inverse)
    public function notification()
    {
        return $this->belongsTo(Notification::class);
    }

    // Un médicament a PLUSIEURS heures de prise
    public function takes()
    {
        return $this->hasMany(MediTake::class, 'medication_id');
    }

     public function user(): BelongsTo
    {
        // On précise 'utilisateurs' car c'est le nom de ta table personnalisée
        return $this->belongsTo(Utilisateur::class, 'user_id');
    }
}
