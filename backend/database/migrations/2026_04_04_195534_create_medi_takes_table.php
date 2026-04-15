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
      Schema::create('medication_takes', function (Blueprint $table) {
    $table->id();
    $table->foreignId('medication_id')->constrained()->onDelete('cascade');
    
    // --- Champs correspondants à votre tempTake ---
    $table->time('take_time'); // time (ex: 09:00)
    $table->decimal('dose', 8, 2); // dose (ex: 1.25)
    $table->string('unit'); // type (Pills, mg, ml, etc.)
    
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medi_takes');
    }
};
