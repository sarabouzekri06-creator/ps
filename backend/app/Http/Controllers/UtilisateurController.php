<?php

namespace App\Http\Controllers;

use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class UtilisateurController extends Controller
{
    // ── INSCRIPTION ──────────────────────────────────────────────
    public function register(Request $request)
    {
        $request->validate([
            'email'    => 'required|email|unique:utilisateurs,email',
            'password' => 'required|min:6',
        ]);

        $user = Utilisateur::create([
            'email'    => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $user,
        ], 201);
    }

    // ── CONNEXION ─────────────────────────────────────────────────
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = Utilisateur::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Identifiants incorrects'], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $user,
        ]);
    }

    // ── DÉCONNEXION ───────────────────────────────────────────────
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnecté avec succès']);
    }

    // ── RÉCUPÉRER L'UTILISATEUR CONNECTÉ ─────────────────────────
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    // ── METTRE À JOUR LE PROFIL ───────────────────────────────────
    public function update(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'nom'              => 'nullable|string|max:100',
            'prenom'           => 'nullable|string|max:100',
            'age'              => 'nullable|integer|min:1|max:120',
            'maladies'         => 'nullable|string',
            'notificationType' => 'nullable|in:patient,responsable',
            'contactAlerte'    => 'nullable|email',
            'image'            => 'nullable|image|max:2048',
        ]);

        // Upload image si fournie
        if ($request->hasFile('image')) {
            // Supprimer l'ancienne image
            if ($user->profile_image) {
                Storage::disk('public')->delete($user->profile_image);
            }
            $path = $request->file('image')->store('profiles', 'public');
            $user->profile_image = $path;
        }

        $user->nom                  = $request->nom                ?? $user->nom;
        $user->prenom               = $request->prenom             ?? $user->prenom;
        $user->age                  = $request->age                ?? $user->age;
        $user->maladies             = $request->maladies           ?? $user->maladies;
        $user->notification_type    = $request->notificationType   ?? $user->notification_type;
        $user->contact_alerte_email = $request->contactAlerte      ?? $user->contact_alerte_email;
        $user->is_profile_complete  = true;

        $user->save();

        return response()->json([
            'message' => 'Profil mis à jour',
            'user'    => $user,
        ]);
    }
}
