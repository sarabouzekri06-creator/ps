<?php

namespace App\Console\Commands;

use App\Helpers\NotificationHelper;
use App\Models\Manquement;
use App\Models\MediTake;
use Illuminate\Console\Command;

class RappelMedicaments extends Command
{
    protected $signature   = 'rappel:medicaments';
    protected $description = 'Envoyer les rappels pour les médicaments';

    public function handle()
    {
        $maintenant   = now()->format('H:i:s');
        $ilYaUnMinute = now()->subMinute()->format('H:i:s');

        $takes = MediTake::with(['medication.user'])
            ->whereBetween('take_time', [$ilYaUnMinute, $maintenant])
            ->get();

        foreach ($takes as $take) {
            $medication = $take->medication;
            if (!$medication) continue;

            $user = $medication->user;
            if (!$user) continue;

            $email = NotificationHelper::emailDestinataire($user);
            $nom   = $medication->medication_name;
            $dose  = $take->dose ? $take->dose . ' ' . $take->unit : '';

            $imageUrl = $medication->medication_image
                ? config('app.url') . '/storage/' . $medication->medication_image
                : null;

            $url = '/?take_id=' . $take->id . '&type=medicament';

            NotificationHelper::envoyerPush(
                $email,
                '💊 ' . $nom,
                "Heure de prendre" . ($dose ? " : {$dose}" : ''),
                $imageUrl,
                $url
            );

            $nbManquements = Manquement::where('patient_id', $user->id)
                ->where('type',   'medicament')
                ->where('ref_id', $take->id)
                ->where('date',   '>=', now()->subDays(7))
                ->count();

            if ($nbManquements > 2) {
                $dejaEnvoye = Manquement::where('patient_id', $user->id)
                    ->where('type',         'medicament')
                    ->where('ref_id',       $take->id)
                    ->where('email_envoye', true)
                    ->where('date',         '>=', now()->subDays(7))
                    ->exists();

                if (!$dejaEnvoye) {
                    NotificationHelper::envoyerEmail(
                        $email,
                        "Manquements — {$nom}",
                        "Bonjour,\n\nLe médicament « {$nom} » a été manqué plus de 2 fois cette semaine.\n\nL'équipe MediAlert"
                    );

                    Manquement::where('patient_id', $user->id)
                        ->where('type',   'medicament')
                        ->where('ref_id', $take->id)
                        ->update(['email_envoye' => true]);
                }
            }
        }

        $this->info('Rappels médicaments envoyés : ' . $takes->count());
    }
}
