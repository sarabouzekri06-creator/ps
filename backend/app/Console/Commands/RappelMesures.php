<?php
// app/Console/Commands/RappelMesures.php

namespace App\Console\Commands;

use App\Helpers\NotificationHelper;
use App\Models\Manquement;
use App\Models\MeasureTake;
use Illuminate\Console\Command;

class RappelMesures extends Command
{
    protected $signature   = 'rappel:mesures';
    protected $description = 'Envoyer les rappels mesures par WhatsApp';

    public function handle()
    {
        $maintenant   = now()->format('H:i:s');
        $ilYaUnMinute = now()->subMinute()->format('H:i:s');

        $takes = MeasureTake::with(['measure.user'])
            ->whereBetween('take_time', [$ilYaUnMinute, $maintenant])
            ->get();

        foreach ($takes as $take) {
            $measure = $take->measure;
            if (!$measure) continue;

            $user = $measure->user;
            if (!$user) continue;

            // ── 1. Ne pas envoyer si notif déjà envoyée aujourd'hui ──
            if ($take->notif_sent_date === today()->toDateString()) continue;

            $telephone = NotificationHelper::telephoneDestinataire($user);
            $nom       = $measure->disease_name;
            $lien      = env('APP_FRONTEND_URL', 'http://localhost:3000') . '/dashboard?take_id=' . $take->id . '&type=measure';

            NotificationHelper::envoyerWhatsApp(
                $telephone,
                "📊 *Rappel mesure*\n\nHeure de prendre votre mesure : *{$nom}*\n\n👉 Saisir la mesure :\n{$lien}\n\n_MediAlert_"
            );

            // ── 2. Marquer notif comme envoyée aujourd'hui ──
            $take->update(['notif_sent_date' => today()]);

            // ── 3. Vérifier les manquements ──
            $nbManquements = Manquement::where('patient_id', $user->id)
                ->where('type',   'mesure')
                ->where('ref_id', $take->id)
                ->where('date',   '>=', now()->subDays(7))
                ->count();

            if ($nbManquements > 2) {
                $dejaEnvoye = Manquement::where('patient_id', $user->id)
                    ->where('type',         'mesure')
                    ->where('ref_id',       $take->id)
                    ->where('email_envoye', true)
                    ->where('date',         '>=', now()->subDays(7))
                    ->exists();

                if (!$dejaEnvoye) {
                    NotificationHelper::envoyerWhatsApp(
                        $telephone,
                        "⚠️ *Alerte manquements*\n\n« {$nom} » manquée plus de 2 fois cette semaine.\n\n_MediAlert_"
                    );

                    Manquement::where('patient_id', $user->id)
                        ->where('type',   'mesure')
                        ->where('ref_id', $take->id)
                        ->update(['email_envoye' => true]);
                }
            }
        }

        $this->info('Rappels mesures envoyés : ' . $takes->count());
    }
}
