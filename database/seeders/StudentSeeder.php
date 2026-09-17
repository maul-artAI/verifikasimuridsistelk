<?php

namespace Database\Seeders;

use App\Models\Major;
use App\Models\Student;
use Illuminate\Database\Seeder;

class StudentSeeder extends Seeder
{
    public function run(): void
    {
        $majors = Major::all();
        if ($majors->isEmpty()) {
            $this->call(MajorSeeder::class);
            $majors = Major::all();
        }
        $faker = \Faker\Factory::create('id_ID');
        for ($i = 0; $i < 30; $i++) {
            $major = $majors->random();
            Student::create([
                'nisn' => '00' . str_pad((string) (10000000 + $i), 8, '0', STR_PAD_LEFT),
                'nis' => 'NIS' . str_pad((string) $i, 5, '0', STR_PAD_LEFT),
                'nama_lengkap' => $faker->name(),
                'tempat_lahir' => $faker->city(),
                'tanggal_lahir' => $faker->dateTimeBetween('2006-01-01', '2008-12-31')->format('Y-m-d'),
                'jurusan_id' => $major->id,
                'kelas' => 'XII ' . $major->kode . ' ' . rand(1, 2),
                'tahun_ajaran' => '2025/2026',
                'status_verifikasi' => collect(['belum_konfirmasi', 'sesuai', 'mengajukan_perbaikan'])->random(),
            ]);
        }
    }
}
