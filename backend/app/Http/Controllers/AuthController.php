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

        // Si une image est envoyée
        if ($request->hasFile('image')) {
            // Enregistre l'image dans le dossier 'storage/app/public/profiles'
            $path = $request->file('image')->store('profiles', 'public');
            // Sauvegarde le chemin dans la base de données
            $user->profile_image = $path;
        }

        $user->update([
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'age' => $request->age,
            'maladies' => $request->maladies,
            'profil_image'=>$path,
            'notification_type' => $request->notificationType,
            'contact_alerte_email' => $request->contactAlerte,
            'is_profile_complete' => true,
        ]);

        return response()->json([
            'message' => 'Profil et image mis à jour !',
            'user' => $user,
            // On renvoie l'URL complète de l'image
            'image_url' => $user->profile_image ? asset('storage/' . $user->profile_image) : null
        ]);

    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}
}