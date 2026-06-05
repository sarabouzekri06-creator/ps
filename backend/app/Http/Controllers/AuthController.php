<?php

namespace App\Http\Controllers;

use App\Models\Utilisateur;
use App\Models\ResponsablePatient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class AuthController extends Controller
{
    // ── INSCRIPTION ──────────────────────────────────────────────
    public function register(Request $request)
    {
        $fields = $request->validate([
            'email'    => 'required|string|unique:utilisateurs,email',
            'password' => 'required|string|confirmed',
        ]);

        $user = Utilisateur::create([
            'email'               => $fields['email'],
            'password'            => Hash::make($fields['password']),
            'is_profile_complete' => false,
        ]);

        $token = $user->createToken('myapptoken')->plainTextToken;

        return response(['user' => $user, 'token' => $token], 201);
    }

    // ── CONNEXION ─────────────────────────────────────────────────
    public function login(Request $request)
    {
        $fields = $request->validate([
            'email'    => 'required|string',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($fields)) {
            return response(['message' => 'Identifiants incorrects'], 401);
        }

        $user  = Auth::user();
        $token = $user->createToken('myapptoken')->plainTextToken;

        return response(['user' => $user, 'token' => $token], 200);
    }

    // ── DÉCONNEXION ───────────────────────────────────────────────
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnecté avec succès']);
    }

    // ── PROFIL CONNECTÉ ───────────────────────────────────────────
    public function me(Request $request)
    {
        $user = $request->user();

        $responsables = ResponsablePatient::where('patient_id', $user->id)
                                           ->orderBy('ordre')
                                           ->get();

        // Séparer responsable principal et remplaçant
        $responsable2 = $responsables->firstWhere('ordre', 2);

        return response()->json([
            'user'          => $user,
            'responsables'  => $responsables,
            'responsable2'  => $responsable2, // ← utilisé par le frontend
        ]);
    }

    // ── MISE À JOUR DU PROFIL ─────────────────────────────────────
    public function updateProfile(Request $request)
    {
        try {
            $user = $request->user();
            $path = $user->profile_image;

            if ($request->hasFile('image')) {
                if ($path) Storage::disk('public')->delete($path);
                $path = $request->file('image')->store('profiles', 'public');
            }

            $user->update([
                'nom'                  => $request->nom,
                'prenom'               => $request->prenom,
                'age'                  => $request->age,
                'maladies'             => $request->maladies,
                'telephone'            => $request->telephone,
                'profile_image'        => $path,
                'notification_type'    => $request->notificationType,
                'contact_alerte_email' => $request->contactAlerte,
                'is_profile_complete'  => true,
            ]);

            // Si mode responsable, enregistrer le téléphone comme responsable principal
            if ($request->notificationType === 'responsable' && $request->telephone) {
                ResponsablePatient::updateOrCreate(
                    [
                        'patient_id' => $user->id,
                        'ordre'      => 1,
                    ],
                    [
                        'telephone_responsable' => $request->telephone,
                        'email_responsable'     => $request->contactAlerte ?? null,
                        'is_active'             => true,
                    ]
                );
            }

            return response()->json([
                'message'   => 'Profil mis à jour avec succès !',
                'user'      => $user->fresh(),
                'image_url' => $path ? asset('storage/' . $path) : null,
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
