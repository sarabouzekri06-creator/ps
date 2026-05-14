<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'endpoint' => 'required|string',
            'keys'     => 'required|array',
        ]);

        PushSubscription::updateOrCreate(
            [
                'email'    => $request->email,
                'endpoint' => $request->endpoint,
            ],
            [
                'public_key' => $request->keys['p256dh'],
                'auth_token' => $request->keys['auth'],
            ]
        );

        return response()->json(['success' => true]);
    }
}
