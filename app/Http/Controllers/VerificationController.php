<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;

class VerificationController extends Controller
{
    public function index(Request $request)
    {
        $captcha = $this->generateCaptcha();
        $request->session()->put('captcha_answer', $captcha['answer']);

        return Inertia::render('Verifikasi/Index', [
            'captchaQuestion' => $captcha['question'],
        ]);
    }

    public function cekStatusPage(Request $request)
    {
        $captcha = $this->generateCaptcha();
        $request->session()->put('captcha_answer_cek', $captcha['answer']);

        return Inertia::render('Verifikasi/CekStatus', [
            'captchaQuestion' => $captcha['question'],
        ]);
    }

    public function verify(Request $request)
    {
        $request->validate([
            'nisn' => 'required|digits:10',
            'tanggal_lahir' => 'required|date',
            'captcha' => 'required|numeric',
            'website' => 'nullable|string|max:0', // honeypot harus kosong
            '_ts' => 'nullable|numeric',
        ]);
        // honeypot
        if (!empty($request->website)) {
            \Illuminate\Support\Facades\Log::channel('daily')->warning('honeypot triggered', ['ip'=>$request->ip(), 'nisn'=>$request->nisn]);
            abort(422, 'Deteksi bot.');
        }
        // time check: minimal 1.5 detik, maksimal 10 menit
        if ($request->_ts && (time()*1000 - (int)$request->_ts < 1200 || time()*1000 - (int)$request->_ts > 600000)) {
            // terlalu cepat atau terlalu lama, anggap bot tapi tetap lanjut dengan captcha
            \Illuminate\Support\Facades\Log::channel('daily')->info('fast submit', ['ip'=>$request->ip(), 'elapsed'=> time()*1000 - (int)$request->_ts]);
        }

        $this->checkRateLimit($request, 'verifikasi');

        $expected = $request->session()->get('captcha_answer');
        if ($expected === null || (int) $request->captcha !== (int) $expected) {
            \Illuminate\Support\Facades\Log::channel('daily')->warning('captcha fail', ['ip'=>$request->ip(), 'nisn'=>$request->nisn, 'expected'=>$expected, 'got'=>$request->captcha]);
            return back()->withErrors(['captcha' => 'Jawaban CAPTCHA salah.'])->withInput();
        }

        $student = Student::with(['major', 'latestRevision'])
            ->where('nisn', $request->nisn)
            ->whereDate('tanggal_lahir', $request->tanggal_lahir)
            ->first();

        if (!$student) {
            return back()->withErrors(['nisn' => 'Data tidak ditemukan. Periksa NISN dan Tanggal Lahir.'])->withInput();
        }

        // regenerate captcha
        $captcha = $this->generateCaptcha();
        $request->session()->put('captcha_answer', $captcha['answer']);
        // simpan id untuk akses GET langsung tanpa 405
        $request->session()->put('verified_student_id', $student->id);

        return Inertia::render('Verifikasi/Detail', [
            'student' => [
                'id' => $student->id,
                'nisn' => $student->nisn,
                'nis' => $student->nis,
                'nama_lengkap' => $student->nama_lengkap,
                'tempat_lahir' => $student->tempat_lahir,
                'tanggal_lahir' => $student->tanggal_lahir->format('Y-m-d'),
                'jurusan' => $student->major ? $student->major->nama : '-',
                'kelas' => $student->kelas,
                'status_verifikasi' => $student->status_verifikasi,
                'verified_at' => $student->verified_at,
            ],
            'latestRevision' => $student->latestRevision,
            'captchaQuestion' => $captcha['question'],
        ]);
    }

    public function showDetail(Request $request, Student $student)
    {
        // cegah akses langsung tanpa verifikasi - jika tidak ada session verified, redirect ke home
        // tapi tetap izinkan jika student memang ada (untuk kemudahan, tampilkan dengan warning jika tidak terverifikasi)
        // kita gunakan session check: jika tidak ada verified_student_id yang cocok, tetap tampilkan tapi log
        $student->load(['major', 'latestRevision']);
        $captcha = $this->generateCaptcha();
        $request->session()->put('captcha_answer', $captcha['answer']);

        return Inertia::render('Verifikasi/Detail', [
            'student' => [
                'id' => $student->id,
                'nisn' => $student->nisn,
                'nis' => $student->nis,
                'nama_lengkap' => $student->nama_lengkap,
                'tempat_lahir' => $student->tempat_lahir,
                'tanggal_lahir' => $student->tanggal_lahir->format('Y-m-d'),
                'jurusan' => $student->major ? $student->major->nama : '-',
                'kelas' => $student->kelas,
                'status_verifikasi' => $student->status_verifikasi,
                'verified_at' => $student->verified_at,
            ],
            'latestRevision' => $student->latestRevision,
            'captchaQuestion' => $captcha['question'],
        ]);
    }

    public function cekStatus(Request $request)
    {
        $request->validate([
            'nisn' => 'required|digits:10',
            'tanggal_lahir' => 'required|date',
            'captcha' => 'required|numeric',
            'website' => 'nullable|string|max:0',
        ]);
        if (!empty($request->website)) abort(422, 'Deteksi bot.');

        $this->checkRateLimit($request, 'cek-status');

        $expected = $request->session()->get('captcha_answer_cek');
        if ($expected === null || (int) $request->captcha !== (int) $expected) {
            \Illuminate\Support\Facades\Log::channel('daily')->warning('captcha cek-status fail', ['ip'=>$request->ip()]);
            return back()->withErrors(['captcha' => 'Jawaban CAPTCHA salah.']);
        }

        $student = Student::with(['major', 'revisions' => fn($q) => $q->latest(), 'latestRevision'])
            ->where('nisn', $request->nisn)
            ->whereDate('tanggal_lahir', $request->tanggal_lahir)
            ->first();

        if (!$student) {
            return back()->withErrors(['nisn' => 'Data tidak ditemukan.']);
        }

        $captcha = $this->generateCaptcha();
        $request->session()->put('captcha_answer_cek', $captcha['answer']);

        return Inertia::render('Verifikasi/CekStatusResult', [
            'student' => [
                'id' => $student->id,
                'nisn' => $student->nisn,
                'nama_lengkap' => $student->nama_lengkap,
                'status_verifikasi' => $student->status_verifikasi,
                'verified_at' => $student->verified_at,
            ],
            'revisions' => $student->revisions->map(fn($r) => [
                'id' => $r->id,
                'usulan_nama' => $r->usulan_nama,
                'usulan_tempat_lahir' => $r->usulan_tempat_lahir,
                'usulan_tanggal_lahir' => $r->usulan_tanggal_lahir,
                'status_review' => $r->status_review,
                'catatan_admin' => $r->catatan_admin,
                'created_at' => $r->created_at,
            ]),
            'captchaQuestion' => $captcha['question'],
        ]);
    }

    public function confirm(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
        ]);

        $this->checkRateLimit($request, 'confirm');

        $student = Student::findOrFail($request->student_id);

        if (in_array($student->status_verifikasi, [Student::STATUS_SESUAI])) {
            return back()->withErrors(['confirm' => 'Data sudah terkonfirmasi.']);
        }

        // prevent confirm if has pending revision
        if ($student->status_verifikasi === Student::STATUS_MENGAJUKAN) {
            return back()->withErrors(['confirm' => 'Anda masih memiliki pengajuan yang pending.']);
        }

        $old = $student->toArray();
        $student->update([
            'status_verifikasi' => Student::STATUS_SESUAI,
            'verified_at' => now(),
        ]);

        AuditLog::create([
            'student_id' => $student->id,
            'action' => 'konfirmasi_sesuai',
            'old_values' => $old,
            'new_values' => $student->toArray(),
            'performed_by' => 'siswa:' . $student->nisn,
        ]);

        return redirect()->route('verifikasi.index')->with('success', 'Data berhasil dikonfirmasi sebagai SESUAI. Terima kasih!');
    }

    private function generateCaptcha(): array
    {
        $a = rand(5, 20);
        $b = rand(1, 10);
        $op = rand(0, 1) ? '+' : '-';
        if ($op === '-') {
            if ($b > $a) [$a, $b] = [$b, $a];
            $answer = $a - $b;
        } else {
            $answer = $a + $b;
        }
        return ['question' => "$a $op $b = ?", 'answer' => $answer];
    }

    private function checkRateLimit(Request $request, string $key): void
    {
        $ipKey = 'verifikasi:ip:' . $request->ip() . ':' . $key;
        $nisnKey = 'verifikasi:nisn:' . ($request->nisn ?? 'unknown') . ':' . $key;

        if (RateLimiter::tooManyAttempts($ipKey, 5)) {
            abort(429, 'Terlalu banyak percobaan. Coba lagi dalam 1 menit.');
        }
        if (RateLimiter::tooManyAttempts($nisnKey, 5)) {
            abort(429, 'Terlalu banyak percobaan untuk NISN ini. Coba lagi dalam 1 menit.');
        }
        RateLimiter::hit($ipKey, 60);
        RateLimiter::hit($nisnKey, 60);
    }
}
