<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed awal untuk HOSTING (produksi).
     * Hanya data master jurusan + akun admin (dari .env).
     * TIDAK ada data dummy siswa.
     */
    public function run(): void
    {
        $this->call([
            MajorSeeder::class,
            AdminSeeder::class,
        ]);
    }
}
