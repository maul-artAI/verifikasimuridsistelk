<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'nisn', 'nis', 'nama_lengkap', 'tempat_lahir', 'tanggal_lahir',
        'jurusan_id', 'kelas', 'tahun_ajaran', 'status_verifikasi', 'verified_at',
    ];

    protected $casts = [
        'tanggal_lahir' => 'date',
        'verified_at' => 'datetime',
    ];

    public const STATUS_BELUM = 'belum_konfirmasi';
    public const STATUS_SESUAI = 'sesuai';
    public const STATUS_MENGAJUKAN = 'mengajukan_perbaikan';
    public const STATUS_PERLU_ULANG = 'perlu_perbaikan_ulang';

    public function major(): BelongsTo
    {
        return $this->belongsTo(Major::class, 'jurusan_id');
    }

    public function revisions(): HasMany
    {
        return $this->hasMany(DataRevision::class);
    }

    public function latestPendingRevision(): HasOne
    {
        return $this->hasOne(DataRevision::class)->where('status_review', 'pending')->latestOfMany();
    }

    public function latestRevision(): HasOne
    {
        return $this->hasOne(DataRevision::class)->latestOfMany();
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }
}
