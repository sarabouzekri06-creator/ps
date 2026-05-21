<?php

use Illuminate\Support\Facades\Schedule;

// Rappels médicaments et mesures : toutes les minutes
Schedule::command('rappel:medicaments')->everyMinute();
Schedule::command('rappel:mesures')->everyMinute();

// Vérifier les manquements (prises non confirmées après 30 min)
Schedule::command('verifier:manquements')->everyMinute();

// Alertes stock : une fois par jour à 8h
Schedule::command('alerte:stock')->dailyAt('08:00');
