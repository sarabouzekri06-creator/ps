<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MeasureTake extends Model
{
    protected $fillable = ['measure_id', 'take_time', 'label', 'notif_sent_date'];



    public function measure()
    {
        return $this->belongsTo(Measure::class);
    }
}
