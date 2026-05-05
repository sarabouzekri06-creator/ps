<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
     protected $fillable = ['user_id','measure_id', 'type', 'start_day', 'number_of_days', 'frequency_type', 'frequency_details', 'is_active'];

    // Une notification peut avoir UN médicament
    public function medication()
    {
        return $this->hasOne(Medication::class);
    }

    // Une notification peut avoir UNE mesure
    public function measure()
    {
        return $this->hasOne(Measure::class);
    }

    public function user()
{
    // Indique que cette notification appartient à un Utilisateur
    return $this->belongsTo(Utilisateur::class, 'user_id');
}
}
