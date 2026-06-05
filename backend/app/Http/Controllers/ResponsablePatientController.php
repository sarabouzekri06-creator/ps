<?php

namespace App\Http\Controllers;

use App\Models\ResponsablePatient;
// use App\Services\PushNotificationService;
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

    // Ajouter le responsable remplaçant (ordre 2 uniquement)
    public function store(Request $request)
    {
        $request->validate([
            'telephone_responsable' => 'required|string',
        ]);

        // Vérifier si un remplaçant (ordre 2) existe déjà
        $exists = ResponsablePatient::where('patient_id', auth()->id())
                                     ->where('ordre', 2)
                                     ->first();

        if ($exists) {
            return response()->json(
                ['message' => 'Un remplaçant existe déjà. Modifiez-le plutôt.'], 422
            );
        }

        $resp = ResponsablePatient::create([
            'patient_id'            => auth()->id(),
            'telephone_responsable' => $request->telephone_responsable,
            'ordre'                 => 2,
            'is_active'             => true,
        ]);

        return response()->json($resp, 201);
    }

    // Modifier le numéro du responsable remplaçant
    public function update(Request $request, $id)
    {
        $request->validate([
            'telephone_responsable' => 'required|string',
        ]);

        $resp = ResponsablePatient::where('id',         $id)
                                   ->where('patient_id', auth()->id())
                                   ->firstOrFail();

        $resp->update([
            'telephone_responsable' => $request->telephone_responsable,
        ]);

        return response()->json($resp);
    }

    // Activer / désactiver un responsable
    public function toggle($id)
    {
        $resp = ResponsablePatient::where('id',         $id)
                                   ->where('patient_id', auth()->id())
                                   ->firstOrFail();

        $resp->update(['is_active' => !$resp->is_active]);



        return response()->json($resp);
    }

    // Supprimer le responsable remplaçant (ordre 2 uniquement)
    public function destroy($id)
    {
        $resp = ResponsablePatient::where('id',         $id)
                                   ->where('patient_id', auth()->id())
                                   ->where('ordre',      2)
                                   ->firstOrFail();

        $resp->delete();

        return response()->json(['message' => 'Responsable remplaçant supprimé.']);
    }
}
