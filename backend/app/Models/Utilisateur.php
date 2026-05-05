<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Utilisateur extends Authenticatable
{
    use HasApiTokens, Notifiable, HasFactory;

    protected $table = 'utilisateurs'; // Indique à Laravel d'utiliser ta table

    protected $fillable = [
        'email',
        'password',
        'nom',
        'prenom',
        'age',
        'maladies',
        'profile_image',
        'notification_type',
        'contact_alerte_email',
        'is_profile_complete',
    ];

    public function userNotifications()
{
    // On précise bien qu'on utilise 'user_id' comme lien
    return $this->hasMany(Notification::class, 'user_id');
}

    protected $hidden = [
        'password',
        'remember_token',
    ];
}
