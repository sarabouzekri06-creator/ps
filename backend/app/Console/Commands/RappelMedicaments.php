<?php
// app/Console/Commands/RappelMedicaments.php

namespace App\Console\Commands;

use App\Helpers\NotificationHelper;
use App\Models\Manquement;
use App\Models\MediTake;
use App\Models\MedicationTakeLog;
use Illuminate\Console\Command;

class RappelMedicaments extends Command
{
    protected $signature   = 'rappel:medicaments';
    protected $description = 'Envoyer les rappels médicaments par WhatsApp';

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

            // ── 1. Ne pas envoyer si notif déjà envoyée aujourd'hui ──
            if ($take->notif_sent_date === today()->toDateString()) continue;

            // ── 2. Ne pas envoyer si déjà pris aujourd'hui ──
            $dejaConfirme = MedicationTakeLog::where('take_id', $take->id)
                ->where('user_id', $user->id)
                ->whereDate('created_at', today())
                ->exists();
            if ($dejaConfirme) continue;

            $telephone = NotificationHelper::telephoneDestinataire($user);
            $nom       = $medication->medication_name;
            $dose      = $take->dose ? $take->dose . ' ' . $take->unit : '';
            $lien      = env('APP_FRONTEND_URL', 'http://localhost:3000') . '/dashboard?take_id=' . $take->id . '&type=medicament';

            NotificationHelper::envoyerWhatsApp(
                $telephone,
                "💊 *Rappel médicament*\n\nHeure de prendre : *{$nom}*" . ($dose ? "\nDose : {$dose}" : '') . "\n\n👉 Confirmer la prise :\n" . $lien . "\n\n_MediAlert_"
            );

            // ── 3. Marquer notif comme envoyée aujourd'hui ──
            $take->update(['notif_sent_date' => today()]);

            // ── 4. Vérifier les manquements ──
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

        $this->info('Rappels médicaments envoyés : ' . $takes->count());
    }
}
