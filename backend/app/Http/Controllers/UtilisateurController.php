<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable; // Important
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens; // Important pour les tokens

class Utilisateur extends Authenticatable // Change "Model" par "Authenticatable"
{
    use HasApiTokens, Notifiable;

    protected $table = 'utilisateurs'; // Force l'utilisation de la table 'users'

    protected $fillable = [
        'email', 'password', 'nom', 'prenom', 'age', 
        'maladies', 'profile_image', 'notification_type', 
        'contact_alerte_email', 'is_profile_complete',
    ];

    protected $hidden = ['password', 'remember_token'];
}