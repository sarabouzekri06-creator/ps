<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Measure;
use App\Models\MeasureTake;
use App\Models\MeasureResult;
use App\Models\Notification;
use Illuminate\Support\Facades\DB;

class MeasureController extends Controller
{
    // ── 1. Liste des mesures ──────────────────────────────────────────────
    public function index(Request $request)
    {
        $measures = Measure::where('user_id', $request->user()->id)
            ->with('takes')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($measures);
    }

    // ── 2. Détails d'une mesure ───────────────────────────────────────────
    public function show($id)
    {
        try {
            $measure = Measure::with('takes')
                ->where('user_id', auth()->id())
                ->findOrFail($id);

            if ($measure->notification_id) {
                $notif = Notification::find($measure->notification_id);
                if ($notif) {
                    $measure->frequency_type = $notif->frequency_type;
                    $fd = $notif->frequency_details;
                    $measure->frequency_details = is_string($fd)
                        ? json_decode($fd, true)
                        : $fd;
                }
            }

            return response()->json(['data' => $measure]);

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Mesure introuvable',
                'message' => $e->getMessage(),
            ], 404);
        }
    }

    // ── 3. Créer une mesure ───────────────────────────────────────────────
    public function store(Request $request)
    {
        try {
            return DB::transaction(function () use ($request) {

                $notification = Notification::create([
                    'user_id'           => $request->user()->id,
                    'type'              => 'measure',
                    'start_day'         => now()->toDateString(),
                    'number_of_days'    => 36500,
                    'frequency_type'    => $request->frequencyType,
                    'frequency_details' => in_array($request->frequencyType, ['monthly', 'every2months', 'quarterly'])
                        ? json_encode(['day' => $request->dayOfMonth])
                        : ($request->frequencyType === 'weekly'
                            ? json_encode($request->selectedDays)
                            : null),
                    'is_active'         => true,
                ]);

                $measure = Measure::create([
                    'user_id'         => $request->user()->id,
                    'notification_id' => $notification->id,
                    'disease_name'    => $request->diseaseName,
                    'severity'        => $request->severity,
                    'unit'            => $request->unit,
                    'max_target'      => $request->maxTarget ?: null,
                    'min_target'      => $request->minTarget ?: null,
                    'comment'         => $request->comment,
                ]);

                foreach ($request->takes as $take) {
                    MeasureTake::create([
                        'measure_id' => $measure->id,
                        'take_time'  => $take['take_time'],
                        'label'      => $take['label'] ?? null,
                    ]);
                }

                return response()->json(['message' => 'Configuration réussie !'], 201);
            });
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ── 4. Modifier une mesure ────────────────────────────────────────────
    public function update(Request $request, $id)
    {
        $request->validate([
            'disease_name'   => 'required|string',
            'severity'       => 'required|in:Low,Moderate,High',
            'frequency_type' => 'required|in:daily,weekly,monthly,every2months,quarterly',
            'takes'          => 'required|array|min:1',
        ]);

        try {
            return DB::transaction(function () use ($request, $id) {

                $measure = Measure::where('user_id', auth()->id())
                    ->findOrFail($id);

                // ── Mettre à jour la notification ──
                if ($measure->notification_id) {

                    // Calculer frequency_details selon le type
                    $freqDetails = null;
                    if ($request->frequency_type === 'weekly') {
                        $freqDetails = json_encode($request->frequency_details ?? []);
                    } elseif (in_array($request->frequency_type, ['monthly', 'every2months', 'quarterly'])) {
                        $freqDetails = json_encode(['day' => $request->frequency_details['day'] ?? 1]);
                    }

                    Notification::where('id', $measure->notification_id)->update([
                        'start_day'         => now()->toDateString(), // automatique
                        'number_of_days'    => 36500,                 // illimité
                        'frequency_type'    => $request->frequency_type,
                        'frequency_details' => $freqDetails,
                    ]);
                }

                // ── Mettre à jour la mesure ──
                $measure->update([
                    'disease_name' => $request->disease_name,
                    'severity'     => $request->severity,
                    'unit'         => $request->unit         ?? $measure->unit,
                    'max_target'   => $request->max_target   ?: null,
                    'min_target'   => $request->min_target   ?: null,
                    'comment'      => $request->comment      ?? $measure->comment,
                ]);

                // ── Synchroniser les prises ──
                $incomingIds = collect($request->takes)
                    ->pluck('id')
                    ->filter()
                    ->values();

                // Supprimer les prises retirées
                $measure->takes()
                    ->whereNotIn('id', $incomingIds)
                    ->delete();

                // Mettre à jour ou créer
                foreach ($request->takes as $take) {
                    if (!empty($take['id'])) {
                        MeasureTake::where('id', $take['id'])
                            ->where('measure_id', $measure->id)
                            ->update([
                                'take_time' => $take['take_time'],
                                'label'     => $take['label'] ?? null,
                            ]);
                    } else {
                        MeasureTake::create([
                            'measure_id' => $measure->id,
                            'take_time'  => $take['take_time'],
                            'label'      => $take['label'] ?? null,
                        ]);
                    }
                }

                return response()->json([
                    'message' => 'Mesure mise à jour avec succès !',
                    'data'    => $measure->load('takes'),
                ]);
            });

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Erreur technique',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // ── 5. Toggle actif / pause ───────────────────────────────────────────
    public function toggleStatus($id)
    {
        $measure = Measure::where('id', $id)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        $measure->update(['is_active' => !$measure->is_active]);

        return response()->json($measure);
    }

    // ── 6. Enregistrer une valeur ─────────────────────────────────────────
    public function storeResult(Request $request)
    {
        $request->validate([
            'measure_id' => 'required|exists:measures,id',
            'value'      => 'required|numeric',
            'note'       => 'nullable|string|max:255',
        ]);

        $measure = Measure::where('id', $request->measure_id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $result = MeasureResult::create([
            'measure_id' => $measure->id,
            'value'      => $request->value,
            'note'       => $request->note ?? null,
        ]);

        return response()->json([
            'message' => 'Valeur enregistrée avec succès !',
            'result'  => $result,
        ], 201);
    }

    // ── 7. Statistiques dashboard ─────────────────────────────────────────
    public function getStats(Request $request)
    {
        $measures = Measure::where('user_id', $request->user()->id)
            ->with(['takes', 'notification', 'history' => function ($q) {
                $q->orderBy('created_at', 'asc');
            }])
            ->get()
            ->map(function ($measure) {

                $unit      = $measure->unit       ?? '';
                $maxTarget = $measure->max_target  ?? null;
                $minTarget = $measure->min_target  ?? null;

                return [
                    'id'            => $measure->id,
                    'name'          => $measure->disease_name,
                    'unit'          => $unit,
                    'maxTarget'     => $maxTarget ? (float) $maxTarget : null,
                    'minTarget'     => $minTarget ? (float) $minTarget : null,
                    'frequencyType' => optional($measure->notification)->frequency_type,
                    'color'         => $measure->color ?? '#3b5bdb',
                    'currentValue'  => optional($measure->history->last())->value ?? null,
                    'takes'         => $measure->takes->map(fn($t) => [
                        'take_time' => $t->take_time,
                        'label'     => $t->label,
                    ]),
                    'history'       => $measure->history->map(fn($h) => [
                        'id'     => $h->id,
                        'day'    => $h->created_at->format('d/m'),
                        'time'   => $h->created_at->format('H:i'),
                        'valeur' => (float) $h->value,
                        'note'   => $h->note,
                    ]),
                ];
            });

        return response()->json($measures->values());
    }

    // ── 8. Modifier une valeur ────────────────────────────────────────────
    public function updateResult(Request $request, $id)
    {
        $request->validate([
            'value' => 'required|numeric',
            'note'  => 'nullable|string|max:255',
        ]);

        $result = MeasureResult::whereHas('measure', function ($q) {
            $q->where('user_id', auth()->id());
        })->findOrFail($id);

        $result->update([
            'value' => $request->value,
            'note'  => $request->note ?? null,
        ]);

        return response()->json(['message' => 'Valeur mise à jour !', 'result' => $result]);
    }

    // ── 9. Supprimer une valeur ───────────────────────────────────────────
    public function destroyResult($id)
    {
        $result = MeasureResult::whereHas('measure', function ($q) {
            $q->where('user_id', auth()->id());
        })->findOrFail($id);

        $result->delete();

        return response()->json(['message' => 'Valeur supprimée']);
    }

    // ── 10. Supprimer une mesure ──────────────────────────────────────────
    public function destroy($id)
    {
        $measure = Measure::where('id', $id)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        $measure->delete();

        return response()->json(['message' => 'Supprimé avec succès']);
    }
}
