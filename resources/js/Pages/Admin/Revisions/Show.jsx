import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';

export default function Show({ revision, student }) {
    const approveForm = useForm({});
    const rejectForm = useForm({ catatan_admin: '' });
    const [showReject, setShowReject] = useState(false);

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Review #{revision.id}</h2>}>
            <Head title="Review Detail" />
            <div className="py-6 max-w-6xl mx-auto px-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle>Data Lama</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div><span className="text-muted-foreground">Nama:</span> {student.nama_lengkap}</div>
                            <div><span className="text-muted-foreground">Tempat Lahir:</span> {student.tempat_lahir}</div>
                            <div><span className="text-muted-foreground">Tanggal Lahir:</span> {student.tanggal_lahir}</div>
                            <div><span className="text-muted-foreground">Jurusan:</span> {student.jurusan}</div>
                            <div><span className="text-muted-foreground">NISN:</span> {student.nisn}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-primary">
                        <CardHeader><CardTitle>Data Usulan Baru</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div><span className="text-muted-foreground">Nama:</span> <span className={revision.usulan_nama ? 'font-bold text-primary' : ''}>{revision.usulan_nama || '-'}</span></div>
                            <div><span className="text-muted-foreground">Tempat:</span> <span className={revision.usulan_tempat_lahir ? 'font-bold text-primary' : ''}>{revision.usulan_tempat_lahir || '-'}</span></div>
                            <div><span className="text-muted-foreground">Tgl Lahir:</span> <span className={revision.usulan_tanggal_lahir ? 'font-bold text-primary' : ''}>{revision.usulan_tanggal_lahir || '-'}</span></div>
                            <div className="pt-2 space-y-2">
                                {[
                                    {key:'file_kk', label:'KK', url: revision.file_kk_url || (revision.file_kk ? route('admin.revisions.file', [revision.id, 'file_kk']) : null)},
                                    {key:'file_ijazah_smp', label:'Ijazah SMP', url: revision.file_ijazah_url || (revision.file_ijazah_smp ? route('admin.revisions.file', [revision.id, 'file_ijazah_smp']) : null)},
                                    {key:'file_akta', label:'Akta', url: revision.file_akta_url || (revision.file_akta ? route('admin.revisions.file', [revision.id, 'file_akta']) : null)},
                                ].map(item => item.url ? (
                                    <div key={item.key}><a href={item.url} target="_blank" rel="noopener" className="text-primary underline text-sm">{item.label} — Preview (5 menit)</a></div>
                                ) : <div key={item.key} className="text-xs text-muted-foreground">{item.key}: tidak ada</div>)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {revision.status_review !== 'pending' ? (
                    <Alert><AlertDescription>Status sudah: {revision.status_review} — {revision.catatan_admin || '-'}</AlertDescription></Alert>
                ) : (
                    <Card>
                        <CardHeader><CardTitle>Aksi Review</CardTitle></CardHeader>
                        <CardContent className="flex gap-3">
                            <form onSubmit={e => { e.preventDefault(); approveForm.post(route('admin.revisions.approve', revision.id)); }} className="flex-1">
                                <Button type="submit" disabled={approveForm.processing} className="w-full bg-green-600 hover:bg-green-700">Approve — Timpa Data</Button>
                            </form>
                            <Button variant="destructive" className="flex-1" onClick={() => setShowReject(!showReject)}>Reject</Button>
                        </CardContent>
                        {showReject && (
                            <CardContent>
                                <form onSubmit={e => { e.preventDefault(); rejectForm.post(route('admin.revisions.reject', revision.id)); }} className="space-y-3">
                                    <Label>Catatan Alasan Ditolak (wajib)</Label>
                                    <Textarea value={rejectForm.data.catatan_admin} onChange={e => rejectForm.setData('catatan_admin', e.target.value)} placeholder="Mis: File akta buram, silakan upload ulang..." />
                                    {rejectForm.errors.catatan_admin && <p className="text-sm text-destructive">{rejectForm.errors.catatan_admin}</p>}
                                    <Button type="submit" variant="destructive" disabled={rejectForm.processing}>Kirim Penolakan</Button>
                                </form>
                            </CardContent>
                        )}
                    </Card>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
