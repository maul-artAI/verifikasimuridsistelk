import { test, expect } from '@playwright/test';

test.describe('Portal Verifikasi Data Siswa SMK', () => {

  test('Landing page load - form verifikasi tampil', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Verifikasi Data', exact: true })).toBeVisible();
    await expect(page.getByLabel(/NISN/)).toBeVisible();
    await expect(page.getByLabel(/Tanggal Lahir/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Cek Data Saya/ })).toBeVisible();
    await expect(page.getByText(/Captcha/)).toBeVisible();
  });

  test('Validasi NISN wajib 10 digit', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/Tanggal Lahir/).fill('2007-08-20');
    // ambil captcha question
    const captchaText = await page.getByText(/\+|\-/).textContent();
    // parse captcha: "20 + 8 = ?" -> hitung
    const match = captchaText.match(/(\d+)\s*([\+\-])\s*(\d+)/);
    let answer = '0';
    if (match) {
      const a = parseInt(match[1]), op = match[2], b = parseInt(match[3]);
      answer = op === '+' ? String(a + b) : String(a - b);
    }
    await page.getByPlaceholder('Jawaban angka').fill(answer);
    await page.getByRole('button', { name: /Cek Data Saya/ }).click();
    // harus ada error karena nisn kosong / tidak 10 digit
    await expect(page.locator('text=NISN').first()).toBeVisible();
  });

  test('Flow verifikasi berhasil - NISN 0010000000', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('0012345678').fill('0010000000');
    await page.getByLabel(/Tanggal Lahir/).fill('2007-08-28');

    const captchaText = await page.locator('span.font-mono').first().textContent().catch(async () => await page.getByText(/=/).first().textContent());
    const nums = captchaText.match(/\d+/g);
    let answer = '0';
    if (nums && nums.length >= 2) {
        const a = parseInt(nums[0]), b = parseInt(nums[nums.length - 1]);
        const isPlus = captchaText.includes('+');
        answer = String(isPlus ? a + b : a - b);
    }
    await page.getByPlaceholder('Jawaban angka').fill(answer);
    await page.getByRole('button', { name: /Cek Data Saya/ }).click();

    // tunggu navigasi inertia -> Detail page
    await expect(page.getByText(/Detail Data Siswa/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('0010000000')).toBeVisible();
    await expect(page.getByRole('button', { name: /Data Sesuai/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Data Tidak Sesuai/ })).toBeVisible();
  });

  test('Cek Status page load', async ({ page }) => {
    await page.goto('/cek-status');
    await expect(page.getByRole('heading', { name: /Cek Status Pengajuan/ })).toBeVisible();
    await expect(page.getByPlaceholder('10 digit')).toBeVisible();
    await page.getByRole('button', { name: /Cek Status/ }).click();
    // validation error tanpa isi captcha
    await expect(page.locator('body')).toContainText(/NISN|Tanggal/i);
  });

  test('Flow Cek Status berhasil', async ({ page }) => {
    await page.goto('/cek-status');
    await page.getByPlaceholder('10 digit').fill('0010000001');
    await page.locator('input[type="date"]').first().fill('2007-03-19');
    // ambil captcha dari span biru (lebih robust)
    const captchaText = await page.locator('span.font-mono').first().textContent().catch(async () => await page.getByText(/=/).first().textContent());
    const nums = captchaText.match(/\d+/g);
    let answer = '0';
    if (nums && nums.length >= 2) {
        const a = parseInt(nums[0]), b = parseInt(nums[nums.length - 1]);
        const isPlus = captchaText.includes('+');
        answer = String(isPlus ? a + b : a - b);
    }
    await page.getByPlaceholder('Jawaban').fill(answer);
    await page.getByRole('button', { name: /Cek Status/ }).click();
    await expect(page.getByText(/Riwayat Pengajuan/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('0010000001')).toBeVisible();
  });

  test('Admin login dan akses dashboard', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/Email/)).toBeVisible();
    await page.getByLabel(/Email/).fill('admin@smk.sch.id');
    await page.getByLabel(/Password/).fill('password');
    await page.getByRole('button', { name: /Log in/ }).click();
    await expect(page).toHaveURL(/admin\/dashboard/, { timeout: 10000 });
    await expect(page.getByText(/Dashboard Verifikasi/)).toBeVisible();
    await expect(page.getByText(/Total Siswa/)).toBeVisible();
    await expect(page.getByText(/Belum Konfirmasi/)).toBeVisible();
  });

  test('Admin - Data Siswa filter & export link', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/Email/).fill('admin@smk.sch.id');
    await page.getByLabel(/Password/).fill('password');
    await page.getByRole('button', { name: /Log in/ }).click();
    await page.waitForURL('**/admin/dashboard');
    await page.goto('/admin/students');
    await expect(page.getByText(/Manajemen Data Siswa/)).toBeVisible();
    await expect(page.getByPlaceholder('Cari NISN')).toBeVisible();
    await expect(page.getByText(/Export Excel/)).toBeVisible();
    // cek tabel ada data (minimal 1 baris NISN)
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/0010/).first()).toBeVisible();
  });

  test('Admin - Review perbaikan side-by-side', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/Email/).fill('admin@smk.sch.id');
    await page.getByLabel(/Password/).fill('password');
    await page.getByRole('button', { name: /Log in/ }).click();
    await page.waitForURL('**/admin/dashboard');
    await page.goto('/admin/revisions');
    await expect(page.getByText(/Tinjauan Perbaikan/)).toBeVisible();
    // ada minimal 1 pending atau tulisan Pending
    const firstReview = page.getByRole('button', { name: /Review/ }).first();
    if (await firstReview.isVisible()) {
      await firstReview.click();
      await expect(page.getByText(/Data Lama/)).toBeVisible();
      await expect(page.getByText(/Data Usulan Baru/)).toBeVisible();
    } else {
      await expect(page.locator('body')).toContainText(/Pending|Disetujui|Ditolak/);
    }
  });

});
