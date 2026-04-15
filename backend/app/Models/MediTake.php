<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MediTake extends Model

{
    protected $table = 'medication_takes';
    protected $fillable = ['medication_id', 'take_time', 'dose', 'unit'];
}
