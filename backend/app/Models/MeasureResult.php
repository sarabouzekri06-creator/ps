<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MeasureResult extends Model
{
    use HasFactory;

    // On autorise le remplissage de la valeur, de la note et de l'id parent
    protected $fillable = [
        'measure_id',
        'value',
        'note'
    ];

    /**
     * Relation inverse : Un résultat appartient à une mesure précise.
     */
    public function measure(): BelongsTo
    {
        return $this->belongsTo(Measure::class);
    }
}
