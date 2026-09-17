<?php

return [
    // Aktifkan pembatasan jam kerja ala Dukcapil Makassar
    'enabled' => env('JAM_KERJA_ENABLED', true),

    // Zona waktu WITA
    'timezone' => env('JAM_KERJA_TIMEZONE', 'Asia/Makassar'),

    // Jam buka 08:00 - 14:00 WITA
    'jam_buka' => env('JAM_KERJA_BUKA', '08:00'),
    'jam_tutup' => env('JAM_KERJA_TUTUP', '14:00'),

    // Hari kerja: 1=Senin .. 7=Minggu (default Senin-Jumat)
    'hari_kerja' => [1,2,3,4,5],

    // Pesan saat di luar jam kerja
    'pesan_tutup' => 'Layanan pengajuan/verifikasi ditutup. Jam layanan: Senin-Jumat 08:00-14:00 WITA. Saat ini hanya cek data yang tersedia.',
];
