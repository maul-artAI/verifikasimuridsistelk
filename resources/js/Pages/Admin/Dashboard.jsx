import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Dashboard({ stats, perJurusan }) {
    const { props } = usePage();
    const jamKerja = props.jamKerja;
    const isBuka = jamKerja?.is_buka ?? true;
    const bypassAdmin = jamKerja?.bypass_admin ?? jamKerja?.bypass ?? false;
    const bypassSiswa = jamKerja?.bypass_siswa ?? false;
    const canAdmin = isBuka || bypassAdmin;
    const canSiswa = isBuka || bypassSiswa;
    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Dashboard Verifikasi</h2>}>
            <Head title="Admin Dashboard" />
            <div className="py-6">
                <div className="mx-auto max-w-7xl px-6 space-y-6">
                    <Card className={isBuka ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-sm flex items-center gap-2">{isBuka ? "🟢 Jam layanan BUKA" : "🔴 Jam layanan TUTUP"} <span className="font-mono text-xs border rounded px-2 py-0.5 bg-white">{jamKerja.jam_buka}-{jamKerja.jam_tutup} WITA {jamKerja.now_human} WITA</span></p>
                                    <p className="text-xs text-muted-foreground mt-1">Cek data & cek progres: <b>24 jam</b>. Pengajuan/konfirmasi siswa & approval admin: <b>08:00-14:00 WITA</b></p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full border ${isBuka ? "bg-green-100 border-green-200 text-green-700" : "bg-amber-100 border-amber-200 text-amber-700"}`}>{isBuka ? "Buka" : "Tutup"}</span>
                            </div>
                            <div className="grid md:grid-cols-2 gap-3">
                                <div className="flex items-center justify-between bg-white border rounded-lg px-3 py-2">
                                    <div><p className="text-sm font-medium">Darurat Admin {bypassAdmin && <span className="text-green-600">• AKTIF</span>}</p><p className="text-xs text-muted-foreground">Admin bisa approve/edit di luar jam</p></div>
                                    <button onClick={() => router.post(route('admin.jamkerja.bypassAdmin'))} className={`px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm ${bypassAdmin ? "bg-green-600 text-white border-green-600" : "bg-white hover:bg-slate-50"}`}>{bypassAdmin ? "Matikan" : "Buka Admin"}</button>
                                </div>
                                <div className="flex items-center justify-between bg-white border rounded-lg px-3 py-2">
                                    <div><p className="text-sm font-medium">Darurat Siswa {bypassSiswa && <span className="text-green-600">• AKTIF</span>}</p><p className="text-xs text-muted-foreground">Siswa bisa ajukan/konfirmasi di luar jam</p></div>
                                    <button onClick={() => router.post(route('admin.jamkerja.bypassSiswa'))} className={`px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm ${bypassSiswa ? "bg-green-600 text-white border-green-600" : "bg-white hover:bg-slate-50"}`}>{bypassSiswa ? "Matikan" : "Buka Siswa"}</button>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">Darurat siswa: <b>hanya admin</b> yang bisa buka (global, semua siswa). Darurat admin: untuk sesi admin ini + global.</p>
                        </CardContent>
                    </Card>
                    {props.flash?.success && <Alert className="bg-green-50 border-green-200"><AlertDescription className="text-green-700">{props.flash.success}</AlertDescription></Alert>}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Siswa</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Belum Konfirmasi</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{stats.belum}</div></CardContent></Card>
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Sesuai (Valid)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{stats.sesuai}</div></CardContent></Card>
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Mengajukan Perbaikan</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{stats.mengajukan}</div></CardContent></Card>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <Card><CardHeader><CardTitle>Perlu Perbaikan Ulang (Ditolak)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{stats.perlu_ulang}</div><div className="text-sm text-muted-foreground">Pending review: {stats.pending_review}</div></CardContent></Card>
                        <Card><CardHeader><CardTitle>Per Jurusan</CardTitle></CardHeader><CardContent className="space-y-2">{perJurusan.map(j => <div key={j.jurusan} className="flex justify-between text-sm"><span>{j.jurusan}</span><span className="font-medium">{j.total}</span></div>)}</CardContent></Card>
                    </div>
                    <div className="flex gap-3">
                        <Link href={route('admin.students.index')} className="px-4 py-2 bg-primary text-white rounded-md text-sm">Kelola Data Siswa</Link>
                        <Link href={route('admin.revisions.index')} className="px-4 py-2 border rounded-md text-sm">Tinjau Perbaikan ({stats.pending_review})</Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
