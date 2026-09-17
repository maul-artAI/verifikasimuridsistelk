import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye } from 'lucide-react';

export default function Index({ students, majors, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [jurusan, setJurusan] = useState(filters.jurusan || '');

    const apply = () => router.get(route('admin.students.index'), { search, status, jurusan }, { preserveState: true });

    const importForm = useForm({ file: null });
    const submitImport = (e) => { e.preventDefault(); importForm.post(route('admin.students.import'), { forceFormData: true }); };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Manajemen Data Siswa</h2>}>
            <Head title="Data Siswa" />
            <div className="py-6 max-w-7xl mx-auto px-6 space-y-4">
                <Card>
                    <CardHeader><CardTitle>Filter & Aksi</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <Input placeholder="Cari NISN / Nama" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
                            <Select value={status} onChange={e => setStatus(e.target.value)}>
                                <option value="">Semua Status</option>
                                <option value="belum_konfirmasi">Belum Konfirmasi</option>
                                <option value="sesuai">Sesuai</option>
                                <option value="mengajukan_perbaikan">Mengajukan</option>
                                <option value="perlu_perbaikan_ulang">Perlu Ulang</option>
                            </Select>
                            <Select value={jurusan} onChange={e => setJurusan(e.target.value)}>
                                <option value="">Semua Jurusan</option>
                                {majors.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
                            </Select>
                            <Button onClick={apply}>Filter</Button>
                            <a href={route('admin.students.export', { status, jurusan })} className="px-4 py-2 border rounded-md text-sm">Export Excel</a>
                        </div>
                        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm">
                            <p className="font-medium text-blue-800">Butuh template? <a href={route('admin.students.template')} className="underline">Download contoh_import_siswa.xlsx</a> — Header: nisn, nis, nama_lengkap, tempat_lahir, tanggal_lahir (YYYY-MM-DD), jurusan_kode (RPL/ULW/TJKT), kelas, tahun_ajaran</p>
                            <p className="text-blue-600 text-xs mt-1">Contoh jurusan: RPL=Rekayasa Perangkat Lunak, ULW=Usaha Layanan Wisata, TJKT=Teknik Jaringan Komputer dan Telekomunikasi</p>
                        </div>
                        <form onSubmit={submitImport} className="flex gap-2 items-end">
                            <Input type="file" onChange={e => importForm.setData('file', e.target.files[0])} accept=".xlsx,.xls,.csv" />
                            <Button type="submit" disabled={importForm.processing} variant="secondary">Import Excel</Button>
                            <a href={route('admin.students.template')} className="px-4 py-2 border rounded-md text-sm bg-white hover:bg-slate-50">Download Template</a>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <Table>
                            <TableHeader><TableRow><TableHead>NISN</TableHead><TableHead>Nama</TableHead><TableHead>Jurusan</TableHead><TableHead>Kelas</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {students.data.map(s => (
                                    <TableRow key={s.id} className="hover:bg-muted/50">
                                        <TableCell className="font-mono text-xs">{s.nisn}</TableCell>
                                        <TableCell className="font-medium">{s.nama_lengkap}</TableCell>
                                        <TableCell>{s.major?.nama || '-'}</TableCell>
                                        <TableCell>{s.kelas}</TableCell>
                                        <TableCell><Badge variant={s.status_verifikasi === 'sesuai' ? 'success' : s.status_verifikasi === 'belum_konfirmasi' ? 'secondary' : s.status_verifikasi === 'perlu_perbaikan_ulang' ? 'destructive' : 'warning'}>{s.status_verifikasi}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <Link href={route('admin.students.show', s.id)}>
                                                <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-1" />Detail</Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="flex gap-2 mt-4 flex-wrap">
                            {students.links.map((l, i) => (
                                <Link key={i} href={l.url || '#'} dangerouslySetInnerHTML={{ __html: l.label }} className={`px-3 py-1 text-sm border rounded ${l.active ? 'bg-primary text-white' : 'bg-white'}`} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
