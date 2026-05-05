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
        Schema::table('measures', function (Blueprint $table) {
            $table->string('unit')->nullable()->after('severity');
            $table->decimal('max_target', 8, 2)->nullable()->after('unit');
            $table->decimal('min_target', 8, 2)->nullable()->after('max_target');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('measures', function (Blueprint $table) {
             $table->dropColumn(['unit', 'max_target', 'min_target']);
        });
    }
};
