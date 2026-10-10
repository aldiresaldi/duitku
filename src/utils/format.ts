const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

/**
 * Format a number into Indonesian Rupiah string.
 * Example: 17582078 → "Rp 17.582.078"
 */
export function formatRupiah(amount: number): string {
  const prefix = amount < 0 ? '-Rp ' : 'Rp ';
  return prefix + Math.abs(amount).toLocaleString('id-ID');
}

/**
 * Get full month name in Bahasa Indonesia (1-indexed).
 * Example: 10 → "Oktober"
 */
export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] || '';
}

/**
 * Get short month name (1-indexed).
 * Example: 10 → "Okt"
 */
export function getMonthNameShort(month: number): string {
  return MONTH_NAMES_SHORT[month - 1] || '';
}

/**
 * Create a "YYYY-MM" key for month status lookups.
 */
export function getMonthYearKey(month: number, year: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Format a Date object to "DD MMM YYYY" in Indonesian.
 * Example: new Date(2026, 9, 10) → "10 Okt 2026"
 */
export function formatDate(date: Date): string {
  const d = new Date(date);
  const day = d.getDate();
  const monthShort = MONTH_NAMES_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${monthShort} ${year}`;
}

/**
 * Format time from Date to "HH:MM".
 */
export function formatTime(date: Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
