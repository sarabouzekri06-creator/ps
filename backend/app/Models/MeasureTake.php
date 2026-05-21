<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MeasureTake extends Model
{
    protected $fillable = ['measure_id', 'take_time', 'label'];



    public function measure()
    {
        return $this->belongsTo(Measure::class);
    }
}
