<?php
// database/migrations/xxxx_create_manquements_table.php
// Tu as déjà push_subscriptions et responsables_patient
// Cette migration crée juste la table pour compter les manquements

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('manquements', function (Blueprint $table) {
            $table->id();

            // Le patient concerné (référence vers ta table utilisateurs)
            $table->foreignId('patient_id')
                  ->constrained('utilisateurs')
                  ->onDelete('cascade');

            $table->string('type');        // 'medicament' ou 'mesure'
            $table->unsignedBigInteger('ref_id');  // id du médicament ou de la mesure
            $table->date('date');

            // Pour ne pas envoyer l'email d'alerte plusieurs fois
            $table->boolean('email_envoye')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('manquements');
    }
};
