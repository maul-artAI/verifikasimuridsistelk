# Panduan Hosting — Portal Verifikasi Data Siswa SMK
## Branch `hosting` (bersih, tanpa data dummy)

Branch ini siap upload ke hosting. Database mulai **kosong**: hanya jurusan
(RPL, ULW, TJKT) + 1 akun admin. Tidak ada siswa palsu.

### 1. Syarat server
- PHP **>= 8.2** (disarankan 8.4) + ekstensi: `intl`, `pdo_mysql`, `mbstring`,
  `exif`, `bcmath`, `gd`, `zip`, `fileinfo`, `openssl`
- MySQL / MariaDB, Composer 2, Node.js 20+ (untuk build sekali saja)
- `php.ini`: `upload_max_filesize = 2M`, `post_max_size = 12M`

### 2. Upload file
- Clone branch `hosting`: `git clone -b hosting <url-repo>`
- ATAU upload ZIP branch ini, lalu arahkan domain ke folder `public/`
- JANGAN upload: folder yang tidak ada di repo ini (`vendor/`, `node_modules/`,
  `public/build/` bila belum build — lihat langkah 5)

### 3. Database
Buat database kosong, contoh:
```sql
CREATE DATABASE verifikasi_siswa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. File `.env`
```bash
cp .env.example .env
```
Isi wajib di `.env`:
- `APP_URL=https://domain-sekolah` (https!)
- `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` (jangan pakai root/root)
- `ADMIN_EMAIL` dan `ADMIN_PASSWORD` (min. 8 karakter, kuat)
- Pastikan: `APP_ENV=production`, `APP_DEBUG=false`

### 5. Instal & build
```bash
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --force
php artisan db:seed --force
npm install
npm run build
```
> Jika server tidak ada Node.js: build di lokal (`npm run build`) lalu
> upload folder `public/build/` manual via FTP.

### 6. Cek akhir
- Buka `/` → form verifikasi tampil + favicon
- Login `/login` dengan `ADMIN_EMAIL` → Dashboard → tombol **Download Template**
- Import `contoh_import_siswa.xlsx` yang sudah diisi (header persis:
  `nisn,nis,nama_lengkap,tempat_lahir,tanggal_lahir,jurusan_kode,kelas,tahun_ajaran`)
- Jam layanan: Senin–Jumat 08:00–14:00 WITA (cek data/progres 24 jam).
  Darurat admin & siswa ada di Dashboard.

### 7. Rutin (opsional)
- Backup database harian via panel hosting.
- Bersihkan sisa file revisi yang sudah diputus:
  `php artisan revisions:purge` (bisa dijadikan cron mingguan).
- File KK/akta otomatis terhapus saat approve/reject.

### 8. Yang TIDAK ada di branch ini
Data dummy siswa (`StudentSeeder`), Playwright e2e, `AGENTS.md`/`CLAUDE.md`.
Perbaikan & fitur baru dikerjakan di branch `main`, lalu di-merge ke `hosting`
saat siap rilis.
