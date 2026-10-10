import { db } from './database';
import type { MonthlyTemplate } from './types';
import { getMonthYearKey } from '../utils/format';

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

  const templates = await db.monthlyTemplates.where('isActive').equals(1).toArray();

  const now = new Date();
  const transactions = templates.map((t) => ({
    description: t.description,
    amount: t.amount,
    type: t.type,
    note: t.note,
    month,
    year,
    createdAt: now,
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
}
