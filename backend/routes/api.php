<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');



Route::get('/statut-isag', function () {
    return response()->json([
        'projet' => 'ISAG - Suivi Médical',
        'status' => 'Connecté au Backend',
        'date' => now()->format('d/m/Y H:i')
    ]);
});

use App\Http\Controllers\AuthController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Utilise le middleware auth:sanctum pour protéger ces routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/user/update', [AuthController::class, 'updateProfile']);
});

use App\Http\Controllers\MedicationController;

// Routes protégées (l'utilisateur doit être connecté)
Route::middleware('auth:sanctum')->group(function () {
    
    // --- Gestion des Médicaments ---
    Route::get('/medications', [MedicationController::class, 'index']);      // Liste
    Route::post('/medications', [MedicationController::class, 'store']);    // Ajouter
    Route::get('/medications/{id}', [MedicationController::class, 'show']); // Détails
    Route::put('/medications/{id}', [MedicationController::class, 'update']); // Modifier
    Route::delete('/medications/{id}', [MedicationController::class, 'destroy']); // Supprimer
    
    // Route spéciale pour activer/désactiver (is_active)
    Route::patch('/medications/{id}/toggle', [MedicationController::class, 'toggleStatus']);

    // --- Gestion des Mesures (Maladies chroniques) ---
});


use App\Http\Controllers\MeasureController;

Route::middleware('auth:sanctum')->post('/measures', [MeasureController::class, 'store']);