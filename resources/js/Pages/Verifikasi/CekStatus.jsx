import { Head, useForm, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, ArrowLeft } from 'lucide-react';
import { usePage } from '@inertiajs/react';

export default function CekStatus({ captchaQuestion, flash }) {
    const { data, setData, post, processing, errors } = useForm({ nisn: '', tanggal_lahir: '', captcha: '', website: '', _ts: Date.now() });
    const submit = (e) => {
        e.preventDefault();
        if (data.website) return;
        if (Date.now() - data._ts < 1200) { setTimeout(()=>post(route('verifikasi.cek-status')), 600); return; }
        post(route('verifikasi.cek-status'));
    };
    return (
        <div className="min-h-screen verifikasi-bg flex flex-col">
            <Head title="Cek Status Pengajuan" />
            <header className="glass border-b"><div className="mx-auto max-w-5xl px-6 py-4 flex justify-between items-center"><Link href={route('verifikasi.index')} className="inline-flex items-center gap-2 text-sm font-medium bg-white border rounded-full px-4 py-2 shadow-sm"><ArrowLeft className="h-4 w-4" /> Verifikasi</Link><span className="font-semibold flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Cek Status</span></div></header>
            <main className="flex-1 flex items-center justify-center p-6">
                <Card className="w-full max-w-md verifikasi-card animate-in">
                    <div className="h-1.5 verifikasi-header rounded-t-xl" />
                    <CardHeader><CardTitle>Cek Status Pengajuan</CardTitle><CardDescription>Masukkan NISN & Tgl Lahir untuk melihat status terkini — <span className="text-green-700 font-medium">24 jam</span></CardDescription></CardHeader>
                    <CardContent>
                        {errors.message && <Alert variant="destructive"><AlertDescription>{errors.message}</AlertDescription></Alert>}
                        {flash?.success && <Alert className="mb-4 bg-green-50 border-green-200"><AlertDescription className="text-green-700">{flash.success}</AlertDescription></Alert>}
                        <form onSubmit={submit} className="space-y-5">
                            <div className="hidden" aria-hidden="true"><Input value={data.website} onChange={e=>setData('website', e.target.value)} tabIndex={-1} autoComplete="off" /></div>
                            <div className="space-y-2"><Label className="font-medium">NISN</Label><Input value={data.nisn} onChange={e => setData('nisn', e.target.value.replace(/\D/g,''))} placeholder="10 digit" maxLength={10} className="h-11 font-mono" />{errors.nisn && <p className="text-sm text-destructive">{errors.nisn}</p>}</div>
                            <div className="space-y-2"><Label className="font-medium">Tanggal Lahir</Label><Input type="date" value={data.tanggal_lahir} onChange={e => setData('tanggal_lahir', e.target.value)} className="h-11" />{errors.tanggal_lahir && <p className="text-sm text-destructive">{errors.tanggal_lahir}</p>}</div>
                            <div className="space-y-2"><Label className="font-medium">Captcha • <span className="font-mono font-bold text-primary bg-blue-50 border rounded px-2 py-0.5">{captchaQuestion}</span></Label><Input value={data.captcha} onChange={e => setData('captcha', e.target.value)} placeholder="Jawaban" className="h-11" inputMode="numeric" />{errors.captcha && <p className="text-sm text-destructive">{errors.captcha}</p>}</div>
                            <Button type="submit" disabled={processing} className="w-full h-11 text-base font-semibold shadow-lg">{processing ? 'Mengecek...' : 'Cek Status'}</Button>
                        </form>
                    </CardContent>
                </Card>
            </main>
            <footer className="py-6 text-center text-xs text-muted-foreground border-t bg-white/60 backdrop-blur">© {new Date().getFullYear()} SMK — Verifikasi Data • Powered by <a href="https://daba.my.id" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">DabaAI</a></footer>
        </div>
    );
}
