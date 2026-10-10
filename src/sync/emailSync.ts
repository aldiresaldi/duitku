import { db } from '../db/database';
import { initializeMonth } from '../db/seed';

const KEY = 'duitku-sync-config';

export interface SyncConfig {
  url: string;
  token: string;
}

interface RemoteTx {
  refId: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  source: string;
}

export function loadConfig(): SyncConfig | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SyncConfig) : null;
  } catch {
    return null;
  }
}

export function saveConfig(cfg: SyncConfig | null) {
  if (cfg) localStorage.setItem(KEY, JSON.stringify(cfg));
  else localStorage.removeItem(KEY);
}

/**
 * Periode gajian: gaji masuk tanggal 29 (slip dikirim ~28).
 * Transaksi tanggal >= 29 masuk periode bulan berikutnya
 * (29 Sep -> Oktober, 29 Okt -> November). Slip gaji dihitung mulai tanggal 28.
 */
const PAY_DAY = 29;

export function periodOf(d: Date, source: string): { month: number; year: number } {
  const cutoff = source === 'bipo' ? PAY_DAY - 1 : PAY_DAY;
  let month = d.getMonth() + 1;
  let year = d.getFullYear();
  if (d.getDate() >= cutoff) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return { month, year };
}

/** Returns number of newly imported transactions. */
export async function syncFromEmail(cfg: SyncConfig): Promise<number> {
  const res = await fetch(`${cfg.url}?token=${encodeURIComponent(cfg.token)}`);
  const json = await res.json();
  if (json.error) throw new Error('Token tidak valid');

  const remote: RemoteTx[] = json.transactions ?? [];
  let added = 0;

  for (const r of remote) {
    const d = new Date(r.date);
    const { month, year } = periodOf(d, r.source);

    const existing = await db.transactions.where('refId').equals(r.refId).first();
    if (existing) {
      // Pindahkan transaksi lama jika periodenya berbeda.
      if (existing.month !== month || existing.year !== year) {
        await initializeMonth(month, year);
        await db.transactions.update(existing.id!, { month, year });
      }
      continue;
    }

    await initializeMonth(month, year);

    // Slip gaji: jangan dobel kalau gaji bulan itu sudah ada dari template.
    if (r.source === 'bipo') {
      const hasSalary = (await db.transactions
        .where('[month+year]')
        .equals([month, year])
        .toArray()).some((t) => t.type === 'income' && /^gaji/i.test(t.description));
      if (hasSalary) continue;
    }

    // Hindari dobel: entri manual/lama dengan nominal sama dan waktu berdekatan (±10 menit).
    const sameMonth = await db.transactions.where('[month+year]').equals([month, year]).toArray();
    const isDup = sameMonth.some(
      (t) =>
        t.type === r.type &&
        t.amount === r.amount &&
        Math.abs(new Date(t.createdAt).getTime() - d.getTime()) < 10 * 60 * 1000 &&
        (t.refId?.startsWith('manual-') || t.description === r.description)
    );
    if (isDup) continue;

    await db.transactions.add({
      description: r.description,
      amount: r.amount,
      type: r.type,
      note:
        r.description === 'Top up GoPay'
          ? 'Isi dompet GoPay (rincian pemakaian tidak tercatat)'
          : r.source === 'livin'
            ? 'Otomatis dari email Livin\u2019'
            : r.source === 'bca'
              ? 'Otomatis dari email BCA'
              : 'Otomatis dari email',
      month,
      year,
      createdAt: d,
      refId: r.refId,
    });
    added++;
  }
  return added;
}
