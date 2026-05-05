<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Measure;
use Illuminate\Support\Facades\Auth;
use App\Models\MeasureResult;
use Illuminate\Support\Facades\DB;



class MeasureResultController extends Controller
{
    // ── Modifier une valeur ───────────────────────────────────────────────
    public function update(Request $request, $id)
    {
        $request->validate([
            'value' => 'required|numeric',
            'note'  => 'nullable|string|max:255',
        ]);

        $result = MeasureResult::whereHas('measure', function ($q) {
            $q->where('user_id', Auth::id());
        })->findOrFail($id);

        $result->update([
            'value' => $request->value,
            'note'  => $request->note ?? $result->note,
        ]);

        return response()->json([
            'message' => 'Valeur mise à jour',
            'result'  => $result,
        ]);
    }

    // ── Supprimer une valeur ──────────────────────────────────────────────
    public function destroy($id)
    {
        $result = MeasureResult::whereHas('measure', function ($q) {
            $q->where('user_id', Auth::id());
        })->findOrFail($id);

        $result->delete();

        return response()->json(['message' => 'Valeur supprimée']);
    }
}
