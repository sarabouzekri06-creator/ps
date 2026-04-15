<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\MediTake;

class Medication extends Model
{
    protected $fillable = [
    'user_id', 'medication_name', 'current_stock', 'low_stock_alert', 
    'start_day', 'number_of_days', 'frequency_type', 'frequency_details', 
    'instruction', 'reminder_color', 'comment', 'is_active'
];

// Dans App\Models\Medication.php
public function takes() {
    return $this->hasMany(MediTake::class, 'medication_id');
}
}
