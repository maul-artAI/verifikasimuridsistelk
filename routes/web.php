<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RevisionController;
use App\Http\Controllers\VerificationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [VerificationController::class, 'index'])->name('verifikasi.index');
Route::post('/verifikasi', [VerificationController::class, 'verify'])->middleware('throttle:5,1')->name('verifikasi.verify');
Route::get('/verifikasi', function () { return redirect()->route('verifikasi.index'); });
Route::post('/verifikasi/confirm', [VerificationController::class, 'confirm'])->middleware(['throttle:5,1','jamkerja'])->name('verifikasi.confirm');
Route::get('/verifikasi/confirm', function () { return redirect()->route('verifikasi.index'); });
Route::get('/verifikasi/{student}', [VerificationController::class, 'showDetail'])->whereNumber('student')->name('verifikasi.show');
Route::post('/revisi', [RevisionController::class, 'store'])->middleware(['throttle:5,1','jamkerja'])->name('revisi.store');
Route::get('/revisi', function () { return redirect()->route('verifikasi.index'); });

Route::get('/cek-status', [VerificationController::class, 'cekStatusPage'])->name('verifikasi.cek-status-page');
Route::post('/cek-status', [VerificationController::class, 'cekStatus'])->middleware('throttle:5,1')->name('verifikasi.cek-status');

// Admin
Route::middleware(['auth'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/students', [DashboardController::class, 'students'])->name('students.index');
    Route::get('/students/template', function () {
        $path = public_path('contoh_import_siswa.xlsx');
        if (!file_exists($path)) abort(404, 'Template tidak ditemukan di public/contoh_import_siswa.xlsx');
        return response()->download($path, 'contoh_import_siswa.xlsx');
    })->name('students.template');
    Route::get('/students/export', [DashboardController::class, 'export'])->name('students.export');
    Route::post('/students/import', [DashboardController::class, 'import'])->middleware('jamkerja')->name('students.import');
    Route::get('/students/{student}', [DashboardController::class, 'studentShow'])->whereNumber('student')->name('students.show');
    Route::patch('/students/{student}/status', [DashboardController::class, 'updateStudentStatus'])->whereNumber('student')->middleware('jamkerja')->name('students.updateStatus');
    Route::put('/students/{student}', [DashboardController::class, 'updateStudent'])->whereNumber('student')->middleware('jamkerja')->name('students.update');
    Route::get('/revisions', [DashboardController::class, 'revisions'])->name('revisions.index');
    Route::get('/revisions/{revision}', [DashboardController::class, 'revisionShow'])->name('revisions.show');
    Route::post('/revisions/{revision}/approve', [DashboardController::class, 'approve'])->middleware('jamkerja')->name('revisions.approve');
    Route::post('/revisions/{revision}/reject', [DashboardController::class, 'reject'])->middleware('jamkerja')->name('revisions.reject');
    Route::get('/revisions/{revision}/file/{field}', [DashboardController::class, 'previewFile'])->middleware('signed')->name('revisions.file');

    Route::post('/jamkerja/bypass', function (\Illuminate\Http\Request $request) {
        $current = $request->session()->get('jamkerja_bypass', false);
        $request->session()->put('jamkerja_bypass', !$current);
        return back()->with('success', !$current ? 'Mode darurat AKTIF: Admin bisa kerja di luar 08:00-14:00 WITA (sesi ini)' : 'Mode jam kerja NORMAL kembali');
    })->name('jamkerja.bypass');
    Route::post('/jamkerja/bypass-admin', function (\Illuminate\Http\Request $request) {
        $current = \Illuminate\Support\Facades\Cache::get('jamkerja_bypass_admin', false);
        \Illuminate\Support\Facades\Cache::put('jamkerja_bypass_admin', !$current);
        $request->session()->put('jamkerja_bypass_admin', !$current);
        return back()->with('success', !$current ? 'Darurat ADMIN AKTIF: Semua admin bisa kerja di luar jam (global)' : 'Darurat ADMIN NONAKTIF');
    })->name('jamkerja.bypassAdmin');
    Route::post('/jamkerja/bypass-siswa', function (\Illuminate\Http\Request $request) {
        $current = \Illuminate\Support\Facades\Cache::get('jamkerja_bypass_siswa', false);
        \Illuminate\Support\Facades\Cache::put('jamkerja_bypass_siswa', !$current);
        return back()->with('success', !$current ? 'Darurat SISWA AKTIF: Siswa bisa ajukan/konfirmasi di luar 08:00-14:00 WITA (global)' : 'Darurat SISWA NONAKTIF: Kembali ke jam kerja');
    })->name('jamkerja.bypassSiswa');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
