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

/** Returns number of newly imported transactions. */
export async function syncFromEmail(cfg: SyncConfig): Promise<number> {
  const res = await fetch(`${cfg.url}?token=${encodeURIComponent(cfg.token)}`);
  const json = await res.json();
  if (json.error) throw new Error('Token tidak valid');

  const remote: RemoteTx[] = json.transactions ?? [];
  let added = 0;

  for (const r of remote) {
    if (await db.transactions.where('refId').equals(r.refId).count()) continue;

    const d = new Date(r.date);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    await initializeMonth(month, year);

    // Slip gaji: jangan dobel kalau gaji bulan itu sudah ada dari template.
    if (r.source === 'bipo') {
      const hasSalary = (await db.transactions
        .where('[month+year]')
        .equals([month, year])
        .toArray()).some((t) => t.type === 'income' && /^gaji/i.test(t.description));
      if (hasSalary) continue;
    }

    await db.transactions.add({
      description: r.description,
      amount: r.amount,
      type: r.type,
      note: r.source === 'livin' ? 'Otomatis dari email Livin\u2019' : 'Otomatis dari email',
      month,
      year,
      createdAt: d,
      refId: r.refId,
    });
    added++;
  }
  return added;
}
