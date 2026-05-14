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
        Schema::create('push_subscriptions', function (Blueprint $table) {
    $table->id();

    // Lié à l'email (patient ou responsable)
    $table->string('email');
    $table->text('endpoint');
    $table->text('public_key');
    $table->text('auth_token');
    $table->timestamps();

    $table->unique(['email', 'endpoint']);
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('push_subscriptions');
    }
};
