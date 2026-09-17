<?php

namespace App\Exports;

use App\Models\Student;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class StudentsExport implements FromCollection, WithHeadings, WithMapping
{
    public function __construct(private array $filters = []) {}

    public function collection(): \Illuminate\Support\Collection
    {
        return Student::with('major')
            ->when($this->filters['status'] ?? null, fn($q, $v) => $q->where('status_verifikasi', $v))
            ->when($this->filters['jurusan'] ?? null, fn($q, $v) => $q->where('jurusan_id', $v))
            ->get();
    }

    public function headings(): array
    {
        return ['NISN', 'NIS', 'Nama Lengkap', 'Tempat Lahir', 'Tanggal Lahir', 'Jurusan', 'Kelas', 'Tahun Ajaran', 'Status Verifikasi', 'Verified At'];
    }

    public function map($student): array
    {
        return [
            $student->nisn,
            $student->nis,
            $student->nama_lengkap,
            $student->tempat_lahir,
            $student->tanggal_lahir->format('Y-m-d'),
            $student->major->nama ?? '-',
            $student->kelas,
            $student->tahun_ajaran,
            $student->status_verifikasi,
            $student->verified_at,
        ];
    }
}
