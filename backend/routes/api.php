<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\MedicationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MeasureController;
use App\Http\Controllers\MeasureResultController;
use App\Http\Controllers\PushSubscriptionController;
use App\Http\Controllers\ResponsablePatientController;

// ── Public ────────────────────────────────────────────────────────
Route::get('/statut-isag', fn() => response()->json([
    'projet' => 'ISAG - Suivi Médical',
    'status' => 'Connecté au Backend',
    'date'   => now()->format('d/m/Y H:i'),
]));

// Route de test — à supprimer après
Route::middleware('auth:sanctum')->get('/test-notif', function (Request $request) {
    app(\App\Services\PushNotificationService::class)->sendToPatient(
        patientId: $request->user()->id,
        title:     '🧪 Test notification',
        body:      'Si tu reçois cet email, les notifications fonctionnent !',
        url:       '/'
    );
    return response()->json(['message' => 'Notification envoyée !']);
});




Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// ── Protégé ───────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // ── Auth ──
    Route::post('/logout',      [AuthController::class, 'logout']);
    Route::get('/user',         [AuthController::class, 'me']);
    Route::post('/user/update', [AuthController::class, 'updateProfile']);

    // ── Dashboard ──
    Route::get('/dashboard-data',      [DashboardController::class, 'getDashboardData']);
    Route::post('/takes/{id}/done',    [DashboardController::class, 'markTakeAsDone']);
    Route::post('/measures/{id}/done', [DashboardController::class, 'markMeasureAsDone']);

    // ── Médicaments ──
    Route::get    ('/medications',              [MedicationController::class, 'index']);
    Route::post   ('/medications',              [MedicationController::class, 'store']);
    Route::get    ('/medications/{id}',         [MedicationController::class, 'show']);
    Route::put    ('/medications/{id}',         [MedicationController::class, 'update']);
    Route::delete ('/medications/{id}',         [MedicationController::class, 'destroy']);
    Route::patch  ('/medications/{id}/toggle',  [MedicationController::class, 'toggleStatus']);
    Route::post   ('/medications/{id}/restock', [MedicationController::class, 'restock']);

    // ── Mesures ──
    Route::get    ('/measures',              [MeasureController::class, 'index']);
    Route::post   ('/measures',              [MeasureController::class, 'store']);
    Route::get    ('/measures/stats',        [MeasureController::class, 'getStats']);
    Route::get    ('/measures/{id}',         [MeasureController::class, 'show']);
    Route::put    ('/measures/{id}',         [MeasureController::class, 'update']);
    Route::delete ('/measures/{id}',         [MeasureController::class, 'destroy']);
    Route::patch  ('/measures/{id}/toggle',  [MeasureController::class, 'toggleStatus']);
    Route::post   ('/measures/result',       [MeasureController::class, 'storeResult']);

    // ── Résultats mesures ──
    Route::put    ('/measures/results/{id}', [MeasureResultController::class, 'update']);
    Route::delete ('/measures/results/{id}', [MeasureResultController::class, 'destroy']);

    // ── Push notifications ──
    Route::post('/push/subscribe', [PushSubscriptionController::class, 'store']);

    // ── Responsables ──
    Route::get    ('/responsables',        [ResponsablePatientController::class, 'index']);
    Route::post   ('/responsables',        [ResponsablePatientController::class, 'store']);
    Route::patch  ('/responsables/{id}',   [ResponsablePatientController::class, 'toggle']);
});
