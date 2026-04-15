<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Measure;

class MeasureController extends Controller
{
public function store(Request $request)
{
    try {
        $measure = Measure::create([
            'user_id'        => $request->user()->id, // Récupéré via le Token
            'disease_name'   => $request->diseaseName,
            'severity'       => $request->severity,
            'start_day'      => $request->startDay,
            'number_of_days' => $request->numberOfDays,
            'frequency_type' => $request->frequencyType,
            'selected_days'  => $request->selectedDays, // Sera casté en JSON auto
            'instruction'    => $request->instruction,
            'reminder_color' => $request->reminderColor,
            'comment'        => $request->comment,
        ]);

        return response()->json(['message' => 'Mesure enregistrée !'], 201);
    } catch (\Exception $e) {
        // En cas d'erreur 500, ce message s'affichera dans l'onglet "Response" de ton inspecteur
        return response()->json(['error' => $e->getMessage()], 500);
    }
}
}
