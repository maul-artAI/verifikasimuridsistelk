<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\DataRevision;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;

class RevisionController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'usulan_nama' => 'nullable|string|max:255',
            'usulan_tempat_lahir' => 'nullable|string|max:100',
            'usulan_tanggal_lahir' => 'nullable|date',
            'file_kk' => 'nullable|file|max:2048',
            'file_ijazah_smp' => 'nullable|file|max:2048',
            'file_akta' => 'nullable|file|max:2048',
        ]);
        // Hardening: cek MIME real + anti double extension, bukan hanya mimes rule
        foreach (['file_kk','file_ijazah_smp','file_akta'] as $f) {
            if ($request->hasFile($f)) {
                $file = $request->file($f);
                $mime = $file->getMimeType();
                $allowedMimes = ['application/pdf','image/jpeg','image/png','image/jpg'];
                if (!in_array($mime, $allowedMimes)) {
                    return back()->withErrors([$f => 'Tipe file tidak diizinkan (hanya PDF/JPG/PNG). Terdeteksi: '.$mime]);
                }
                $ext = strtolower($file->getClientOriginalExtension());
                if (!in_array($ext, ['pdf','jpg','jpeg','png'])) {
                    return back()->withErrors([$f => 'Ekstensi file tidak valid.']);
                }
                // cegah double extension: kk.pdf.php
                $original = $file->getClientOriginalName();
                if (preg_match('/\.(php|phtml|exe|sh|js|html)$/i', $original)) {
                    return back()->withErrors([$f => 'Nama file mengandung ekstensi berbahaya.']);
                }
                // cegah file kosong / terlalu kecil (bypass)
                if ($file->getSize() < 1024) {
                    return back()->withErrors([$f => 'File terlalu kecil / korup.']);
                }
            }
        }

        if (empty($request->usulan_nama) && empty($request->usulan_tempat_lahir) && empty($request->usulan_tanggal_lahir)) {
            return back()->withErrors(['usulan_nama' => 'Minimal isi satu field usulan perbaikan.']);
        }

        if (!$request->hasFile('file_kk') && !$request->hasFile('file_ijazah_smp') && !$request->hasFile('file_akta')) {
            return back()->withErrors(['file_kk' => 'Minimal upload satu dokumen (KK / Ijazah SMP / Akta).']);
        }

        $student = Student::findOrFail($request->student_id);

        // rate limit per NISN
        $key = 'revisi:' . $student->nisn;
        if (RateLimiter::tooManyAttempts($key, 3)) {
            abort(429, 'Terlalu banyak pengajuan. Coba lagi nanti.');
        }
        RateLimiter::hit($key, 60);

        // cegah double pending
        $hasPending = DataRevision::where('student_id', $student->id)->where('status_review', 'pending')->exists();
        if ($hasPending) {
            return back()->withErrors(['revision' => 'Anda masih memiliki pengajuan pending. Tunggu review admin.']);
        }

        $data = [
            'student_id' => $student->id,
            'usulan_nama' => $request->usulan_nama,
            'usulan_tempat_lahir' => $request->usulan_tempat_lahir,
            'usulan_tanggal_lahir' => $request->usulan_tanggal_lahir,
            'status_review' => 'pending',
        ];

        foreach (['file_kk', 'file_ijazah_smp', 'file_akta'] as $field) {
            if ($request->hasFile($field)) {
                $file = $request->file($field);
                // hashName = random 40 char, tanpa original name (hindari path traversal)
                $path = $file->store(date('Y') . '/' . $student->id, 'private');
                // store sudah hashName, tambahan log
                \Illuminate\Support\Facades\Log::channel('daily')->info('revisi upload', ['student'=>$student->nisn, 'field'=>$field, 'path'=>$path, 'ip'=>$request->ip(), 'mime'=>$file->getMimeType()]);
                $data[$field] = $path;
            }
        }

        $revision = DataRevision::create($data);

        $student->update(['status_verifikasi' => Student::STATUS_MENGAJUKAN]);

        AuditLog::create([
            'student_id' => $student->id,
            'action' => 'ajukan_revisi',
            'old_values' => null,
            'new_values' => $revision->toArray(),
            'performed_by' => 'siswa:' . $student->nisn,
        ]);

        return redirect()->route('verifikasi.cek-status-page')->with('success', 'Pengajuan perbaikan berhasil dikirim. Silakan cek status secara berkala.');
    }

    public function preview(Request $request, DataRevision $revision, string $field)
    {
        $this->authorizeAdmin($request);

        if (!in_array($field, ['file_kk', 'file_ijazah_smp', 'file_akta'])) {
            abort(404);
        }
        $path = $revision->$field;
        if (!$path || !Storage::disk('private')->exists($path)) {
            abort(404, 'File tidak ditemukan.');
        }

        return Storage::disk('private')->response($path);
    }

    private function authorizeAdmin(Request $request): void
    {
        if (!auth()->check()) {
            abort(403);
        }
    }
}
