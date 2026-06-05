<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Medication;
use App\Models\MediTake;
use App\Models\MedicationTakeLog;
use App\Models\Measure;
use App\Models\MeasureResult;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function getDashboardData(Request $request)
    {
        $userId = Auth::id();
        $date   = $request->get('date', now()->toDateString());

        $medications = Medication::with(['takes', 'notification'])
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->get()
            ->map(function ($med) use ($date, $userId) {

                $takes = $med->takes->map(function ($take) use ($date, $userId) {
                    $log = MedicationTakeLog::where('take_id', $take->id)
                        ->where('user_id', $userId)
                        ->whereDate('created_at', $date)
                        ->first();

                    return [
                        'id'        => $take->id,
                        'take_time' => $take->take_time,
                        'take_date' => $date,
                        'dose'      => $take->dose,
                        'unit'      => $take->unit,
                        'status'    => $log ? 'done' : 'pending',
                    ];
                });

                return [
                    'id'              => $med->id,
                    'medication_name' => $med->medication_name,
                    'image'           => $med->medication_image,
                    'current_stock'   => $med->current_stock,
                    'low_stock_alert' => $med->low_stock_alert ?? 5,
                    'initial_stock'   => $med->initial_stock,
                    'frequency_type'  => $med->notification->frequency_type ?? 'daily',
                    'frequency_days'  => $med->notification->frequency_details
                        ? json_decode($med->notification->frequency_details, true)
                        : null,
                    'reminder_color'  => $med->reminder_color ?? '#4e73df',
                    'takes'           => $takes,
                ];
            });

        $measures = Measure::with(['takes', 'notification', 'history'])
            ->where('user_id', $userId)
            ->get()
            ->map(function ($mes) use ($date) {

                // Résultats enregistrés ce jour
                $resultsCeJour = $mes->history->filter(
                    fn($h) => \Carbon\Carbon::parse($h->created_at)->toDateString() === $date
                );

                $nbResults  = $resultsCeJour->count();
                $takesCount = $mes->takes->count();

                // Trier les takes par heure
                $takesSorted = $mes->takes->sortBy('take_time')->values();

                $takes = $takesSorted->map(function ($take, $index) use ($nbResults, $takesCount, $resultsCeJour, $date) {

                    // Logique simple :
                    // - Si autant de résultats que de takes → tous done
                    // - Sinon → les N premiers takes (par ordre) sont done selon nb résultats
                    $isDone = $index < $nbResults;

                    return [
                        'id'        => $take->id,
                        'take_time' => $take->take_time,
                        'label'     => $take->label,
                        'status'    => $isDone ? 'done' : 'pending',
                    ];
                });

                return [
                    'id'             => $mes->id,
                    'disease_name'   => $mes->disease_name,
                    'severity'       => $mes->severity,
                    'unit'           => $mes->unit ?? '',
                    'frequency_type' => optional($mes->notification)->frequency_type ?? 'daily',
                    'frequency_days' => $mes->notification
                        ? json_decode($mes->notification->frequency_details, true)
                        : null,
                    'start_day'      => optional($mes->notification)->start_day,
                    'takes'          => $takes,
                    'history'        => $mes->history->map(fn($h) => [
                        'day'    => \Carbon\Carbon::parse($h->created_at)->format('d/m'),
                        'valeur' => (float) $h->value,
                    ]),
                ];
            });

        return response()->json([
            'medications'     => $medications,
            'measures'        => $measures,
            'appointments'    => [],
            'lastTension'     => '—',
            'user_created_at' => Auth::user()->created_at->toDateString(),
        ]);
    }

    public function markTakeAsDone(Request $request, $takeId)
    {
        try {
            $today  = now()->toDateString();
            $userId = Auth::id();

            $take = MediTake::whereHas('medication', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            })->findOrFail($takeId);

            $alreadyDone = MedicationTakeLog::where('take_id', $takeId)
                ->where('user_id', $userId)
                ->whereDate('created_at', $today)
                ->exists();

            if ($alreadyDone) {
                return response()->json(['message' => "Déjà enregistré pour aujourd'hui"], 200);
            }

            MedicationTakeLog::create([
                'take_id'  => $takeId,
                'user_id'  => $userId,
                'taken_at' => now(),
                'status'   => 'done',
            ]);

            if ($take->medication) {
                $take->medication->decrement('current_stock', $take->dose ?? 1);
            }

            return response()->json([
                'message'  => 'Prise enregistrée pour ' . $today,
                'taken_at' => now(),
            ], 200);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function markMeasureAsDone(Request $request, $id)
    {
        try {
            $userId  = Auth::id();
            $measure = Measure::where('user_id', $userId)->findOrFail($id);

            MeasureResult::create([
                'measure_id' => $measure->id,
                'value'      => $request->value ?? 0,
                'note'       => $request->note  ?? null,
            ]);

            return response()->json(['success' => true, 'message' => 'Mesure enregistrée']);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function index()
    {
        $medications = Medication::with('takes')
            ->where('user_id', Auth::id())
            ->get();

        return response()->json(['medications' => $medications]);
    }
}
