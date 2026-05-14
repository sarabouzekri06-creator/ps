<?php

namespace App\Console\Commands;


use App\Models\Utilisateur;
use App\Models\Medication;
use Illuminate\Support\Facades\Mail;
use App\Mail\LowStockMail;
use App\Mail\MissedReminderMail;

use Illuminate\Console\Command;

class CheckHealthAlerts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-health-alerts';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $medications = Medication::all();

foreach ($medications as $med) {

    if ($med->current_stock <= $med->low_stock_alert) {

        $user = $med->user;

        if ($user && $user->contact_alerte_email) {

            Mail::to($user->contact_alerte_email)
                ->send(new LowStockMail($med));
        }
    }
}
    }
}
