<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('nisn', 10)->unique();
            $table->string('nis', 20)->nullable()->unique();
            $table->string('nama_lengkap', 255);
            $table->string('tempat_lahir', 100);
            $table->date('tanggal_lahir');
            $table->foreignId('jurusan_id')->constrained('majors')->cascadeOnUpdate()->restrictOnDelete();
            $table->string('kelas', 20)->nullable();
            $table->string('tahun_ajaran', 9)->nullable();
            $table->string('status_verifikasi', 30)->default('belum_konfirmasi');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status_verifikasi', 'idx_students_status');
            $table->index('jurusan_id', 'idx_students_jurusan');
            $table->index('kelas', 'idx_students_kelas');
            $table->index('tahun_ajaran', 'idx_students_tahun');
            $table->index(['nisn', 'tanggal_lahir'], 'idx_nisn_tgl');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
