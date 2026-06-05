<?php
// app/Helpers/NotificationHelper.php

namespace App\Helpers;

use Illuminate\Support\Facades\Log;
use Twilio\Rest\Client;

class NotificationHelper
{
    // ── Envoyer un message WhatsApp ───────────────────────────────
    public static function envoyerWhatsApp($telephone, $message)
    {
         $telephone = str_replace(' ', '', $telephone);
        if (!$telephone) {
            Log::info("Pas de téléphone pour envoyer WhatsApp");
            return;
        }

        try {
            $twilio = new Client(env('TWILIO_SID'), env('TWILIO_TOKEN'));

            $twilio->messages->create(
                'whatsapp:' . $telephone,
                [
                    'from' => env('TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886'),
                    'body' => $message,
                ]
            );

            Log::info("WhatsApp envoyé à : $telephone");

        } catch (\Exception $e) {
            Log::error("Erreur WhatsApp : " . $e->getMessage());
        }
    }

    // ── Trouver le bon téléphone selon le profil du user ─────────
    public static function telephoneDestinataire($user)
    {
        if ($user->notification_type === 'patient') {
            return $user->telephone;
        }

        // Mode responsable : chercher dans responsables_patient
        $responsable = \DB::table('responsables_patient')
            ->where('patient_id', $user->id)
            ->where('is_active', true)
            ->orderBy('ordre')
            ->first();

        // Si le responsable a un téléphone → l'utiliser
        // Sinon → utiliser le téléphone du patient
        return $responsable?->telephone ?? $user->telephone;
    }
}
