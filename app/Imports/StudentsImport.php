<?php

namespace App\Imports;

use App\Models\Major;
use App\Models\Student;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class StudentsImport implements ToModel, WithHeadingRow
{
    public function model(array $row): \Illuminate\Database\Eloquent\Model|null
    {
        // Skip empty rows
        if (empty($row['nisn']) && empty($row['nama_lengkap'])) {
            return null;
        }
        // Normalize keys (support both verbose headers and simple headers)
        $nisn = $row['nisn'] ?? $row['nisn_10_digit'] ?? null;
        $nis = $row['nis'] ?? $row['nis_opsional'] ?? null;
        $nama = $row['nama_lengkap'] ?? $row['nama'] ?? null;
        $tempat = $row['tempat_lahir'] ?? null;
        $tgl = $row['tanggal_lahir'] ?? $row['tanggal_lahir_yyyy_mm_dd'] ?? null;
        $kode = $row['jurusan_kode'] ?? $row['jurusan_kode_rpl_ulw_tjkt'] ?? null;
        $kelas = $row['kelas'] ?? $row['kelas_xii_rpl_1'] ?? null;
        $ta = $row['tahun_ajaran'] ?? $row['tahun_ajaran_2025_2026'] ?? '2025/2026';

        // Clean NISN (ensure string)
        $nisn = $nisn ? preg_replace('/\D/', '', (string)$nisn) : null;
        if (!$nisn || strlen($nisn) != 10) return null; // skip invalid

        $major = null;
        if (!empty($kode)) {
            $kode = strtoupper(trim($kode));
            $major = Major::where('kode', $kode)->first();
        }
        if (!$major) {
            $major = Major::first();
        }

        // Avoid duplicate NISN
        if (Student::where('nisn', $nisn)->exists()) {
            return null;
        }
        // Avoid duplicate NIS (unique, nullable) - jika duplikat jadikan null agar tidak violation 1062
        if (!empty($nis)) {
            $nis = trim((string)$nis);
            if ($nis === '' || Student::where('nis', $nis)->exists()) {
                $nis = null;
            }
        } else {
            $nis = null;
        }

        // Parse tanggal
        try {
            $tgl = $tgl ? \Carbon\Carbon::parse($tgl)->format('Y-m-d') : null;
        } catch (\Exception $e) {
            $tgl = null;
        }

        return new Student([
            'nisn' => $nisn,
            'nis' => $nis,
            'nama_lengkap' => $nama,
            'tempat_lahir' => $tempat,
            'tanggal_lahir' => $tgl,
            'jurusan_id' => $major->id,
            'kelas' => $kelas,
            'tahun_ajaran' => $ta,
            'status_verifikasi' => 'belum_konfirmasi',
        ]);
    }
}
