<?php

namespace Database\Seeders;

use App\Models\Major;
use Illuminate\Database\Seeder;

class MajorSeeder extends Seeder
{
    public function run(): void
    {
        $majors = [
            ['kode' => 'RPL', 'nama' => 'Rekayasa Perangkat Lunak'],
            ['kode' => 'ULW', 'nama' => 'Usaha Layanan Wisata'],
            ['kode' => 'TJKT', 'nama' => 'Teknik Jaringan Komputer dan Telekomunikasi'],
        ];
        foreach ($majors as $m) {
            Major::firstOrCreate(['kode' => $m['kode']], $m);
        }
    }
}
