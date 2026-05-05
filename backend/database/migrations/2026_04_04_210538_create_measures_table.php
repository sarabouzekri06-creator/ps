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
    Schema::create('measures', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained('utilisateurs')->onDelete('cascade');
        $table->foreignId('notification_id')->constrained('notifications')->onDelete('cascade');
        $table->string('disease_name');
        $table->string('severity');
         $table->string('comment')->nullable();
        $table->boolean('is_active')->default(true);
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('measures');
    }
};
