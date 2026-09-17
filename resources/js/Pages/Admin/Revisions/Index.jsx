import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useState } from 'react';

export default function Index({ revisions, filters }) {
    const [status, setStatus] = useState(filters.status || 'pending');
    const apply = () => router.get(route('admin.revisions.index'), { status }, { preserveState: true });
    const map = { pending: 'warning', disetujui: 'success', ditolak: 'destructive' };
    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Tinjauan Perbaikan</h2>}>
            <Head title="Review Revisions" />
            <div className="py-6 max-w-7xl mx-auto px-6 space-y-4">
                <div className="flex gap-2">
                    <Select value={status} onChange={e => setStatus(e.target.value)}>
                        <option value="pending">Pending</option>
                        <option value="disetujui">Disetujui</option>
                        <option value="ditolak">Ditolak</option>
                    </Select>
                    <Button onClick={apply} variant="secondary">Filter</Button>
                </div>
                {revisions.data.map(r => (
                    <Card key={r.id}>
                        <CardContent className="pt-6 flex justify-between items-start">
                            <div className="space-y-1 text-sm">
                                <div className="font-medium">{r.student.nama_lengkap} — {r.student.nisn} <Badge variant={map[r.status_review]}>{r.status_review}</Badge></div>
                                <div className="text-muted-foreground">{r.student.major?.nama} | {new Date(r.created_at).toLocaleString('id-ID')}</div>
                                <div>Usulan: {r.usulan_nama || '-'} | {r.usulan_tempat_lahir || '-'} | {r.usulan_tanggal_lahir || '-'}</div>
                                {r.catatan_admin && <div className="text-destructive">Catatan: {r.catatan_admin}</div>}
                            </div>
                            <Link href={route('admin.revisions.show', r.id)}><Button size="sm">Review</Button></Link>
                        </CardContent>
                    </Card>
                ))}
                <div className="flex gap-2 flex-wrap">
                    {revisions.links.map((l, i) => <Link key={i} href={l.url || '#'} dangerouslySetInnerHTML={{ __html: l.label }} className={`px-3 py-1 text-sm border rounded ${l.active ? 'bg-primary text-white' : 'bg-white'}`} />)}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
