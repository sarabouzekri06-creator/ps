<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CheckReminderObservance extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-reminder-observance';

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
    $users = User::all();

    foreach ($users as $user) {

        $total = 0;
        $done  = 0;

        $medications = $user->medications()
            ->with('takes')
            ->get();

        foreach ($medications as $medication) {

            foreach ($medication->takes as $take) {

                $total++;

                if ($take->status === 'done') {
                    $done++;
                }
            }
        }

        if ($total > 0) {

            $percentage = ($done / $total) * 100;

            if ($percentage < 50) {

                Mail::to($user->contact_alerte_email)
                    ->send(new MissedReminderMail());

            }
        }
    }
}
}
