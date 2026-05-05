<?php

namespace App\Http\Controllers;

use App\Models\Utilisateur; // AJOUTE CETTE LIGNE
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function register(Request $request) {
        $fields = $request->validate([
            'email' => 'required|string|unique:users,email',
            'password' => 'required|string|confirmed'
        ]);

        // Utilise le nom exact du modèle : Utilisateur
      $user = Utilisateur::create([
    'email' => $fields['email'],
    'password' => Hash::make($fields['password']), // Utilisation de Hash::make
    'is_profile_complete' => false
]);

        $token = $user->createToken('myapptoken')->plainTextToken;

        return response(['user' => $user, 'token' => $token], 201);
    }

    // N'oublie pas d'ajouter la fonction login sinon ta route api.php plantera
   public function login(Request $request) {
    $fields = $request->validate([
        'email' => 'required|string',
        'password' => 'required|string'
    ]);

    // Tentative de connexion
    if (!Auth::attempt($fields)) {
        return response(['message' => 'Identifiants incorrects'], 401);
    }

    $user = Auth::user();
    $token = $user->createToken('myapptoken')->plainTextToken;

    return response(['user' => $user, 'token' => $token], 200);
}
public function updateProfile(Request $request) {
    try {
        $user = $request->user();

        // 1. On initialise $path avec la valeur actuelle pour éviter l'erreur "Undefined variable"
        // On récupère l'image déjà existante si aucune nouvelle n'est envoyée
        $path = $user->profile_image;

        // 2. Gestion de la nouvelle image
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('profiles', 'public');
            // Optionnel : tu peux supprimer l'ancienne image ici si tu veux gagner de l'espace
        }

        // 3. Mise à jour globale
        // ATTENTION : Vérifie bien si ta colonne s'appelle 'profile_image' ou 'profil_image'
        $user->update([
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'age' => $request->age,
            'maladies' => $request->maladies,
            'profile_image' => $path, // Utilisation de la variable sécurisée
            'notification_type' => $request->notificationType,
            'contact_alerte_email' => $request->contactAlerte,
            'is_profile_complete' => true,
        ]);

        return response()->json([
            'message' => 'Profil mis à jour avec succès !',
            'user' => $user->fresh(), // .fresh() pour récupérer les données à jour
            'image_url' => $path ? asset('storage/' . $path) : null
        ]);

    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}
}
