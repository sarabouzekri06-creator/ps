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
        Schema::create('utilisateurs', function (Blueprint $table) {
           $table->id(); // ID unique pour MySQL [cite: 2]
            
            // --- LOGIN & INSCRIPTION ---
            $table->string('email')->unique(); // Identifiant de connexion 
            $table->string('password'); // Mot de passe haché 
            
            // --- ÉTAT DU PROFIL (React: user state) ---
            $table->string('nom')->nullable(); 
            $table->string('prenom')->nullable();
            $table->integer('age')->nullable();
            $table->text('maladies')->nullable(); // Liste des maladies chroniques [cite: 4, 12]
            $table->string('profile_image')->nullable(); // Pour stocker le chemin de la photo
            
            // --- LOGIQUE DE NOTIFICATION (Patient vs Responsable) ---
            // Définit si le patient est autonome ou dépendant 
            $table->enum('notification_type', ['patient', 'responsable'])->default('patient');
            
            // Email de la personne qui doit être alertée 
            $table->string('contact_alerte_email')->nullable(); 
            
            $table->boolean('is_profile_complete')->default(false);
            
            $table->rememberToken();
            $table->timestamps(); // created_at et updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('utilisateurs');
    }
};
