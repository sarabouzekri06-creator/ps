<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\MedicationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MeasureController;
use App\Http\Controllers\MeasureResultController;
use App\Http\Controllers\ResponsablePatientController;

// ── Public ────────────────────────────────────────────────────────
Route::get('/statut-isag', fn() => response()->json([
    'projet' => 'ISAG - Suivi Médical',
    'status' => 'Connecté au Backend',
    'date'   => now()->format('d/m/Y H:i'),
]));

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// ── Protégé ───────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // ── Auth ──
    Route::post('/logout',      [AuthController::class, 'logout']);
    Route::get  ('/user',       [AuthController::class, 'me']);
    Route::post ('/user/update',[AuthController::class, 'updateProfile']);

    // ── Dashboard ──
    Route::get  ('/dashboard-data',      [DashboardController::class, 'getDashboardData']);
    Route::post ('/takes/{id}/done',     [DashboardController::class, 'markTakeAsDone']);
    Route::post ('/measures/{id}/done',  [DashboardController::class, 'markMeasureAsDone']);

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
    // Route::post('/push/subscribe', [PushSubscriptionController::class, 'store']);

    // ── Responsables ──
     Route::get   ('/responsables',              [ResponsablePatientController::class, 'index']);
    Route::post  ('/responsables',              [ResponsablePatientController::class, 'store']);
    Route::patch ('/responsables/{id}',         [ResponsablePatientController::class, 'update']);
    Route::patch ('/responsables/{id}/toggle',  [ResponsablePatientController::class, 'toggle']);
    Route::delete('/responsables/{id}',         [ResponsablePatientController::class, 'destroy']);
    // ── Confirmer prise depuis WhatsApp ──
    // Utilise la même logique que le bouton "Pris" du dashboard
    Route::post('/medicaments/{takeId}/confirmer', function ($takeId, Request $request) {
        // Appeler markTakeAsDone du DashboardController
        $controller = new DashboardController();
        $response   = $controller->markTakeAsDone($request, $takeId);

        // Envoyer WhatsApp confirmation
        $take = \App\Models\MediTake::with('medication.user')->find($takeId);
        if ($take && $take->medication && $take->medication->user) {
            $user      = $take->medication->user;
            $telephone = \App\Helpers\NotificationHelper::telephoneDestinataire($user);
            $nom       = $take->medication->medication_name;

            \App\Helpers\NotificationHelper::envoyerWhatsApp(
                $telephone,
                "✅ *Prise confirmée !*\n\n« {$nom} » enregistré avec succès.\n\n_MediAlert_"
            );
        }

        return $response;
    });

    // ── Récupérer la mesure depuis take_id ──
    Route::get('/measure-take/{takeId}', function ($takeId) {
        $take = \App\Models\MeasureTake::with('measure')->find($takeId);
        if (!$take) return response()->json(null, 404);
        return response()->json($take->measure);
    });

    // ── Confirmation mesure → envoyer WhatsApp ──
    Route::post('/measures/result/confirm', function (Request $request) {
        $user      = $request->user();
        $telephone = \App\Helpers\NotificationHelper::telephoneDestinataire($user);
        $nom       = $request->nom ?? 'Mesure';

        \App\Helpers\NotificationHelper::envoyerWhatsApp(
            $telephone,
            "✅ *Mesure enregistrée !*\n\n« {$nom} » enregistrée avec succès.\n\n_MediAlert_"
        );

        return response()->json(['message' => 'WhatsApp envoyé']);
    });

    // ── Test WhatsApp ──
    Route::get('/test-notif', function (Request $request) {
        $user = $request->user();
        \App\Helpers\NotificationHelper::envoyerWhatsApp(
            $user->telephone,
            "✅ Test WhatsApp\n\nVos notifications fonctionnent !\n\n_MediAlert_"
        );
        return response()->json(['message' => 'WhatsApp envoyé !']);
    });

});
