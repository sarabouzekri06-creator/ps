<?php

namespace App\Http\Controllers;

use App\Models\Medication;
use App\Models\MediTake;
use App\Models\MedicationTakeLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class MedicationController extends Controller
{
    // ── 1. Liste des médicaments ──────────────────────────────────────────
    public function index(Request $request)
{
    try {
        $medications = Medication::with(['takes', 'notification']) // ← ajouter 'notification'
            ->where('user_id', Auth::id())
            ->get()
            ->map(function ($med) {
                if ($med->notification) {
                    $fd = $med->notification->frequency_details;
                    $med->frequency_type    = $med->notification->frequency_type;
                    $med->frequency_details = is_string($fd) ? json_decode($fd, true) : $fd;
                    $med->number_of_days    = $med->notification->number_of_days;
                    $med->start_day         = $med->notification->start_day;
                }
                return $med;
            });

        return response()->json($medications);

    } catch (\Exception $e) {
        return response()->json([
            'error'   => 'Erreur lors de la lecture des données',
            'message' => $e->getMessage(),
        ], 500);
    }
}

    // ── 2. Détails d'un médicament ────────────────────────────────────────
    public function show($id)
    {
        try {
            $medication = Medication::with(['takes', 'notification'])
                ->where('user_id', Auth::id())
                ->findOrFail($id);

            if ($medication->notification) {
                $fd = $medication->notification->frequency_details;
                $medication->frequency_type    = $medication->notification->frequency_type;
                $medication->frequency_details = is_string($fd)
                    ? json_decode($fd, true)
                    : $fd;
                $medication->number_of_days = $medication->notification->number_of_days;
            }

            return response()->json(['data' => $medication]);

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Médicament introuvable',
                'message' => $e->getMessage(),
            ], 404);
        }
    }

    // ── 3. Créer un médicament ────────────────────────────────────────────
    public function store(Request $request)
    {
        if (is_string($request->takes)) {
            $request->merge(['takes' => json_decode($request->takes, true)]);
        }
        if (is_string($request->frequency_details)) {
            $request->merge(['frequency_details' => json_decode($request->frequency_details, true)]);
        }

        $request->validate([
            'medication_name'   => 'required|string',
            'current_stock'     => 'required|integer',
            'start_day'         => 'required|date',
            'number_of_days'    => 'required|integer',
            'frequency_type'    => 'required|in:daily,weekly,monthly',
            'frequency_details' => 'nullable|array',
            'takes'             => 'required|array|min:1',
        ]);

        try {
            return DB::transaction(function () use ($request) {

                $notification = \App\Models\Notification::create([
                    'user_id'           => Auth::id(),
                    'type'              => 'medication',
                    'start_day'         => $request->start_day,
                    'number_of_days'    => $request->number_of_days,
                    'frequency_type'    => $request->frequency_type,
                    'frequency_details' => $request->frequency_details
                        ? json_encode($request->frequency_details)
                        : null,
                    'is_active'         => true,
                ]);

                $imagePath = null;
                if ($request->hasFile('medication_image')) {
                    $imagePath = $request->file('medication_image')
                        ->store('medications', 'public');
                }

                $medication = Medication::create([
                    'user_id'          => Auth::id(),
                    'notification_id'  => $notification->id,
                    'medication_name'  => $request->medication_name,
                    'current_stock'    => $request->current_stock,
                    'unit'             => $request->unit,
                    'comment'          => $request->comment,
                    'medication_image' => $imagePath,
                    'is_active'        => true,
                ]);

                foreach ($request->takes as $take) {
                    $takeTime = $take['take_time'] ?? $take['time'] ?? null;
                    if (!$takeTime) {
                        throw new \Exception("Clé 'take_time' absente : " . json_encode($take));
                    }
                    MediTake::create([
                        'medication_id' => $medication->id,
                        'take_time'     => $takeTime,
                        'dose'          => $take['dose'] ?? 1,
                        'unit'          => $take['type'] ?? $take['unit'] ?? 'Pill(s)',
                    ]);
                }

                return response()->json([
                    'message' => 'Médicament et Rappels configurés !',
                    'data'    => $medication->load(['takes', 'notification']),
                ], 201);
            });

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Erreur technique',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // ── 4. Modifier un médicament ─────────────────────────────────────────
    public function update(Request $request, $id)
    {
        if (is_string($request->takes)) {
            $request->merge(['takes' => json_decode($request->takes, true)]);
        }
        if (is_string($request->frequency_details)) {
            $request->merge(['frequency_details' => json_decode($request->frequency_details, true)]);
        }

        $request->validate([
            'medication_name'   => 'required|string',
            'current_stock'     => 'required|integer',
            'frequency_type'    => 'required|in:daily,weekly,monthly',
            'frequency_details' => 'nullable|array',
            'takes'             => 'required|array|min:1',
        ]);

        try {
            return DB::transaction(function () use ($request, $id) {

                $medication = Medication::where('user_id', Auth::id())
                    ->findOrFail($id);

                if ($medication->notification_id) {
                    \App\Models\Notification::where('id', $medication->notification_id)
                        ->update([
                            'start_day'         => now()->toDateString(),
                            'number_of_days'    => $request->number_of_days ?? 36500,
                            'frequency_type'    => $request->frequency_type,
                            'frequency_details' => $request->frequency_details
                                ? json_encode($request->frequency_details)
                                : null,
                        ]);
                }

                $imagePath = $medication->medication_image;
                if ($request->hasFile('medication_image')) {
                    if ($imagePath) {
                        Storage::disk('public')->delete($imagePath);
                    }
                    $imagePath = $request->file('medication_image')
                        ->store('medications', 'public');
                }

                $medication->update([
                    'medication_name'  => $request->medication_name,
                    'current_stock'    => $request->current_stock,
                    'unit'             => $request->unit             ?? $medication->unit,
                    'comment'          => $request->comment          ?? $medication->comment,
                    'medication_image' => $imagePath,
                ]);

                $incomingIds = collect($request->takes)
                    ->pluck('id')
                    ->filter()
                    ->values();

                $medication->takes()
                    ->whereNotIn('id', $incomingIds)
                    ->each(function ($take) {
                        MedicationTakeLog::where('take_id', $take->id)->delete();
                        $take->delete();
                    });

                foreach ($request->takes as $take) {
                    $takeTime = $take['take_time'] ?? $take['time'] ?? null;
                    if (!$takeTime) {
                        throw new \Exception("Clé 'take_time' absente : " . json_encode($take));
                    }

                    if (!empty($take['id'])) {
                        MediTake::where('id', $take['id'])
                            ->where('medication_id', $medication->id)
                            ->update([
                                'take_time' => $takeTime,
                                'dose'      => $take['dose'] ?? 1,
                                'unit'      => $take['type'] ?? $take['unit'] ?? 'Pill(s)',
                            ]);
                    } else {
                        MediTake::create([
                            'medication_id' => $medication->id,
                            'take_time'     => $takeTime,
                            'dose'          => $take['dose'] ?? 1,
                            'unit'          => $take['type'] ?? $take['unit'] ?? 'Pill(s)',
                        ]);
                    }
                }

                return response()->json([
                    'message' => 'Médicament mis à jour avec succès !',
                    'data'    => $medication->load(['takes', 'notification']),
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
        try {
            $medication = Medication::where('user_id', Auth::id())
                ->findOrFail($id);

            $medication->is_active = !$medication->is_active;
            $medication->save();

            return response()->json([
                'message'   => 'Statut mis à jour',
                'is_active' => $medication->is_active,
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ── 6. Supprimer un médicament ────────────────────────────────────────
    public function destroy($id)
    {
        try {
            $medication = Medication::where('user_id', Auth::id())
                ->findOrFail($id);

            MedicationTakeLog::whereIn(
                'take_id',
                $medication->takes()->pluck('id')
            )->delete();

            $medication->takes()->delete();

            if ($medication->medication_image) {
                Storage::disk('public')->delete($medication->medication_image);
            }

            $medication->delete();

            return response()->json(['message' => 'Supprimé avec succès']);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ── 7. Réapprovisionner le stock ✅ ───────────────────────────────────
    public function restock(Request $request, $id)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        try {
            $medication = Medication::where('id', $id)
                ->where('user_id', Auth::id())
                ->firstOrFail();

            $medication->increment('current_stock', $request->quantity);

            return response()->json([
                'message'       => 'Stock réapprovisionné avec succès !',
                'current_stock' => $medication->fresh()->current_stock,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Erreur lors du réapprovisionnement',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
