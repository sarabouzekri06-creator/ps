<?php

namespace App\Services;  // ← majuscule S + pluriel

use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;
use App\Models\PushSubscription;
use App\Models\Utilisateur;

class PushNotificationService
{
    private WebPush $webPush;

    public function __construct()
    {
        $this->webPush = new WebPush([
            'VAPID' => [
                'subject'    => env('VAPID_SUBJECT'),
                'publicKey'  => env('VAPID_PUBLIC_KEY'),
                'privateKey' => env('VAPID_PRIVATE_KEY'),
            ],
        ]);
    }

    public function sendToPatient(int $patientId, string $title, string $body, string $url = '/')
    {
        $patient = Utilisateur::find($patientId);
        if (!$patient) return;

        $email = $patient->emailActifPourNotif();
        if (!$email) return;

        $this->sendToEmail($email, $title, $body, $url);
    }

    public function sendToEmail(string $email, string $title, string $body, string $url = '/')
    {
        $subscriptions = PushSubscription::where('email', $email)->get();

        if ($subscriptions->isEmpty()) {
            \Mail::raw("{$title}\n\n{$body}", function ($m) use ($email, $title) {
                $m->to($email)->subject($title);
            });
            return;
        }

        $payload = json_encode([
            'title' => $title,
            'body'  => $body,
            'url'   => $url,
            'icon'  => '/icon-192x192.png',
        ]);

        foreach ($subscriptions as $sub) {
            $this->webPush->queueNotification(
                Subscription::create([
                    'endpoint' => $sub->endpoint,
                    'keys'     => [
                        'p256dh' => $sub->public_key,
                        'auth'   => $sub->auth_token,
                    ],
                ]),
                $payload
            );
        }

        foreach ($this->webPush->flush() as $report) {
            if (!$report->isSuccess()) {
                PushSubscription::where('endpoint', $report->getEndpoint())->delete();
            }
        }
    }
}
