<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PushSubscription extends Model
{
    protected $fillable = [
        'email',
        'endpoint',
        'public_key',
        'auth_token',
    ];
}
