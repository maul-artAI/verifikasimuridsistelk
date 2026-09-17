<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DataRevision extends Model
{
    protected $fillable = [
        'student_id', 'usulan_nama', 'usulan_tempat_lahir', 'usulan_tanggal_lahir',
        'file_kk', 'file_ijazah_smp', 'file_akta', 'status_review', 'catatan_admin',
        'reviewed_by', 'reviewed_at',
    ];

    protected $casts = [
        'usulan_tanggal_lahir' => 'date',
        'reviewed_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
