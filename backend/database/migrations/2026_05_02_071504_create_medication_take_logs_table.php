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
       Schema::create('medication_take_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('take_id')
                  ->constrained('medication_takes')
                  ->onDelete('cascade');
            $table->foreignId('user_id')
                  ->constrained('utilisateurs')
                  ->onDelete('cascade');
            $table->date('taken_at');
            $table->string('status')->default('done');
            $table->timestamps();


            $table->unique(['take_id', 'taken_at', 'user_id']);
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medication_take_logs');
    }
};
