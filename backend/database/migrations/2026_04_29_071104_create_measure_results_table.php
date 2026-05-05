<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
  public function up()
{
    Schema::create('measure_results', function (Blueprint $table) {
        $table->id();
        $table->foreignId('measure_id')->constrained('measures')->onDelete('cascade');
        $table->float('value'); // La valeur numérique (ex: 1.15)
        $table->string('note')->nullable(); // Ex: "Après le sport"
        $table->timestamps(); // Cela créera 'created_at' qui servira de date pour le graphique
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('measure_results');
    }
};
