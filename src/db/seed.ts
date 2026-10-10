import { db } from './database';
import type { MonthlyTemplate } from './types';
import { getMonthYearKey } from '../utils/format';

const USE_MONTHLY_TEMPLATES = false;

const DEFAULT_TEMPLATES: Omit<MonthlyTemplate, 'id'>[] = [
  { description: 'Gaji', amount: 17_582_078, type: 'income', note: '', isActive: true },
  { description: 'Hutang', amount: 1_750_000, type: 'expense', note: 'Target Lunas Agustus 2027', isActive: true },
  { description: 'Kontrakan', amount: 1_000_000, type: 'expense', note: '', isActive: true },
  { description: 'Skincare & Parfum', amount: 1_000_000, type: 'expense', note: '', isActive: true },
  { description: 'Tenis', amount: 800_000, type: 'expense', note: '', isActive: true },
  { description: 'Catering Makan Siang', amount: 800_000, type: 'expense', note: '', isActive: true },
  { description: 'Makan Malam', amount: 750_000, type: 'expense', note: '', isActive: true },
  { description: 'Bensin', amount: 200_000, type: 'expense', note: '', isActive: true },
  { description: 'Parkir Motor', amount: 200_000, type: 'expense', note: '', isActive: true },
  { description: 'Transjakarta', amount: 200_000, type: 'expense', note: '', isActive: true },
  { description: 'WiFi', amount: 150_000, type: 'expense', note: '', isActive: true },
  { description: 'Paket Internet', amount: 130_000, type: 'expense', note: '', isActive: true },
];

/**
 * Seed the monthly templates table with default data (only on first launch).
 */
export async function seedTemplates(): Promise<void> {
  const count = await db.monthlyTemplates.count();
  if (count === 0) {
    await db.monthlyTemplates.bulkAdd(DEFAULT_TEMPLATES as MonthlyTemplate[]);
  }
}

/**
 * Initialize a specific month with transactions from the active templates.
 * Only initializes if the month hasn't been initialized yet.
 * Returns true if initialization happened, false if already initialized.
 */
export async function initializeMonth(month: number, year: number): Promise<boolean> {
  const key = getMonthYearKey(month, year);

  const existing = await db.monthStatus.get(key);
  if (existing?.isInitialized) {
    return false;
  }

  // Untuk saat ini transaksi hanya dari email (atau input manual); template rutin dimatikan.
  const templates = USE_MONTHLY_TEMPLATES
    ? (await db.monthlyTemplates.toArray()).filter((t) => t.isActive)
    : [];

  const now = new Date();
  // Tanggal template = awal periode gajian (tanggal 29 bulan sebelumnya, 00:00).
  const periodStart = new Date(year, month - 2, 29, 0, 0, 0, 0);
  const transactions = templates.map((t) => ({
    description: t.description,
    amount: t.amount,
    type: t.type,
    note: t.note,
    month,
    year,
    createdAt: periodStart,
  }));

  await db.transaction('rw', [db.transactions, db.monthStatus], async () => {
    await db.transactions.bulkAdd(transactions);
    await db.monthStatus.put({
      id: key,
      isInitialized: true,
      initializedAt: now,
    });
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
 * 1. Seed templates if first run
 * 2. Initialize the current month if not already done
 */
export async function initializeApp(): Promise<void> {
  await seedTemplates();

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  await initializeMonth(currentMonth, currentYear);
  await seedManualEntries();
}

/** Pengeluaran manual (transfer BCA) periode Oktober 2026; refId mencegah dobel. */
const MANUAL_ENTRIES = [
  { refId: 'manual-bca-20260930-kontrakan', description: 'Kontrakan', amount: 1_000_000, note: 'Transfer BCA ke RIJAH', date: new Date(2026, 8, 30, 9, 53, 32) },
  { refId: 'manual-bca-20261001-hutang', description: 'Hutang bulanan (angsuran ke 15)', amount: 1_750_000, note: 'Transfer BCA ke TRIYANI (biaya admin Rp 2.500)', date: new Date(2026, 9, 1, 8, 14, 0) },
  { refId: 'manual-bca-20261001-gadai', description: 'Ambil gadai laptop', amount: 4_250_000, note: 'Transfer BCA ke RIJAH', date: new Date(2026, 9, 1, 8, 15, 24) },
  { refId: 'manual-bca-20261001-mamah', description: 'Bayar hutang ke mamah', amount: 3_100_000, note: 'Transfer BCA ke RIJAH', date: new Date(2026, 9, 1, 11, 20, 7) },
  { refId: 'manual-livin-20261009-tenis', description: 'Tenis', amount: 120_000, note: 'Transfer Livin\u2019 ke TAN CHUN MIN', date: new Date(2026, 9, 9, 13, 23, 58) },
  { refId: 'manual-livin-20261009-tenis-fee', description: 'Biaya transfer (Tenis)', amount: 2_500, note: 'Biaya BI Fast Livin\u2019', date: new Date(2026, 9, 9, 13, 23, 59) },
];

async function seedManualEntries(): Promise<void> {
  await initializeMonth(10, 2026);
  for (const e of MANUAL_ENTRIES) {
    if (await db.transactions.where('refId').equals(e.refId).count()) continue;
    await db.transactions.add({
      description: e.description,
      amount: e.amount,
      type: 'expense',
      note: e.note,
      month: 10,
      year: 2026,
      createdAt: e.date,
      refId: e.refId,
    });
  }
}
