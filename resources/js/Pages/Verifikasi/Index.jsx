import { Head, useForm, Link, usePage } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap, ShieldCheck, Search, Sparkles, ArrowRight, Clock } from 'lucide-react';

export default function Index({ captchaQuestion, flash }) {
    const { props } = usePage();
    const jamKerja = props.jamKerja;
    const isBuka = jamKerja?.is_buka ?? true;
    const { data, setData, post, processing, errors } = useForm({
        nisn: '',
        tanggal_lahir: '',
        captcha: '',
        website: '', // honeypot
        _ts: Date.now(),
    });

    const submit = (e) => {
        e.preventDefault();
        // honeypot harus kosong, timestamp minimal 2 detik
        if (data.website) return;
        if (Date.now() - data._ts < 1500) {
            // terlalu cepat = bot
            setTimeout(() => post(route('verifikasi.verify')), 800);
            return;
        }
        post(route('verifikasi.verify'));
    };

    return (
        <div className="min-h-screen verifikasi-bg flex flex-col">
            <Head title="Verifikasi Data Siswa" />
            <header className="sticky top-0 z-10 glass border-b">
                <div className="mx-auto max-w-6xl px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl verifikasi-header flex items-center justify-center text-white shadow-lg">
                            <GraduationCap className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-800 leading-none">Portal Verifikasi</h1>
                            <p className="text-xs text-muted-foreground">SMK • Data Siswa </p>
                        </div>
                    </div>
                    <Link href={route('verifikasi.cek-status-page')} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors bg-white border rounded-full px-4 py-2 shadow-sm hover:shadow">
                        <Search className="h-4 w-4" /> Cek Status
                    </Link>
                </div>
            </header>

            {!isBuka && (
                <div className="mx-auto max-w-5xl px-6 pt-4">
                    <Alert className="bg-amber-50 border-amber-200">
                        <AlertDescription className="text-amber-800 flex items-center gap-2"><Clock className="h-4 w-4" /> Layanan pengajuan & konfirmasi tutup. Jam layanan: <b>Senin-Jumat 08:00-14:00 WITA</b> (sekarang {jamKerja.now_human} WITA). Cek data tetap buka 24 jam.</AlertDescription>
                    </Alert>
                </div>
            )}
            <main className="flex-1 flex items-center justify-center p-6 py-12">
                <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
                    {/* Left hero */}
                    <div className="hidden lg:block space-y-6 animate-in">
                        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-3 py-1 text-xs font-medium">
                            <Sparkles className="h-3 w-3" /> Verifikasi Data Siswa 2026/2027
                        </div>
                        <div>
                            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                                Pastikan <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Data Anda</span> benar
                            </h2>
                            <p className="mt-3 text-slate-600 leading-relaxed">
                                Validasi mandiri NISN & tanggal lahir. Cepat, aman, dan terhubung langsung dengan data Dapodik sekolah.
                            </p>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                            {[
                                { k: 'RPL', v: 'Rekayasa Perangkat Lunak' },
                                { k: 'ULW', v: 'Usaha Layanan Wisata' },
                                { k: 'TJKT', v: 'Teknik Jaringan Komputer dan Telekomunikasi' },
                            ].map(j => (
                                <div key={j.k} className="bg-white rounded-xl border p-3 shadow-sm">
                                    <div className="font-bold text-slate-900">{j.k}</div>
                                    <div className="text-xs text-muted-foreground">{j.v}</div>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ShieldCheck className="h-4 w-4 text-green-600" /> Data terenkripsi & hanya untuk verifikasi
                        </div>
                    </div>

                    {/* Right card */}
                    <Card className="w-full max-w-md mx-auto verifikasi-card animate-in">
                        <div className="h-1.5 verifikasi-header rounded-t-xl" />
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-xl"><Search className="h-5 w-5 text-primary" /> Verifikasi Data</CardTitle>
                            <CardDescription>Masukkan NISN dan Tanggal Lahir sesuai Dapodik</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {flash?.success && <Alert className="mb-4 border-green-200 bg-green-50"><AlertDescription className="text-green-700">{flash.success}</AlertDescription></Alert>}
                            <form onSubmit={submit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="nisn" className="font-medium">NISN <span className="text-muted-foreground font-normal">(10 digit)</span></Label>
                                    <Input id="nisn" value={data.nisn} onChange={e => setData('nisn', e.target.value.replace(/\D/g,''))} placeholder="0012345678" maxLength={10} className="h-11 input-focus font-mono tracking-widest" />
                                    {errors.nisn && <p className="text-sm text-destructive animate-in">{errors.nisn}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tgl" className="font-medium">Tanggal Lahir</Label>
                                    <Input id="tgl" type="date" value={data.tanggal_lahir} onChange={e => setData('tanggal_lahir', e.target.value)} className="h-11 input-focus" />
                                    {errors.tanggal_lahir && <p className="text-sm text-destructive">{errors.tanggal_lahir}</p>}
                                </div>
                                {/* honeypot - hidden from humans */}
                                <div className="hidden" aria-hidden="true">
                                    <Input value={data.website} onChange={e => setData('website', e.target.value)} autoComplete="off" tabIndex={-1} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-medium">Captcha • <span className="font-mono font-bold text-primary bg-blue-50 border border-blue-200 rounded px-2 py-0.5">{captchaQuestion}</span></Label>
                                    <Input value={data.captcha} onChange={e => setData('captcha', e.target.value)} placeholder="Jawaban angka" className="h-11 input-focus" inputMode="numeric" />
                                    {errors.captcha && <p className="text-sm text-destructive">{errors.captcha}</p>}
                                </div>
                                <Button type="submit" disabled={processing} className="w-full h-11 text-base font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all">
                                    {processing ? 'Memverifikasi...' : <span className="inline-flex items-center gap-2">Cek Data Saya <ArrowRight className="h-4 w-4" /></span>}
                                </Button>
                                <p className="text-xs text-center text-muted-foreground">Dengan mengecek, Anda menyetujui data digunakan hanya untuk verifikasi ijazah.</p>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </main>
            <footer className="py-6 text-center text-xs text-muted-foreground border-t bg-white/60 backdrop-blur">© {new Date().getFullYear()} SMK — Verifikasi Data • Powered by <a href="https://daba.my.id" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">DabaAI</a></footer>
        </div>
    );
}
