<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Utilisateur extends Authenticatable
{
    use HasApiTokens, Notifiable, HasFactory;

    protected $table    = 'utilisateurs';
    protected $fillable = [
        'email', 'password', 'nom', 'prenom', 'age',
        'maladies', 'profile_image', 'notification_type',
        'contact_alerte_email', 'is_profile_complete',
         'telephone', 
    ];
    protected $hidden = ['password', 'remember_token'];
    protected $casts  = [
        'is_profile_complete' => 'boolean',
    ];

    // Notifications de l'app (déjà existant)
    public function userNotifications()
    {
        return $this->hasMany(Notification::class, 'user_id');
    }

    // Responsables liés à ce patient
    public function responsablesPatient()
    {
        return $this->hasMany(ResponsablePatient::class, 'patient_id');
    }

    // Retourne l'email actif qui doit recevoir les notifs push
    public function emailActifPourNotif(): ?string
    {
        // Patient autonome → ses propres notifs
        if ($this->notification_type === 'patient') {
            return $this->email;
        }

        // Responsable → chercher le responsable actif
        $actif = ResponsablePatient::where('patient_id', $this->id)
                                    ->where('is_active',  true)
                                    ->orderBy('ordre')
                                    ->first();

        return $actif?->email_responsable ?? $this->contact_alerte_email;
    }
}
