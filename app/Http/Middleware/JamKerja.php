<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\Response;

class JamKerja
{
    public function handle(Request $request, Closure $next, string $mode = 'ketat'): Response
    {
        if (!config('jamkerja.enabled')) {
            return $next($request);
        }

        $tz = config('jamkerja.timezone', 'Asia/Makassar');
        $now = Carbon::now($tz);
        $buka = Carbon::createFromFormat('H:i', config('jamkerja.jam_buka', '08:00'), $tz)->setDate($now->year, $now->month, $now->day);
        $tutup = Carbon::createFromFormat('H:i', config('jamkerja.jam_tutup', '14:00'), $tz)->setDate($now->year, $now->month, $now->day);
        $hariKerja = config('jamkerja.hari_kerja', [1,2,3,4,5]);

        $isHariKerja = in_array($now->dayOfWeekIso, $hariKerja);
        $isJamKerja = $now->between($buka, $tutup, true);

        $diJamKerja = $isHariKerja && $isJamKerja;

        if ($diJamKerja) {
            return $next($request);
        }

        // Bypass darurat: admin (session) dan siswa (global cache via admin)
        // Admin bypass: session jamkerja_bypass_admin atau cache global
        if ($request->session()->get('jamkerja_bypass') || $request->session()->get('jamkerja_bypass_admin') || \Illuminate\Support\Facades\Cache::get('jamkerja_bypass_admin')) {
            if ($request->is('admin/*')) return $next($request);
        }
        // Siswa bypass: global cache yang diaktifkan admin
        if (\Illuminate\Support\Facades\Cache::get('jamkerja_bypass_siswa')) {
            // izinkan untuk route siswa (verifikasi/confirm, revisi)
            if ($request->is('verifikasi/confirm') || $request->is('revisi') || $request->routeIs('verifikasi.confirm') || $request->routeIs('revisi.store')) {
                return $next($request);
            }
        }

        // Di luar jam kerja: hanya cek data (GET / dan POST /verifikasi untuk lihat data) yang boleh
        // Yang dibatasi: confirm, revisi, cek-status, admin approve/reject/edit
        // Untuk request Inertia/JSON, kembalikan 423 dengan pesan
        $pesan = config('jamkerja.pesan_tutup');

        // Jika request expects JSON / Inertia, beri response yang bisa ditangani frontend
        if ($request->expectsJson() || $request->header('X-Inertia')) {
            // Untuk Inertia, redirect back dengan error agar Alert muncul, tapi juga bisa 423
            // Kita gunakan abort 423 dengan JSON agar frontend bisa tampilkan
            return response()->json(['message' => $pesan, 'jam_buka' => config('jamkerja.jam_buka'), 'jam_tutup' => config('jamkerja.jam_tutup'), 'timezone' => $tz, 'now' => $now->format('Y-m-d H:i:s')], 423);
        }

        abort(423, $pesan);
    }

    public static function isBuka(): bool
    {
        if (!config('jamkerja.enabled')) return true;
        $tz = config('jamkerja.timezone', 'Asia/Makassar');
        $now = Carbon::now($tz);
        $buka = Carbon::createFromFormat('H:i', config('jamkerja.jam_buka', '08:00'), $tz)->setDate($now->year, $now->month, $now->day);
        $tutup = Carbon::createFromFormat('H:i', config('jamkerja.jam_tutup', '14:00'), $tz)->setDate($now->year, $now->month, $now->day);
        $hariKerja = config('jamkerja.hari_kerja', [1,2,3,4,5]);
        return in_array($now->dayOfWeekIso, $hariKerja) && $now->between($buka, $tutup, true);
    }

    public static function info(): array
    {
        $tz = config('jamkerja.timezone', 'Asia/Makassar');
        $now = Carbon::now($tz);
        $bypassAdmin = false;
        $bypassSiswa = false;
        try {
            $bypassAdmin = (bool) \Illuminate\Support\Facades\Cache::get('jamkerja_bypass_admin');
            if (!$bypassAdmin && function_exists('request') && request()) {
                $bypassAdmin = (bool) request()->session()->get('jamkerja_bypass_admin') || (bool) request()->session()->get('jamkerja_bypass');
            }
            $bypassSiswa = (bool) \Illuminate\Support\Facades\Cache::get('jamkerja_bypass_siswa');
        } catch (\Throwable $e) {}
        return [
            'enabled' => config('jamkerja.enabled'),
            'is_buka' => self::isBuka(),
            'now' => $now->format('Y-m-d H:i:s'),
            'now_human' => $now->format('H:i'),
            'timezone' => $tz,
            'jam_buka' => config('jamkerja.jam_buka'),
            'jam_tutup' => config('jamkerja.jam_tutup'),
            'hari_kerja' => config('jamkerja.hari_kerja'),
            'bypass_admin' => $bypassAdmin,
            'bypass_siswa' => $bypassSiswa,
        ];
    }
}
