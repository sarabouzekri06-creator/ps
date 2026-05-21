<?php

namespace App\Helpers;

use App\Models\PushSubscription;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;
use GuzzleHttp\Client;

class NotificationHelper
{

    public static function envoyerPush($email, $titre, $message, $image = null, $url = '/', $actions = [])
    {
        $abonnements = PushSubscription::where('email', $email)->get();

        if ($abonnements->isEmpty()) {
            Log::info("Aucun abonnement push pour : $email");
            return;
        }

        $auth = [
            'VAPID' => [
                'subject'    => env('VAPID_SUBJECT', 'mailto:admin@example.com'),
                'publicKey'  => env('VAPID_PUBLIC_KEY'),
                'privateKey' => env('VAPID_PRIVATE_KEY'),
            ],
        ];

        $options = [];
        if (app()->environment('local')) {
            $options = ['GuzzleHttp\Client' => new Client(['verify' => false])];
        }

        $webpush = new WebPush($auth, $options);

        $payload = json_encode([
            'title'   => $titre,
            'body'    => $message,
            'icon'    => '/logo192.png',
            'image'   => $image,
            'url'     => $url,
            'actions' => $actions,
        ]);

        foreach ($abonnements as $sub) {
            $subscription = Subscription::create([
                'endpoint'        => $sub->endpoint,
                'publicKey'       => $sub->public_key,
                'authToken'       => $sub->auth_token,
                'contentEncoding' => 'aesgcm',
            ]);

            $webpush->queueNotification($subscription, $payload);
        }

        foreach ($webpush->flush() as $report) {
            if (!$report->isSuccess()) {
                Log::warning('Push échoué : ' . $report->getReason());
                if (str_contains($report->getReason() ?? '', '410')) {
                    PushSubscription::where('endpoint', $report->getEndpoint())->delete();
                }
            }
        }
    }

    public static function envoyerEmail($email, $sujet, $message)
    {
        Mail::raw($message, function ($mail) use ($email, $sujet) {
            $mail->to($email)->subject('[MediAlert] ' . $sujet);
        });
    }

    public static function emailDestinataire($user)
    {
        if ($user->notification_type === 'patient') {
            return $user->email;
        }

        $responsable = \DB::table('responsables_patient')
            ->where('patient_id', $user->id)
            ->where('is_active', true)
            ->orderBy('ordre')
            ->first();

        return $responsable?->email_responsable ?? $user->email;
    }
}
