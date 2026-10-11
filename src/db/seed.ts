import { db } from './database';
import { getMonthYearKey } from '../utils/format';

/**
 * Seed the monthly templates table (sekarang dinonaktifkan: full dari email).
 */
export async function seedTemplates(): Promise<void> {
  // Tidak ada template default yang di-seed
}

/**
 * Initialize a specific month.
 */
export async function initializeMonth(month: number, year: number): Promise<boolean> {
  const key = getMonthYearKey(month, year);

  const existing = await db.monthStatus.get(key);
  if (existing?.isInitialized) {
    return false;
  }

  const now = new Date();
  await db.monthStatus.put({
    id: key,
    isInitialized: true,
    initializedAt: now,
  });

  return true;
}

/**
 * Check if a month has been initialized.
 */
export async function isMonthInitialized(month: number, year: number): Promise<boolean> {
  const key = getMonthYearKey(month, year);
  const status = await db.monthStatus.get(key);
  return status?.isInitialized ?? false;
}

/**
 * Full initialization on app start:
 * - Bersihkan sisa transaksi hardcode lama (yang diawali 'manual-')
 * - Inisialisasi bulan aktif
 */
export async function initializeApp(): Promise<void> {
  try {
    const hardcoded = await db.transactions
      .filter((t) => !!t.refId && String(t.refId).startsWith('manual-'))
      .toArray();
    for (const t of hardcoded) {
      if (t.id !== undefined) {
        await db.transactions.delete(t.id);
      }
    }
  } catch {
    /* ignore */
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  await initializeMonth(currentMonth, currentYear);
}
