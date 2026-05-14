<?php

namespace App\Http\Controllers;

use App\Models\ResponsablePatient;
use App\Services\PushNotificationService;
use Illuminate\Http\Request;

class ResponsablePatientController extends Controller
{
    // Liste des responsables
    public function index()
    {
        return response()->json(
            ResponsablePatient::where('patient_id', auth()->id())
                               ->orderBy('ordre')
                               ->get()
        );
    }

    // Ajouter un responsable remplaçant (max 2)
    public function store(Request $request)
    {
        $request->validate([
            'email_responsable' => 'required|email',
        ]);

        $count = ResponsablePatient::where('patient_id', auth()->id())->count();

        if ($count >= 2) {
            return response()->json(
                ['message' => 'Maximum 2 responsables autorisés'], 422
            );
        }

        $resp = ResponsablePatient::create([
            'patient_id'        => auth()->id(),
            'email_responsable' => $request->email_responsable,
            'ordre'             => $count + 1,
            'is_active'         => true,
        ]);

        return response()->json($resp, 201);
    }

    // Activer / désactiver un responsable
    public function toggle($id)
    {
        $resp = ResponsablePatient::where('id',         $id)
                                   ->where('patient_id', auth()->id())
                                   ->firstOrFail();

        $resp->update(['is_active' => !$resp->is_active]);

        $push    = app(PushNotificationService::class);
        $patient = auth()->user();

        $push->sendToEmail(
            $resp->email_responsable,
            $resp->is_active ? '✅ Vous êtes maintenant actif' : '⏸ Vous avez été désactivé',
            $resp->is_active
                ? "Vous recevrez les notifications de {$patient->prenom} {$patient->nom}"
                : "Vous ne recevrez plus les notifications de {$patient->prenom} {$patient->nom}",
            '/'
        );

        return response()->json($resp);
    }
}
