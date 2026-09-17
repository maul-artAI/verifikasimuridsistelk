import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';

const statusVariant = (s) => {
    const m = { belum_konfirmasi: 'secondary', sesuai: 'success', mengajukan_perbaikan: 'warning', perlu_perbaikan_ulang: 'destructive' };
    return m[s] || 'default';
};
const reviewVariant = (s) => ({ pending: 'warning', disetujui: 'success', ditolak: 'destructive' }[s] || 'default');

export default function Show({ student, majors, revisions, auditLogs, flash }) {
    const [editing, setEditing] = useState(false);
    const [editingData, setEditingData] = useState(false);
    const form = useForm({ status_verifikasi: student.status_verifikasi });
    const editForm = useForm({
        nama_lengkap: student.nama_lengkap,
        tempat_lahir: student.tempat_lahir,
        tanggal_lahir: student.tanggal_lahir,
        jurusan_id: student.jurusan?.id || (majors[0]?.id || ''),
        kelas: student.kelas || '',
        tahun_ajaran: student.tahun_ajaran || '',
        nis: student.nis || '',
    });

    const submitStatus = (e) => {
        e.preventDefault();
        form.patch(route('admin.students.updateStatus', student.id), { preserveScroll: true, onSuccess: () => setEditing(false) });
    };
    const submitEdit = (e) => {
        e.preventDefault();
        editForm.put(route('admin.students.update', student.id), { preserveScroll: true, onSuccess: () => setEditingData(false) });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Detail Siswa</h2>}>
            <Head title={`Detail ${student.nama_lengkap}`} />
            <div className="py-6 max-w-6xl mx-auto px-6 space-y-6">
                <div className="flex gap-2">
                    <Link href={route('admin.students.index')}><Button variant="outline" size="sm">← Kembali</Button></Link>
                    <Link href={route('admin.revisions.index')}><Button variant="secondary" size="sm">Ke Review</Button></Link>
                </div>

                {flash?.success && <Alert className="bg-green-50 border-green-200"><AlertDescription className="text-green-700">{flash.success}</AlertDescription></Alert>}

                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">{student.nama_lengkap} <Badge variant={statusVariant(student.status_verifikasi)}>{student.status_verifikasi}</Badge></CardTitle>
                                    <CardDescription>NISN {student.nisn} {student.nis ? `· NIS ${student.nis}` : ''}</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setEditingData(!editingData)}>{editingData ? 'Batal' : 'Edit Data'}</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {!editingData ? (
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><p className="text-muted-foreground">Tempat, Tanggal Lahir</p><p className="font-medium">{student.tempat_lahir}, {student.tanggal_lahir}</p></div>
                                    <div><p className="text-muted-foreground">Jurusan</p><p className="font-medium">{student.jurusan ? `${student.jurusan.nama} (${student.jurusan.kode})` : '-'}</p></div>
                                    <div><p className="text-muted-foreground">Kelas</p><p className="font-medium">{student.kelas || '-'}</p></div>
                                    <div><p className="text-muted-foreground">Tahun Ajaran</p><p className="font-medium">{student.tahun_ajaran || '-'}</p></div>
                                    <div><p className="text-muted-foreground">Verified At</p><p className="font-medium">{student.verified_at || '-'}</p></div>
                                    <div><p className="text-muted-foreground">Dibuat</p><p className="font-medium">{student.created_at}</p></div>
                                </div>
                            ) : (
                                <form onSubmit={submitEdit} className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className="text-xs text-muted-foreground">Nama Lengkap</label><input className="w-full border rounded px-3 py-2 text-sm" value={editForm.data.nama_lengkap} onChange={e=>editForm.setData('nama_lengkap', e.target.value)} /></div>
                                        <div><label className="text-xs text-muted-foreground">Tempat Lahir</label><input className="w-full border rounded px-3 py-2 text-sm" value={editForm.data.tempat_lahir} onChange={e=>editForm.setData('tempat_lahir', e.target.value)} /></div>
                                        <div><label className="text-xs text-muted-foreground">Tanggal Lahir</label><input type="date" className="w-full border rounded px-3 py-2 text-sm" value={editForm.data.tanggal_lahir} onChange={e=>editForm.setData('tanggal_lahir', e.target.value)} /></div>
                                        <div><label className="text-xs text-muted-foreground">Jurusan</label><select className="w-full border rounded px-3 py-2 text-sm" value={editForm.data.jurusan_id} onChange={e=>editForm.setData('jurusan_id', e.target.value)}>{majors.map(m=><option key={m.id} value={m.id}>{m.kode} - {m.nama}</option>)}</select></div>
                                        <div><label className="text-xs text-muted-foreground">Kelas</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="XII RPL 1" value={editForm.data.kelas} onChange={e=>editForm.setData('kelas', e.target.value)} /></div>
                                        <div><label className="text-xs text-muted-foreground">Tahun Ajaran</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="2025/2026" value={editForm.data.tahun_ajaran} onChange={e=>editForm.setData('tahun_ajaran', e.target.value)} /></div>
                                        <div className="col-span-2"><label className="text-xs text-muted-foreground">NIS</label><input className="w-full border rounded px-3 py-2 text-sm" value={editForm.data.nis} onChange={e=>editForm.setData('nis', e.target.value)} /></div>
                                    </div>
                                    {Object.keys(editForm.errors).map(k=> <p key={k} className="text-xs text-destructive">{editForm.errors[k]}</p>)}
                                    <div className="flex gap-2"><Button type="submit" size="sm" disabled={editForm.processing}>Simpan Perubahan</Button><Button type="button" variant="outline" size="sm" onClick={()=>setEditingData(false)}>Batal</Button></div>
                                </form>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Aksi Admin</CardTitle><CardDescription>Ubah status manual jika perlu</CardDescription></CardHeader>
                        <CardContent className="space-y-3">
                            {!editing ? (
                                <>
                                    <p className="text-sm">Status saat ini: <Badge variant={statusVariant(student.status_verifikasi)}>{student.status_verifikasi}</Badge></p>
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => setEditing(true)}>Ubah Status</Button>
                                    <Link href={`/admin/revisions?status=pending`} className="block"><Button variant="secondary" size="sm" className="w-full">Lihat Antrean Revisi</Button></Link>
                                </>
                            ) : (
                                <form onSubmit={submitStatus} className="space-y-3">
                                    <Select value={form.data.status_verifikasi} onChange={e => form.setData('status_verifikasi', e.target.value)}>
                                        <option value="belum_konfirmasi">belum_konfirmasi</option>
                                        <option value="sesuai">sesuai</option>
                                        <option value="mengajukan_perbaikan">mengajukan_perbaikan</option>
                                        <option value="perlu_perbaikan_ulang">perlu_perbaikan_ulang</option>
                                    </Select>
                                    {form.errors.status_verifikasi && <p className="text-sm text-destructive">{form.errors.status_verifikasi}</p>}
                                    <div className="flex gap-2">
                                        <Button type="submit" size="sm" disabled={form.processing}>Simpan</Button>
                                        <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>Batal</Button>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader><CardTitle>Riwayat Pengajuan Perbaikan ({revisions.length})</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {revisions.length === 0 && <p className="text-sm text-muted-foreground">Belum ada pengajuan.</p>}
                        {revisions.map(r => (
                            <div key={r.id} className="border rounded-lg p-4 space-y-2">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-medium">#{r.id} · {new Date(r.created_at).toLocaleString('id-ID')}</span>
                                    <Badge variant={reviewVariant(r.status_review)}>{r.status_review}</Badge>
                                </div>
                                <div className="grid md:grid-cols-3 gap-2 text-sm">
                                    <div><span className="text-muted-foreground">Nama:</span> <span className={r.usulan_nama ? 'font-medium text-primary' : ''}>{r.usulan_nama || '-'}</span></div>
                                    <div><span className="text-muted-foreground">Tempat:</span> <span className={r.usulan_tempat_lahir ? 'font-medium text-primary' : ''}>{r.usulan_tempat_lahir || '-'}</span></div>
                                    <div><span className="text-muted-foreground">Tgl Lahir:</span> <span className={r.usulan_tanggal_lahir ? 'font-medium text-primary' : ''}>{r.usulan_tanggal_lahir || '-'}</span></div>
                                </div>
                                <div className="flex gap-2 text-xs">
                                    {r.files.kk && <a href={r.files.kk} target="_blank" rel="noopener" className="underline text-primary">KK (5m)</a>}
                                    {r.files.ijazah && <a href={r.files.ijazah} target="_blank" rel="noopener" className="underline text-primary">Ijazah SMP (5m)</a>}
                                    {r.files.akta && <a href={r.files.akta} target="_blank" rel="noopener" className="underline text-primary">Akta (5m)</a>}
                                    {!r.files.kk && !r.files.ijazah && !r.files.akta && <span className="text-muted-foreground">Tidak ada file</span>}
                                </div>
                                {r.catatan_admin && <div className="bg-red-50 border border-red-200 rounded p-2 text-sm"><b>Catatan Admin:</b> {r.catatan_admin}</div>}
                                <div className="text-xs text-muted-foreground">Reviewer: {r.reviewer || '-'} {r.reviewed_at ? `· ${r.reviewed_at}` : ''}</div>
                                {r.status_review === 'pending' && <Link href={route('admin.revisions.show', r.id)}><Button size="sm" className="mt-1">Buka Review Side-by-Side</Button></Link>}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Audit Log</CardTitle><CardDescription>Jejak perubahan status & revisi oleh siswa/admin</CardDescription></CardHeader>
                    <CardContent className="space-y-2">
                        {auditLogs.length === 0 && <p className="text-sm text-muted-foreground">Belum ada log.</p>}
                        {auditLogs.map(l => (
                            <div key={l.id} className="border rounded p-3 text-sm flex justify-between">
                                <div><span className="font-mono text-xs bg-muted px-1 rounded">{l.action}</span> <span className="text-muted-foreground">oleh {l.performed_by}</span><div className="text-xs mt-1">{l.created_at}</div></div>
                                <div className="text-xs max-w-[50%] truncate">{JSON.stringify(l.new_values || l.old_values || {}).slice(0, 120)}</div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
