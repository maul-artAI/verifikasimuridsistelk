<?php

namespace App\Console\Commands;

use App\Models\DataRevision;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class PurgeRevisionFiles extends Command
{
    protected $signature = 'revisions:purge {--dry-run : Tampilkan yang akan dihapus tanpa menghapus}';

    protected $description = 'Hapus file fisik revisi yang sudah diputus (disetujui/ditolak) demi keamanan data PII';

    public function handle(): int
    {
        $revisions = DataRevision::where('status_review', '!=', 'pending')
            ->where(function ($q) {
                $q->whereNotNull('file_kk')
                    ->orWhereNotNull('file_ijazah_smp')
                    ->orWhereNotNull('file_akta');
            })->get();

        if ($revisions->isEmpty()) {
            $this->info('Tidak ada file sisa. Bersih.');
            return self::SUCCESS;
        }

        $deleted = 0;
        foreach ($revisions as $r) {
            foreach (['file_kk', 'file_ijazah_smp', 'file_akta'] as $field) {
                $path = $r->$field;
                if (!$path) continue;
                if ($this->option('dry-run')) {
                    $this->line("DRY-RUN revisi #{$r->id} {$field}: {$path}");
                    continue;
                }
                try {
                    if (Storage::disk('private')->exists($path)) {
                        Storage::disk('private')->delete($path);
                        $deleted++;
                    }
                } catch (\Throwable $e) {
                    $this->error("Gagal hapus revisi #{$r->id} {$field}: {$e->getMessage()}");
                }
                $r->$field = null;
            }
            if (!$this->option('dry-run')) {
                $r->save();
            }
        }

        $this->info($this->option('dry-run') ? "DRY-RUN selesai: {$revisions->count()} revisi masih menyimpan file." : "Selesai: {$deleted} file dihapus dari {$revisions->count()} revisi.");
        return self::SUCCESS;
    }
}
