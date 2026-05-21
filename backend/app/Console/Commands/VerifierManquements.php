<?php
// app/Console/Commands/VerifierManquements.php
// Cette commande tourne toutes les minutes
// Elle vérifie les takes dont l'heure est passée depuis 30 minutes
// et qui n'ont pas été confirmés (status = pending)

namespace App\Console\Commands;

use App\Helpers\NotificationHelper;
use App\Models\Manquement;
use App\Models\MediTake;
use Illuminate\Console\Command;

class VerifierManquements extends Command
{
    protected $signature   = 'verifier:manquements';
    protected $description = 'Enregistrer les manquements pour les prises non confirmées';

    // Délai en minutes avant de considérer comme manqué
    const DELAI_MINUTES = 30;

    public function handle()
    {
        $limite     = now()->subMinutes(self::DELAI_MINUTES)->format('H:i:s');
        $debutJour  = '00:00:00';

        // Chercher les takes d'aujourd'hui dont :
        // - l'heure est passée depuis plus de 30 minutes
        // - le status est encore "pending" (pas confirmé)
        $takes = MediTake::with(['medication.user'])
            ->whereBetween('take_time', [$debutJour, $limite])
            ->where('status', 'pending')
            ->get();

        foreach ($takes as $take) {
            $medication = $take->medication;
            if (!$medication) continue;

            $user = $medication->user;
            if (!$user) continue;

            // Enregistrer le manquement (une seule fois par jour)
            Manquement::firstOrCreate([
                'patient_id' => $user->id,
                'type'       => 'medicament',
                'ref_id'     => $take->id,
                'date'       => today(),
            ]);

            // Compter les manquements sur 7 jours
            $nbManquements = Manquement::where('patient_id', $user->id)
                ->where('type',   'medicament')
                ->where('ref_id', $take->id)
                ->where('date',   '>=', now()->subDays(7))
                ->count();

            // Plus de 2 manquements → email d'alerte
            if ($nbManquements > 2) {
                $dejaEnvoye = Manquement::where('patient_id', $user->id)
                    ->where('type',         'medicament')
                    ->where('ref_id',       $take->id)
                    ->where('email_envoye', true)
                    ->where('date',         '>=', now()->subDays(7))
                    ->exists();

                if (!$dejaEnvoye) {
                    $email = NotificationHelper::emailDestinataire($user);
                    $nom   = $medication->medication_name;

                    NotificationHelper::envoyerEmail(
                        $email,
                        "Manquements — {$nom}",
                        "Bonjour,\n\nLe médicament « {$nom} » a été manqué plus de 2 fois cette semaine.\n\nL'équipe MediAlert"
                    );

                    NotificationHelper::envoyerPush(
                        $email,
                        '⚠️ Manquements répétés',
                        "{$nom} manqué plus de 2 fois cette semaine"
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
