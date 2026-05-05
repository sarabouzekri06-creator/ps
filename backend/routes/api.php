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

use App\Http\Controllers\DashboardController;
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/dashboard-data', [DashboardController::class, 'getDashboardData']);
});
Route::middleware('auth:sanctum')->group(function () {
    // Route pour valider une prise
    Route::post('/takes/{id}/done', [DashboardController::class, 'markTakeAsDone']);
    // Route pour valider une mesure
    Route::post('/measures/{id}/done', [DashboardController::class, 'markMeasureAsDone']);
});










use App\Http\Controllers\MeasureResultController;




use App\Http\Controllers\MeasureController;
Route::middleware('auth:sanctum')->group(function () {


Route::put    ('/measures/results/{id}', [MeasureResultController::class, 'update']);
Route::delete ('/measures/results/{id}', [MeasureResultController::class, 'destroy']);



    // ── Mesures ──
    Route::get    ('measures',               [MeasureController::class, 'index']);
    Route::post   ('measures',               [MeasureController::class, 'store']);
    Route::post   ('/measures/result',       [MeasureController::class, 'storeResult']);
    Route::post   ('measures/results',       [MeasureController::class, 'storeResult']);
    Route::get    ('measures/stats',         [MeasureController::class, 'getStats']);   // ← AVANT {id}
    Route::get    ('/measures/{id}',         [MeasureController::class, 'show']);       // ← NOUVEAU
    Route::put    ('/measures/{id}',         [MeasureController::class, 'update']);     // ← NOUVEAU
    Route::delete ('/measures/{id}',         [MeasureController::class, 'destroy']);
    Route::patch  ('/measures/{id}/toggle',  [MeasureController::class, 'toggleStatus']);
});



