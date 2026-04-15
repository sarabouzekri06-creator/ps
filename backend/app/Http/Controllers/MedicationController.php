<?php

namespace App\Http\Controllers;

use App\Models\Medication;
use App\Models\MediTake;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MedicationController extends Controller
{

public function index(Request $request)
{
    try {
        // On récupère les médicaments de l'utilisateur ID 1 pour être sûr
        // et on charge la relation 'takes' (ou le nom défini dans votre modèle)
        $medications = Medication::with('takes')
            ->where('user_id', 1) 
            ->get();

        return response()->json($medications);

    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Erreur lors de la lecture des données',
            'message' => $e->getMessage(),
            'line' => $e->getLine()
        ], 500);
    }
}
    public function store(Request $request)
    {
        // 1. Validation des données (selon vos noms de champs React)
        $validatedData = $request->validate([
            'medicationName' => 'required|string',
            'currentStock' => 'required|integer',
            'startDay' => 'required|date',
            'numberOfDays' => 'required|integer',
            'frequencyType' => 'required|in:daily,weekly,monthly',
            'instruction' => 'required|string',
            'reminderColor' => 'required|string',
            'takes' => 'required|array|min:1', // Au moins une prise
        ]);

        try {
            return DB::transaction(function () use ($request) {
                
                // 2. Création du médicament
                $medication = Medication::create([
                   'user_id' => 1, // On lie à l'utilisateur connecté
                    'medication_name' => $request->medicationName,
                    'current_stock' => $request->currentStock,
                    'low_stock_alert' => $request->lowStockAlert,
                    'start_day' => $request->startDay,
                    'number_of_days' => $request->numberOfDays,
                    'frequency_type' => $request->frequencyType,
                    'frequency_details' => json_encode($request->frequency_details),
                    'instruction' => $request->instruction,
                    'reminder_color' => $request->reminderColor,
                    'comment' => $request->comment,
                    'is_active' => true,
                ]);

                // 3. Création des prises multiples (la boucle)
                foreach ($request->takes as $take) {
                    MediTake::create([
                        'medication_id' => $medication->id,
                        'take_time' => $take['time'],
                        'dose' => $take['dose'],
                        'unit' => $take['type'], // Dans votre React, unit est stocké dans 'type'
                    ]);
                }

                return response()->json([
                    'message' => 'Médicament enregistré avec succès',
                    'data' => $medication->load('takes')
                ], 201);
            });
       } catch (\Exception $e) {
    return response()->json([
        'error' => 'Erreur technique détectée',
        'message' => $e->getMessage(), // <--- Cela va nous dire quelle colonne pose problème
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ], 500);
}
    }

    public function toggleStatus($id)
{
    try {
        $medication = Medication::findOrFail($id);
        
        // On inverse la valeur actuelle (1 devient 0, et vice-versa)
        $medication->is_active = !$medication->is_active;
        $medication->save();

        return response()->json([
            'message' => 'Statut mis à jour',
            'is_active' => $medication->is_active
        ]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

    
}
