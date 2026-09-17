<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_revisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->string('usulan_nama', 255)->nullable();
            $table->string('usulan_tempat_lahir', 100)->nullable();
            $table->date('usulan_tanggal_lahir')->nullable();
            $table->string('file_kk', 255)->nullable();
            $table->string('file_ijazah_smp', 255)->nullable();
            $table->string('file_akta', 255)->nullable();
            $table->string('status_review', 20)->default('pending');
            $table->text('catatan_admin')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'status_review']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('data_revisions');
    }
};
