<?php
// app/Console/Commands/VerifierManquements.php

namespace App\Console\Commands;

use App\Helpers\NotificationHelper;
use App\Models\Manquement;
use App\Models\MediTake;
use Illuminate\Console\Command;

class VerifierManquements extends Command
{
    protected $signature   = 'verifier:manquements';
    protected $description = 'Enregistrer les manquements pour prises non confirmées';

    const DELAI_MINUTES = 30;

    public function handle()
    {
        $limite = now()->subMinutes(self::DELAI_MINUTES)->format('H:i:s');

        $takes = MediTake::with(['medication.user'])
            ->whereBetween('take_time', ['00:00:00', $limite])
            ->where('status', 'pending')
            ->get();

        foreach ($takes as $take) {
            $medication = $take->medication;
            if (!$medication) continue;

            $user = $medication->user;
            if (!$user) continue;

            Manquement::firstOrCreate([
                'patient_id' => $user->id,
                'type'       => 'medicament',
                'ref_id'     => $take->id,
                'date'       => today(),
            ]);

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
                    $telephone = NotificationHelper::telephoneDestinataire($user);
                    $nom       = $medication->medication_name;

                    NotificationHelper::envoyerWhatsApp(
                        $telephone,
                        "⚠️ *Alerte manquements*\n\n« {$nom} » manqué plus de 2 fois cette semaine.\n\n_MediAlert_"
                    );

                    Manquement::where('patient_id', $user->id)
                        ->where('type',   'medicament')
                        ->where('ref_id', $take->id)
                        ->update(['email_envoye' => true]);
                }
            }
        }

        $this->info('Manquements vérifiés : ' . $takes->count());
    }
}
