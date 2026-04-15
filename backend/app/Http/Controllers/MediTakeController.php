<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class MediTakeController extends Controller
{
    protected $fillable = ['medication_id', 'take_time', 'dose', 'unit'];
}
