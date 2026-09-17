import { Head, useForm, router, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Detail({ student, latestRevision, captchaQuestion }) {
    const { props } = usePage();
    const jamKerja = props.jamKerja;
    const isBuka = jamKerja?.is_buka ?? true;
    const bypassSiswa = jamKerja?.bypass_siswa ?? false;
    const canSiswa = isBuka || bypassSiswa;
    const [showForm, setShowForm] = useState(false);
    const confirmForm = useForm({ student_id: student.id });
    const revisionForm = useForm({
        student_id: student.id,
        usulan_nama: '',
        usulan_tempat_lahir: '',
        usulan_tanggal_lahir: '',
        file_kk: null,
        file_ijazah_smp: null,
        file_akta: null,
    });

    const handleConfirm = (e) => {
        e.preventDefault();
        if (!canSiswa) return;
        confirmForm.post(route('verifikasi.confirm'), {
            onError: (errors) => {
                if (errors.message) alert(errors.message);
            },
            onSuccess: () => {},
        });
    };

    const handleRevision = (e) => {
        e.preventDefault();
        if (!canSiswa) return;
        revisionForm.post(route('revisi.store'), {
            forceFormData: true,
            onError: (errors) => {
                if (errors.message) alert(errors.message);
            },
        });
    };

    const statusBadge = (s) => {
        const map = { belum_konfirmasi: 'secondary', sesuai: 'success', mengajukan_perbaikan: 'warning', perlu_perbaikan_ulang: 'destructive' };
        return <Badge variant={map[s] || 'default'}>{s}</Badge>;
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Head title="Detail Data Siswa" />
            <header className="border-b bg-white">
                <div className="mx-auto max-w-5xl px-6 py-4 flex justify-between items-center">
                    <Link href={route('verifikasi.index')} className="text-sm text-primary hover:underline">← Kembali</Link>
                    <Link href={route('verifikasi.cek-status-page')} className="text-sm text-primary hover:underline">Cek Status</Link>
                </div>
            </header>
            <main className="mx-auto max-w-3xl p-6 space-y-6 flex-1 w-full">
                {!canSiswa && (
                    <Alert className="bg-amber-50 border-amber-200">
                        <AlertDescription className="text-amber-800">
                            ⏰ Layanan pengajuan & konfirmasi tutup. Jam layanan: <b>Senin-Jumat 08:00-14:00 WITA</b> (sekarang {jamKerja.now_human} WITA). Saat ini hanya <b>cek data & cek progres</b> 24 jam. {bypassSiswa ? "" : "Admin bisa buka darurat siswa."}
                        </AlertDescription>
                    </Alert>
                )}
                {bypassSiswa && !isBuka && (
                    <Alert className="bg-green-50 border-green-200"><AlertDescription className="text-green-700">✅ Darurat siswa AKTIF — pengajuan dibuka di luar jam kerja (oleh admin).</AlertDescription></Alert>
                )}
                {confirmForm.errors.confirm && <Alert variant="destructive"><AlertDescription>{confirmForm.errors.confirm}</AlertDescription></Alert>}
                {revisionForm.errors.revision && <Alert variant="destructive"><AlertDescription>{revisionForm.errors.revision}</AlertDescription></Alert>}
                {revisionForm.errors.message && <Alert variant="destructive"><AlertDescription>{revisionForm.errors.message}</AlertDescription></Alert>}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">Detail Data Siswa {statusBadge(student.status_verifikasi)}</CardTitle>
                        <CardDescription>Periksa kebenaran data sebelum konfirmasi</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="grid grid-cols-3 gap-2"><span className="text-muted-foreground">NISN</span><span className="col-span-2 font-medium">{student.nisn}</span></div>
                        <div className="grid grid-cols-3 gap-2"><span className="text-muted-foreground">NIS</span><span className="col-span-2">{student.nis || '-'}</span></div>
                        <div className="grid grid-cols-3 gap-2"><span className="text-muted-foreground">Nama Lengkap</span><span className="col-span-2 font-medium">{student.nama_lengkap}</span></div>
                        <div className="grid grid-cols-3 gap-2"><span className="text-muted-foreground">Tempat, Tgl Lahir</span><span className="col-span-2">{student.tempat_lahir}, {student.tanggal_lahir}</span></div>
                        <div className="grid grid-cols-3 gap-2"><span className="text-muted-foreground">Jurusan / Kelas</span><span className="col-span-2">{student.jurusan} / {student.kelas || '-'}</span></div>
                        {latestRevision && latestRevision.status_review === 'pending' && (
                            <Alert className="bg-yellow-50 border-yellow-200"><AlertDescription className="text-yellow-800">Anda memiliki pengajuan pending. Menunggu review admin.</AlertDescription></Alert>
                        )}
                        <div className="flex gap-3 pt-4">
                            <form onSubmit={handleConfirm} className="flex-1">
                                <Button type="submit" disabled={confirmForm.processing || student.status_verifikasi !== 'belum_konfirmasi' || !canSiswa} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50" title={!canSiswa ? 'Hanya buka 08:00-14:00 WITA (atau darurat siswa)' : ''}>Data Sesuai — Konfirmasi</Button>
                            </form>
                            <Button variant="destructive" className="flex-1" onClick={() => setShowForm(!showForm)} disabled={!!latestRevision && latestRevision.status_review === 'pending' || !canSiswa} title={!canSiswa ? 'Pengajuan hanya 08:00-14:00 WITA' : ''}>Data Tidak Sesuai</Button>
                        </div>
                        {!canSiswa && <p className="text-xs text-amber-700 text-center">Pengajuan & konfirmasi hanya 08:00-14:00 WITA (kecuali darurat siswa)</p>}
                    </CardContent>
                </Card>

                {showForm && (
                    <Card>
                        <CardHeader><CardTitle>Form Pengajuan Perbaikan</CardTitle><CardDescription>Isi hanya field yang salah. Minimal 1 dokumen wajib. Klik <span className="font-medium text-primary">Salin dari data lama</span> untuk edit cepat.</CardDescription></CardHeader>
                        <CardContent>
                            <form onSubmit={handleRevision} className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Usulan Nama (jika salah)</Label>
                                        <button type="button" onClick={() => revisionForm.setData('usulan_nama', student.nama_lengkap)} className="text-xs text-primary hover:underline hover:text-primary/80">Salin dari data lama</button>
                                    </div>
                                    <Input value={revisionForm.data.usulan_nama} onChange={e => revisionForm.setData('usulan_nama', e.target.value)} placeholder={student.nama_lengkap} />
                                    {revisionForm.errors.usulan_nama && <p className="text-sm text-destructive">{revisionForm.errors.usulan_nama}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Usulan Tempat Lahir</Label>
                                            <button type="button" onClick={() => revisionForm.setData('usulan_tempat_lahir', student.tempat_lahir)} className="text-xs text-primary hover:underline hover:text-primary/80">Salin dari data lama</button>
                                        </div>
                                        <Input value={revisionForm.data.usulan_tempat_lahir} onChange={e => revisionForm.setData('usulan_tempat_lahir', e.target.value)} placeholder={student.tempat_lahir} />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Usulan Tanggal Lahir</Label>
                                            <button type="button" onClick={() => revisionForm.setData('usulan_tanggal_lahir', student.tanggal_lahir)} className="text-xs text-primary hover:underline hover:text-primary/80">Salin dari data lama</button>
                                        </div>
                                        <Input type="date" value={revisionForm.data.usulan_tanggal_lahir} onChange={e => revisionForm.setData('usulan_tanggal_lahir', e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>File KK (PDF/JPG/PNG max 2MB)</Label>
                                    <Input type="file" onChange={e => revisionForm.setData('file_kk', e.target.files[0])} accept=".pdf,.jpg,.jpeg,.png" />
                                    {revisionForm.errors.file_kk && <p className="text-sm text-destructive">{revisionForm.errors.file_kk}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>File Ijazah SMP</Label>
                                    <Input type="file" onChange={e => revisionForm.setData('file_ijazah_smp', e.target.files[0])} accept=".pdf,.jpg,.jpeg,.png" />
                                </div>
                                <div className="space-y-2">
                                    <Label>File Akta Kelahiran</Label>
                                    <Input type="file" onChange={e => revisionForm.setData('file_akta', e.target.files[0])} accept=".pdf,.jpg,.jpeg,.png" />
                                </div>
                                <Button type="submit" disabled={revisionForm.processing || !canSiswa} className="w-full disabled:opacity-50" title={!canSiswa ? 'Hanya 08:00-14:00 WITA' : ''}>{revisionForm.processing ? 'Mengirim...' : 'Kirim Pengajuan Perbaikan'}</Button>
                                {!canSiswa && <p className="text-xs text-amber-700 text-center">Form terkunci di luar jam kerja</p>}
                            </form>
                        </CardContent>
                    </Card>
                )}
            </main>
            <footer className="py-6 text-center text-xs text-muted-foreground border-t bg-white/60 backdrop-blur">© {new Date().getFullYear()} SMK — Verifikasi Data • Powered by <a href="https://daba.my.id" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">DabaAI</a></footer>
        </div>
    );
}
