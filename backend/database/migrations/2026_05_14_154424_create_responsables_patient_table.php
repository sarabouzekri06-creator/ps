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
        Schema::create('responsables_patient', function (Blueprint $table) {
    $table->id();

    // Le patient (utilisateur avec notification_type = 'patient' ou 'responsable')
    $table->foreignId('patient_id')
          ->constrained('utilisateurs')
          ->onDelete('cascade');

    // Email du responsable qui reçoit les notifs
    $table->string('email_responsable');

    // 1 = principal, 2 = remplaçant
    $table->tinyInteger('ordre')->default(1);

    // Actif ou désactivé
    $table->boolean('is_active')->default(true);

    $table->timestamps();

    // Max 1 entrée par ordre par patient
    $table->unique(['patient_id', 'ordre']);
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('responsables_patient');
    }
};
