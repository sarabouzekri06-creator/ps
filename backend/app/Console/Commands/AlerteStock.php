<?php
// app/Console/Commands/AlerteStock.php

namespace App\Console\Commands;

use App\Helpers\NotificationHelper;
use App\Models\Medication;
use Illuminate\Console\Command;

class AlerteStock extends Command
{
    protected $signature   = 'alerte:stock';
    protected $description = 'Alerter par WhatsApp quand le stock est bas';

    const SEUIL = 5;

    public function handle()
    {
        $medicaments = Medication::with('user')
            ->whereNotNull('current_stock')
            ->where('current_stock', '<=', self::SEUIL)
            ->where('current_stock', '>', 0)
            ->where(function ($q) {
                $q->whereNull('stock_alerte_at')
                  ->orWhereDate('stock_alerte_at', '<', today());
            })
            ->get();

        foreach ($medicaments as $med) {
            $user = $med->user;
            if (!$user) continue;

            $telephone = NotificationHelper::telephoneDestinataire($user);
            $nom       = $med->medication_name;
            $stock     = $med->current_stock;

            NotificationHelper::envoyerWhatsApp(
                $telephone,
                "⚠️ *Stock bas*\n\nIl vous reste seulement *{$stock} dose(s)* de « {$nom} ».\n\nPensez à renouveler votre ordonnance.\n\n_MediAlert_"
            );

            $med->update(['stock_alerte_at' => now()]);
        }

        $this->info('Alertes stock envoyées : ' . $medicaments->count());
    }
}
