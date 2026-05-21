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
    protected $description = 'Envoyer les rappels pour les mesures';

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

            $email = NotificationHelper::emailDestinataire($user);
            $nom   = $measure->disease_name;

            // URL avec take_id et type=mesure pour ouvrir le modal saisie
            $url = '/?take_id=' . $take->id . '&type=mesure';

            NotificationHelper::envoyerPush(
                $email,
                '📊 ' . $nom,
                "Heure de prendre votre mesure",
                null,
                $url
            );

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
                    NotificationHelper::envoyerEmail(
                        $email,
                        "Manquements — {$nom}",
                        "Bonjour,\n\nLa mesure « {$nom} » a été manquée plus de 2 fois cette semaine.\n\nL'équipe MediAlert"
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
