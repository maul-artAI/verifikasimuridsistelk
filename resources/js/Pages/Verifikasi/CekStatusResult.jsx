import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function CekStatusResult({ student, revisions }) {
    const variantMap = { belum_konfirmasi: 'secondary', sesuai: 'success', mengajukan_perbaikan: 'warning', perlu_perbaikan_ulang: 'destructive' };
    const reviewMap = { pending: 'warning', disetujui: 'success', ditolak: 'destructive' };
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Head title="Hasil Cek Status" />
            <header className="border-b bg-white"><div className="mx-auto max-w-3xl px-6 py-4 flex justify-between"><Link href={route('verifikasi.cek-status-page')} className="text-sm text-primary hover:underline">← Cek Lagi</Link><Link href={route('verifikasi.index')} className="text-sm text-primary hover:underline">Verifikasi</Link></div></header>
            <main className="mx-auto max-w-3xl p-6 space-y-6 flex-1 w-full">
                <Card>
                    <CardHeader><CardTitle className="flex gap-2 items-center">{student.nama_lengkap} <Badge variant={variantMap[student.status_verifikasi] || 'default'}>{student.status_verifikasi}</Badge></CardTitle><CardDescription>NISN: {student.nisn}</CardDescription></CardHeader>
                    <CardContent>
                        {student.status_verifikasi === 'sesuai' && <p className="text-green-700 bg-green-50 p-3 rounded">✓ Data Anda sudah terkonfirmasi SESUAI. Terima kasih!</p>}
                        {student.status_verifikasi === 'belum_konfirmasi' && <div><p className="text-yellow-700">Belum konfirmasi. Silakan verifikasi.</p><Link href={route('verifikasi.index')}><Button size="sm" className="mt-2">Verifikasi Sekarang</Button></Link></div>}
                        {student.status_verifikasi === 'perlu_perbaikan_ulang' && <p className="text-destructive bg-red-50 p-3 rounded">Pengajuan sebelumnya ditolak. Silakan ajukan ulang dengan dokumen yang lebih jelas.</p>}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Riwayat Pengajuan</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {revisions.length === 0 && <p className="text-sm text-muted-foreground">Belum ada pengajuan.</p>}
                        {revisions.map(r => (
                            <div key={r.id} className="border rounded-lg p-4 space-y-2">
                                <div className="flex justify-between"><span className="text-sm font-medium">#{r.id} — {new Date(r.created_at).toLocaleDateString('id-ID')}</span><Badge variant={reviewMap[r.status_review]}>{r.status_review}</Badge></div>
                                <div className="text-sm space-y-1">
                                    {r.usulan_nama && <div>Nama: {r.usulan_nama}</div>}
                                    {r.usulan_tempat_lahir && <div>Tempat: {r.usulan_tempat_lahir}</div>}
                                    {r.usulan_tanggal_lahir && <div>Tgl Lahir: {r.usulan_tanggal_lahir}</div>}
                                </div>
                                {r.catatan_admin && <div className="bg-red-50 border border-red-200 rounded p-2 text-sm"><span className="font-medium">Catatan Admin:</span> {r.catatan_admin}</div>}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </main>
            <footer className="py-6 text-center text-xs text-muted-foreground border-t bg-white/60 backdrop-blur">© {new Date().getFullYear()} SMK — Verifikasi Data • Powered by <a href="https://daba.my.id" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">DabaAI</a></footer>
        </div>
    );
}
