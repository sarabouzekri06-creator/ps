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
       Schema::create('medications', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('utilisateurs')->onDelete('cascade');
    $table->string('medication_name'); // Solgar, etc.
    $table->string('medication_image')->nullable();
    $table->integer('current_stock')->default(0);
    $table->integer('low_stock_alert')->default(5);
    $table->date('start_day');
    $table->integer('number_of_days');
    $table->enum('frequency_type', ['daily', 'weekly', 'monthly']);
    $table->json('frequency_details')->nullable(); // Jours choisis
    $table->enum('instruction', ['Before meal', 'During meal', 'After meal']);
    $table->string('reminder_color', 7);
    $table->text('comment')->nullable();
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medications');
    }
};
