<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    /**
     * Buat akun admin TU dari environment (.env).
     * Wajib isi ADMIN_EMAIL dan ADMIN_PASSWORD di .env sebelum seed.
     */
    public function run(): void
    {
        $email = env('ADMIN_EMAIL');
        $password = env('ADMIN_PASSWORD');
        $name = env('ADMIN_NAME', 'Admin TU');

        if (empty($email) || empty($password)) {
            throw new \RuntimeException(
                'ADMIN_EMAIL dan ADMIN_PASSWORD wajib diisi di .env sebelum seeding. ' .
                'Lihat DEPLOY.md langkah 4.'
            );
        }

        if (strlen($password) < 8) {
            throw new \RuntimeException('ADMIN_PASSWORD minimal 8 karakter.');
        }

        User::updateOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => bcrypt($password), 'role' => 'admin']
        );
    }
}
