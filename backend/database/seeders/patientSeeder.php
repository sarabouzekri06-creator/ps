<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Medication;
use App\Models\MediTake;
use App\Models\MedicationTakeLog;
use App\Models\Notification;
use App\Models\Measure;
use App\Models\MeasureTake;
use App\Models\MeasureResult;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class patientSeeder extends Seeder
{
    public function run(): void
    {
        $userId = 1; // ← changer si nécessaire

        DB::transaction(function () use ($userId) {

            // ════════════════════════════════════════════════════════════
            // ██ MÉDICAMENTS
            // ════════════════════════════════════════════════════════════

            // 1. METFORMINE 500mg — daily x2
            $notif1 = Notification::create([
                'user_id'        => $userId,
                'type'           => 'medication',
                'start_day'      => now()->toDateString(),
                'number_of_days' => 36500,
                'frequency_type' => 'daily',
                'is_active'      => true,
            ]);
            $metformine = Medication::create([
                'user_id'         => $userId,
                'notification_id' => $notif1->id,
                'medication_name' => 'Metformine 500mg',
                'current_stock'   => 60,
                'comment'         => 'Avec repas — ne pas prendre à jeun',
                'is_active'       => true,
            ]);
            $take1a = MediTake::create(['medication_id' => $metformine->id, 'take_time' => '08:00', 'dose' => 1, 'unit' => 'Pill(s)']);
            $take1b = MediTake::create(['medication_id' => $metformine->id, 'take_time' => '20:00', 'dose' => 1, 'unit' => 'Pill(s)']);
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i);
                MedicationTakeLog::create(['user_id' => $userId, 'take_id' => $take1a->id, 'taken_at' => $date->copy()->setTime(8, 5),  'status' => 'taken']);
                MedicationTakeLog::create(['user_id' => $userId, 'take_id' => $take1b->id, 'taken_at' => $date->copy()->setTime(20, 10), 'status' => $i === 1 ? 'missed' : 'taken']);
            }

            // 2. RAMIPRIL 5mg — daily x1
            $notif2 = Notification::create(['user_id' => $userId, 'type' => 'medication', 'start_day' => now()->toDateString(), 'number_of_days' => 36500, 'frequency_type' => 'daily', 'is_active' => true]);
            $ramipril = Medication::create(['user_id' => $userId, 'notification_id' => $notif2->id, 'medication_name' => 'Ramipril 5mg', 'current_stock' => 30, 'comment' => 'Le matin à jeun de préférence', 'is_active' => true]);
            $take2 = MediTake::create(['medication_id' => $ramipril->id, 'take_time' => '08:00', 'dose' => 1, 'unit' => 'Pill(s)']);
            for ($i = 6; $i >= 0; $i--) {
                MedicationTakeLog::create(['user_id' => $userId, 'take_id' => $take2->id, 'taken_at' => Carbon::now()->subDays($i)->setTime(8, 3), 'status' => 'taken']);
            }

            // 3. AMLODIPINE 5mg — daily x1
            $notif3 = Notification::create(['user_id' => $userId, 'type' => 'medication', 'start_day' => now()->toDateString(), 'number_of_days' => 36500, 'frequency_type' => 'daily', 'is_active' => true]);
            $amlodipine = Medication::create(['user_id' => $userId, 'notification_id' => $notif3->id, 'medication_name' => 'Amlodipine 5mg', 'current_stock' => 30, 'comment' => 'Peut être pris avec ou sans repas', 'is_active' => true]);
            $take3 = MediTake::create(['medication_id' => $amlodipine->id, 'take_time' => '08:00', 'dose' => 1, 'unit' => 'Pill(s)']);
            for ($i = 6; $i >= 0; $i--) {
                MedicationTakeLog::create(['user_id' => $userId, 'take_id' => $take3->id, 'taken_at' => Carbon::now()->subDays($i)->setTime(8, 7), 'status' => 'taken']);
            }

            // 4. ATORVASTATINE 20mg — daily x1
            $notif4 = Notification::create(['user_id' => $userId, 'type' => 'medication', 'start_day' => now()->toDateString(), 'number_of_days' => 36500, 'frequency_type' => 'daily', 'is_active' => true]);
            $atorvastatine = Medication::create(['user_id' => $userId, 'notification_id' => $notif4->id, 'medication_name' => 'Atorvastatine 20mg', 'current_stock' => 30, 'comment' => 'Le soir au coucher — éviter le pamplemousse', 'is_active' => true]);
            $take4 = MediTake::create(['medication_id' => $atorvastatine->id, 'take_time' => '20:00', 'dose' => 1, 'unit' => 'Pill(s)']);
            for ($i = 6; $i >= 0; $i--) {
                MedicationTakeLog::create(['user_id' => $userId, 'take_id' => $take4->id, 'taken_at' => Carbon::now()->subDays($i)->setTime(20, 15), 'status' => $i === 3 ? 'missed' : 'taken']);
            }

            // 5. ALENDRONATE 70mg — weekly (Lundi)
            $notif5 = Notification::create(['user_id' => $userId, 'type' => 'medication', 'start_day' => now()->toDateString(), 'number_of_days' => 36500, 'frequency_type' => 'weekly', 'frequency_details' => json_encode(['Lun']), 'is_active' => true]);
            $alendronate = Medication::create(['user_id' => $userId, 'notification_id' => $notif5->id, 'medication_name' => 'Alendronate 70mg', 'current_stock' => 4, 'comment' => 'Le lundi matin à jeun — rester debout 30 min après', 'is_active' => true]);
            $take5 = MediTake::create(['medication_id' => $alendronate->id, 'take_time' => '07:00', 'dose' => 1, 'unit' => 'Pill(s)']);
            for ($i = 0; $i < 4; $i++) {
                $monday = Carbon::now()->previous(Carbon::MONDAY)->subWeeks($i);
                MedicationTakeLog::create(['user_id' => $userId, 'take_id' => $take5->id, 'taken_at' => $monday->copy()->setTime(7, 10), 'status' => 'taken']);
            }

            // 6. VITAMINE D — monthly (le 1er)
            $notif6 = Notification::create(['user_id' => $userId, 'type' => 'medication', 'start_day' => now()->toDateString(), 'number_of_days' => 36500, 'frequency_type' => 'monthly', 'frequency_details' => json_encode(['day' => 1]), 'is_active' => true]);
            $vitamineD = Medication::create(['user_id' => $userId, 'notification_id' => $notif6->id, 'medication_name' => 'Vitamine D Uvedose', 'current_stock' => 3, 'comment' => "Le 1er de chaque mois — avaler l'ampoule directement", 'is_active' => true]);
            $take6 = MediTake::create(['medication_id' => $vitamineD->id, 'take_time' => '08:00', 'dose' => 1, 'unit' => 'Pill(s)']);
            for ($i = 0; $i < 3; $i++) {
                MedicationTakeLog::create(['user_id' => $userId, 'take_id' => $take6->id, 'taken_at' => Carbon::now()->subMonths($i)->startOfMonth()->setTime(8, 0), 'status' => 'taken']);
            }

            // ════════════════════════════════════════════════════════════
            // ██ MESURES
            // ════════════════════════════════════════════════════════════

            // 1. GLYCÉMIE — daily — min: 0.7  max: 1.4
            $mnotif1 = Notification::create([
                'user_id'        => $userId,
                'type'           => 'measure',
                'start_day'      => now()->toDateString(),
                'number_of_days' => 36500,
                'frequency_type' => 'daily',
                'is_active'      => true,
            ]);
            $glycemie = Measure::create([
                'user_id'         => $userId,
                'notification_id' => $mnotif1->id,
                'disease_name'    => 'Glycémie',
                'severity'        => 'High',
                'unit'            => 'g/L',
                'min_target'      => 0.7,
                'max_target'      => 1.4,
                'comment'         => 'Mesurer à jeun le matin',
            ]);
            MeasureTake::create(['measure_id' => $glycemie->id, 'take_time' => '08:00', 'label' => 'Matin']);
            MeasureTake::create(['measure_id' => $glycemie->id, 'take_time' => '12:00', 'label' => 'Midi']);
            MeasureTake::create(['measure_id' => $glycemie->id, 'take_time' => '18:00', 'label' => 'Soir']);
            // Historique — 14 derniers jours
            $glycemieValues = [0.95, 1.02, 1.45, 0.88, 1.20, 0.75, 1.38, 0.92, 1.10, 0.85, 1.50, 0.98, 1.15, 0.90];
            for ($i = 13; $i >= 0; $i--) {
                MeasureResult::create([
                    'measure_id' => $glycemie->id,
                    'value'      => $glycemieValues[$i],
                    'note'       => $i === 11 ? 'Après repas copieux' : null,
                    'created_at' => Carbon::now()->subDays($i)->setTime(8, 10),
                    'updated_at' => Carbon::now()->subDays($i)->setTime(8, 10),
                ]);
            }

            // 2. TENSION ARTÉRIELLE — daily — min: 80  max: 140
            $mnotif2 = Notification::create([
                'user_id'        => $userId,
                'type'           => 'measure',
                'start_day'      => now()->toDateString(),
                'number_of_days' => 36500,
                'frequency_type' => 'daily',
                'is_active'      => true,
            ]);
            $tension = Measure::create([
                'user_id'         => $userId,
                'notification_id' => $mnotif2->id,
                'disease_name'    => 'Tension artérielle',
                'severity'        => 'High',
                'unit'            => 'mmHg',
                'min_target'      => 80,
                'max_target'      => 140,
                'comment'         => 'Mesurer assis, au repos 5 min',
            ]);
            MeasureTake::create(['measure_id' => $tension->id, 'take_time' => '08:00', 'label' => 'Matin']);
            MeasureTake::create(['measure_id' => $tension->id, 'take_time' => '20:00', 'label' => 'Soir']);
            $tensionValues = [135, 128, 142, 130, 145, 125, 138, 132, 127, 148, 131, 129, 136, 133];
            for ($i = 13; $i >= 0; $i--) {
                MeasureResult::create([
                    'measure_id' => $tension->id,
                    'value'      => $tensionValues[$i],
                    'note'       => in_array($i, [9, 4]) ? 'Stress au travail' : null,
                    'created_at' => Carbon::now()->subDays($i)->setTime(8, 15),
                    'updated_at' => Carbon::now()->subDays($i)->setTime(8, 15),
                ]);
            }

            // 3. POIDS — weekly (Lundi) — pas de min/max
            $mnotif3 = Notification::create([
                'user_id'           => $userId,
                'type'              => 'measure',
                'start_day'         => now()->toDateString(),
                'number_of_days'    => 36500,
                'frequency_type'    => 'weekly',
                'frequency_details' => json_encode(['Lun']),
                'is_active'         => true,
            ]);
            $poids = Measure::create([
                'user_id'         => $userId,
                'notification_id' => $mnotif3->id,
                'disease_name'    => 'Poids',
                'severity'        => 'Moderate',
                'unit'            => 'kg',
                'min_target'      => null,
                'max_target'      => null,
                'comment'         => 'Le lundi matin à jeun',
            ]);
            MeasureTake::create(['measure_id' => $poids->id, 'take_time' => '07:30', 'label' => 'Matin']);
            $poidsValues = [88.5, 88.2, 87.9, 88.0, 87.7, 87.5, 87.3, 87.1];
            for ($i = 0; $i < 8; $i++) {
                $monday = Carbon::now()->previous(Carbon::MONDAY)->subWeeks($i);
                MeasureResult::create([
                    'measure_id' => $poids->id,
                    'value'      => $poidsValues[$i],
                    'note'       => null,
                    'created_at' => $monday->copy()->setTime(7, 35),
                    'updated_at' => $monday->copy()->setTime(7, 35),
                ]);
            }

            // 4. HbA1c — quarterly (le 15) — max: 7
            $mnotif4 = Notification::create([
                'user_id'           => $userId,
                'type'              => 'measure',
                'start_day'         => now()->toDateString(),
                'number_of_days'    => 36500,
                'frequency_type'    => 'quarterly',
                'frequency_details' => json_encode(['day' => 15]),
                'is_active'         => true,
            ]);
            $hba1c = Measure::create([
                'user_id'         => $userId,
                'notification_id' => $mnotif4->id,
                'disease_name'    => 'HbA1c',
                'severity'        => 'High',
                'unit'            => '%',
                'min_target'      => null,
                'max_target'      => 7,
                'comment'         => 'Bilan trimestriel diabète',
            ]);
            MeasureTake::create(['measure_id' => $hba1c->id, 'take_time' => '08:00', 'label' => 'Bilan']);
            $hba1cValues = [7.8, 7.2, 6.9, 7.1];
            for ($i = 0; $i < 4; $i++) {
                MeasureResult::create([
                    'measure_id' => $hba1c->id,
                    'value'      => $hba1cValues[$i],
                    'note'       => $i === 0 ? 'Valeur élevée — régime renforcé' : null,
                    'created_at' => Carbon::now()->subMonths($i * 3)->setDay(15)->setTime(9, 0),
                    'updated_at' => Carbon::now()->subMonths($i * 3)->setDay(15)->setTime(9, 0),
                ]);
            }

            // 5. CHOLESTÉROL — quarterly (le 15) — max: 2
            $mnotif5 = Notification::create([
                'user_id'           => $userId,
                'type'              => 'measure',
                'start_day'         => now()->toDateString(),
                'number_of_days'    => 36500,
                'frequency_type'    => 'quarterly',
                'frequency_details' => json_encode(['day' => 15]),
                'is_active'         => true,
            ]);
            $cholesterol = Measure::create([
                'user_id'         => $userId,
                'notification_id' => $mnotif5->id,
                'disease_name'    => 'Cholestérol total',
                'severity'        => 'Moderate',
                'unit'            => 'g/L',
                'min_target'      => null,
                'max_target'      => 2,
                'comment'         => 'Bilan lipidique trimestriel',
            ]);
            MeasureTake::create(['measure_id' => $cholesterol->id, 'take_time' => '08:00', 'label' => 'Bilan']);
            $cholValues = [2.1, 1.95, 1.88, 1.92];
            for ($i = 0; $i < 4; $i++) {
                MeasureResult::create([
                    'measure_id' => $cholesterol->id,
                    'value'      => $cholValues[$i],
                    'note'       => $i === 0 ? 'Légèrement élevé' : null,
                    'created_at' => Carbon::now()->subMonths($i * 3)->setDay(15)->setTime(9, 10),
                    'updated_at' => Carbon::now()->subMonths($i * 3)->setDay(15)->setTime(9, 10),
                ]);
            }

            // 6. CRÉATININE — quarterly (le 15) — min: 60  max: 110
            $mnotif6 = Notification::create([
                'user_id'           => $userId,
                'type'              => 'measure',
                'start_day'         => now()->toDateString(),
                'number_of_days'    => 36500,
                'frequency_type'    => 'quarterly',
                'frequency_details' => json_encode(['day' => 15]),
                'is_active'         => true,
            ]);
            $creatinine = Measure::create([
                'user_id'         => $userId,
                'notification_id' => $mnotif6->id,
                'disease_name'    => 'Créatinine',
                'severity'        => 'Moderate',
                'unit'            => 'µmol/L',
                'min_target'      => 60,
                'max_target'      => 110,
                'comment'         => 'Surveillance fonction rénale',
            ]);
            MeasureTake::create(['measure_id' => $creatinine->id, 'take_time' => '08:00', 'label' => 'Bilan']);
            $creatValues = [95, 88, 92, 85];
            for ($i = 0; $i < 4; $i++) {
                MeasureResult::create([
                    'measure_id' => $creatinine->id,
                    'value'      => $creatValues[$i],
                    'note'       => null,
                    'created_at' => Carbon::now()->subMonths($i * 3)->setDay(15)->setTime(9, 20),
                    'updated_at' => Carbon::now()->subMonths($i * 3)->setDay(15)->setTime(9, 20),
                ]);
            }
        });

        $this->command->info("✅ Données d'Ahmed créées avec succès !");
        $this->command->info('');
        $this->command->info('── MÉDICAMENTS ──────────────────────');
        $this->command->info('   → Metformine 500mg    (daily x2)');
        $this->command->info('   → Ramipril 5mg        (daily x1)');
        $this->command->info('   → Amlodipine 5mg      (daily x1)');
        $this->command->info('   → Atorvastatine 20mg  (daily x1)');
        $this->command->info('   → Alendronate 70mg    (weekly - Lundi)');
        $this->command->info('   → Vitamine D Uvedose  (monthly - le 1er)');
        $this->command->info('');
        $this->command->info('── MESURES ──────────────────────────');
        $this->command->info('   → Glycémie            (daily - 14j historique)');
        $this->command->info('   → Tension artérielle  (daily - 14j historique)');
        $this->command->info('   → Poids               (weekly - 8 semaines)');
        $this->command->info('   → HbA1c               (quarterly - 4 trimestres)');
        $this->command->info('   → Cholestérol total   (quarterly - 4 trimestres)');
        $this->command->info('   → Créatinine          (quarterly - 4 trimestres)');
    }
}
