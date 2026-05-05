<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
       Schema::create('measure_takes', function (Blueprint $table) {
    $table->id();
    // On lie à la mesure principale (ex: Tension)
    $table->foreignId('measure_id')->constrained('measures')->onDelete('cascade');

    $table->time('take_time'); // L'heure prévue (ex: 08:00)
    $table->string('label')->nullable(); // Ex: "À jeun", "Après sport"
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mesure_takes');
    }
};
