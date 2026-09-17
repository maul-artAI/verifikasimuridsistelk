<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DataRevision;
use App\Models\Major;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\StudentsExport;
use App\Imports\StudentsImport;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $stats = [
            'total' => Student::count(),
            'belum' => Student::where('status_verifikasi', 'belum_konfirmasi')->count(),
            'sesuai' => Student::where('status_verifikasi', 'sesuai')->count(),
            'mengajukan' => Student::where('status_verifikasi', 'mengajukan_perbaikan')->count(),
            'perlu_ulang' => Student::where('status_verifikasi', 'perlu_perbaikan_ulang')->count(),
            'pending_review' => DataRevision::where('status_review', 'pending')->count(),
        ];

        $perJurusan = Student::select('jurusan_id', DB::raw('count(*) as total'))
            ->groupBy('jurusan_id')
            ->with('major')
            ->get()
            ->map(fn($r) => ['jurusan' => $r->major->nama ?? '-', 'total' => $r->total]);

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'perJurusan' => $perJurusan,
        ]);
    }

    public function students(Request $request)
    {
        $query = Student::with(['major', 'latestRevision'])
            ->when($request->search, fn($q) => $q->where(fn($qq) => $qq->where('nisn', 'like', "%{$request->search}%")->orWhere('nama_lengkap', 'like', "%{$request->search}%")))
            ->when($request->status, fn($q) => $q->where('status_verifikasi', $request->status))
            ->when($request->jurusan, fn($q) => $q->where('jurusan_id', $request->jurusan))
            ->when($request->kelas, fn($q) => $q->where('kelas', $request->kelas))
            ->orderBy('nama_lengkap');

        $students = $query->paginate(20)->withQueryString();
        $majors = Major::all();

        return Inertia::render('Admin/Students/Index', [
            'students' => $students,
            'majors' => $majors,
            'filters' => $request->only(['search', 'status', 'jurusan', 'kelas']),
        ]);
    }

    public function revisions(Request $request)
    {
        $revisions = DataRevision::with(['student.major', 'reviewer'])
            ->when($request->status, fn($q) => $q->where('status_review', $request->status), fn($q) => $q->where('status_review', 'pending'))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/Revisions/Index', [
            'revisions' => $revisions,
            'filters' => $request->only(['status']),
        ]);
    }

    public function revisionShow(DataRevision $revision)
    {
        $revision->load(['student.major', 'reviewer']);
        $student = $revision->student;
        // generate signed urls untuk preview
        $revision->setAttribute('file_kk_url', $this->signedFileUrl($revision, 'file_kk'));
        $revision->setAttribute('file_ijazah_url', $this->signedFileUrl($revision, 'file_ijazah_smp'));
        $revision->setAttribute('file_akta_url', $this->signedFileUrl($revision, 'file_akta'));

        return Inertia::render('Admin/Revisions/Show', [
            'revision' => $revision,
            'student' => [
                'id' => $student->id,
                'nisn' => $student->nisn,
                'nama_lengkap' => $student->nama_lengkap,
                'tempat_lahir' => $student->tempat_lahir,
                'tanggal_lahir' => $student->tanggal_lahir->format('Y-m-d'),
                'jurusan' => $student->major->nama ?? '-',
                'kelas' => $student->kelas,
                'status_verifikasi' => $student->status_verifikasi,
            ],
        ]);
    }

    public function approve(Request $request, DataRevision $revision)
    {
        if ($revision->status_review !== 'pending') {
            return back()->withErrors(['revision' => 'Sudah direview.']);
        }
        DB::transaction(function () use ($revision) {
            $student = $revision->student;
            $old = $student->toArray();
            $updates = [];
            if ($revision->usulan_nama) $updates['nama_lengkap'] = $revision->usulan_nama;
            if ($revision->usulan_tempat_lahir) $updates['tempat_lahir'] = $revision->usulan_tempat_lahir;
            if ($revision->usulan_tanggal_lahir) $updates['tanggal_lahir'] = $revision->usulan_tanggal_lahir;
            if (!empty($updates)) {
                $updates['status_verifikasi'] = Student::STATUS_SESUAI;
                $updates['verified_at'] = now();
                $student->update($updates);
            } else {
                $student->update(['status_verifikasi' => Student::STATUS_SESUAI, 'verified_at' => now()]);
            }

            $revision->update([
                'status_review' => 'disetujui',
                'reviewed_by' => auth()->id(),
                'reviewed_at' => now(),
            ]);

            \App\Models\AuditLog::create([
                'student_id' => $student->id,
                'action' => 'approve_revisi',
                'old_values' => $old,
                'new_values' => $student->fresh()->toArray(),
                'performed_by' => 'admin:' . auth()->id(),
            ]);
        });

        return redirect()->route('admin.revisions.index')->with('success', 'Revisi disetujui dan data siswa diperbarui.');
    }

    public function reject(Request $request, DataRevision $revision)
    {
        $request->validate(['catatan_admin' => 'required|string|max:1000']);
        if ($revision->status_review !== 'pending') {
            return back()->withErrors(['revision' => 'Sudah direview.']);
        }

        $revision->update([
            'status_review' => 'ditolak',
            'catatan_admin' => $request->catatan_admin,
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);
        $revision->student->update(['status_verifikasi' => Student::STATUS_PERLU_ULANG]);

        \App\Models\AuditLog::create([
            'student_id' => $revision->student_id,
            'action' => 'reject_revisi',
            'old_values' => null,
            'new_values' => ['catatan' => $request->catatan_admin],
            'performed_by' => 'admin:' . auth()->id(),
        ]);

        return redirect()->route('admin.revisions.index')->with('success', 'Revisi ditolak. Siswa dapat mengajukan ulang.');
    }

    public function import(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:xlsx,xls,csv|max:5120']);
        Excel::import(new StudentsImport, $request->file('file'));
        return back()->with('success', 'Import berhasil.');
    }

    public function export(Request $request)
    {
        return Excel::download(new StudentsExport($request->only(['status', 'jurusan'])), 'siswa_valid_' . date('Ymd') . '.xlsx');
    }

    private function signedFileUrl(DataRevision $revision, string $field): ?string
    {
        if (!$revision->$field || !Storage::disk('private')->exists($revision->$field)) return null;
        return URL::temporarySignedRoute('admin.revisions.file', now()->addMinutes(5), ['revision'=>$revision->id, 'field'=>$field]);
    }

    public function studentShow(Student $student)
    {
        $student->load(['major', 'revisions.reviewer', 'auditLogs']);
        $revisions = $student->revisions->sortByDesc('created_at')->values()->map(fn($r) => [
                'id' => $r->id,
                'usulan_nama' => $r->usulan_nama,
                'usulan_tempat_lahir' => $r->usulan_tempat_lahir,
                'usulan_tanggal_lahir' => $r->usulan_tanggal_lahir?->format('Y-m-d'),
                'status_review' => $r->status_review,
                'catatan_admin' => $r->catatan_admin,
                'files' => [
                    'kk' => $r->file_kk ? $this->signedFileUrl($r,'file_kk') : null,
                    'ijazah' => $r->file_ijazah_smp ? $this->signedFileUrl($r,'file_ijazah_smp') : null,
                    'akta' => $r->file_akta ? $this->signedFileUrl($r,'file_akta') : null,
                ],
                'reviewer' => $r->reviewer?->name,
                'created_at' => $r->created_at->toDateTimeString(),
                'reviewed_at' => $r->reviewed_at?->toDateTimeString(),
            ]);
        return Inertia::render('Admin/Students/Show', [
            'majors' => Major::all(['id','kode','nama']),
            'student' => [
                'id' => $student->id,
                'nisn' => $student->nisn,
                'nis' => $student->nis,
                'nama_lengkap' => $student->nama_lengkap,
                'tempat_lahir' => $student->tempat_lahir,
                'tanggal_lahir' => $student->tanggal_lahir->format('Y-m-d'),
                'jurusan' => $student->major ? ['id' => $student->major->id, 'kode' => $student->major->kode, 'nama' => $student->major->nama] : null,
                'kelas' => $student->kelas,
                'tahun_ajaran' => $student->tahun_ajaran,
                'status_verifikasi' => $student->status_verifikasi,
                'verified_at' => $student->verified_at?->toDateTimeString(),
                'created_at' => $student->created_at->toDateTimeString(),
            ],
            'revisions' => $revisions,
            'auditLogs' => $student->auditLogs->sortByDesc('created_at')->values()->map(fn($l) => [
                'id' => $l->id,
                'action' => $l->action,
                'performed_by' => $l->performed_by,
                'created_at' => $l->created_at->toDateTimeString(),
                'old_values' => $l->old_values,
                'new_values' => $l->new_values,
            ]),
        ]);
    }

    public function updateStudentStatus(Request $request, Student $student)
    {
        $request->validate(['status_verifikasi' => 'required|in:belum_konfirmasi,sesuai,mengajukan_perbaikan,perlu_perbaikan_ulang']);
        $old = $student->status_verifikasi;
        $student->update(['status_verifikasi' => $request->status_verifikasi, 'verified_at' => $request->status_verifikasi === Student::STATUS_SESUAI ? now() : null]);
        \App\Models\AuditLog::create([
            'student_id' => $student->id,
            'action' => 'admin_update_status',
            'old_values' => ['status_verifikasi' => $old],
            'new_values' => ['status_verifikasi' => $student->status_verifikasi],
            'performed_by' => 'admin:' . auth()->id(),
        ]);
        return back()->with('success', 'Status diperbarui ke ' . $student->status_verifikasi);
    }

    public function updateStudent(Request $request, Student $student)
    {
        $request->validate([
            'nama_lengkap' => 'required|string|max:255',
            'tempat_lahir' => 'required|string|max:100',
            'tanggal_lahir' => 'required|date',
            'jurusan_id' => 'required|exists:majors,id',
            'kelas' => 'nullable|string|max:20',
            'tahun_ajaran' => 'nullable|string|max:9',
            'nis' => 'nullable|string|max:20|unique:students,nis,'.$student->id,
        ]);
        $old = $student->toArray();
        $student->update($request->only(['nama_lengkap','tempat_lahir','tanggal_lahir','jurusan_id','kelas','tahun_ajaran','nis']));
        \App\Models\AuditLog::create([
            'student_id' => $student->id,
            'action' => 'admin_edit_siswa',
            'old_values' => $old,
            'new_values' => $student->fresh()->toArray(),
            'performed_by' => 'admin:' . auth()->id(),
        ]);
        return back()->with('success', 'Data siswa berhasil diperbarui.');
    }

    public function previewFile(Request $request, DataRevision $revision, string $field)
    {
        if (!in_array($field, ['file_kk', 'file_ijazah_smp', 'file_akta'])) abort(404);
        $path = $revision->$field;
        if (!$path || !Storage::disk('private')->exists($path)) abort(404);
        Log::channel('daily')->info('preview file', ['revision'=>$revision->id, 'field'=>$field, 'by'=>auth()->id(), 'ip'=>$request->ip()]);
        // paksa inline + nosniff, cegah XSS via PDF
        return Storage::disk('private')->response($path, null, ['X-Content-Type-Options'=>'nosniff', 'Content-Security-Policy'=>"default-src 'none'"]);
    }
}
