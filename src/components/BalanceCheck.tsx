import { useEffect, useState } from 'react';
import { formatRupiah } from '../utils/format';
import type { Summary } from '../db/types';
import './BalanceCheck.css';

interface Props {
  summary: Summary;
  month: number;
  year: number;
}

interface Saved {
  balance: number;
  remark: string;
}

// Saldo riil yang Anda laporkan untuk Oktober 2026 (bisa diubah di aplikasi).
const DEFAULTS: Record<string, Saved> = {
  '2026-10': { balance: 3_700_000, remark: '' },
};

export function BalanceCheck({ summary, month, year }: Props) {
  const key = `duitku-balance-${year}-${String(month).padStart(2, '0')}`;
  const load = (): Saved | null => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as Saved;
    } catch { /* ignore */ }
    return DEFAULTS[`${year}-${String(month).padStart(2, '0')}`] ?? null;
  };

  const [saved, setSaved] = useState<Saved | null>(load);
  const [balanceInput, setBalanceInput] = useState('');
  const [remark, setRemark] = useState('');

  useEffect(() => {
    const s = load();
    setSaved(s);
    setBalanceInput(s ? String(s.balance) : '');
    setRemark(s?.remark ?? '');
  }, [key]);

  function save() {
    const balance = Number(balanceInput.replace(/\D/g, ''));
    if (!balanceInput) {
      localStorage.removeItem(key);
      setSaved(null);
      return;
    }
    const s = { balance, remark };
    localStorage.setItem(key, JSON.stringify(s));
    setSaved(s);
  }

  const gap = saved ? saved.balance - summary.surplus : 0;
  const ok = saved && Math.abs(gap) < 1000;

  return (
    <section className={`balance-check${saved && !ok ? ' balance-check--anomaly' : ''}`} aria-label="Cek Saldo Riil">
      <div className="balance-check__row">
        <label className="balance-check__label" htmlFor="realBalance">💳 Saldo riil di rekening (Rp)</label>
        <input
          id="realBalance"
          className="balance-check__input"
          inputMode="numeric"
          placeholder="Contoh: 3700000"
          value={balanceInput}
          onChange={(e) => setBalanceInput(e.target.value)}
        />
        <input
          className="balance-check__input balance-check__input--remark"
          placeholder="Remark (opsional)"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
        />
        <button className="balance-check__btn" onClick={save}>Simpan</button>
      </div>

      {saved && (
        <div className="balance-check__result">
          <div>Sisa di catatan: <strong>{formatRupiah(summary.surplus)}</strong></div>
          <div>Saldo riil: <strong>{formatRupiah(saved.balance)}</strong></div>
          {ok ? (
            <div className="balance-check__ok">✅ Sesuai, tidak ada selisih.</div>
          ) : (
            <div className="balance-check__flag">
              ⚠️ Anomali gap {gap > 0 ? '+' : '-'}{formatRupiah(Math.abs(gap))}:{' '}
              {gap > 0
                ? 'saldo riil LEBIH BESAR dari catatan — kemungkinan ada pemasukan atau sisa bulan lalu yang belum tercatat.'
                : 'saldo riil LEBIH KECIL dari catatan — kemungkinan ada pengeluaran yang belum tercatat.'}
              {saved.remark && <div className="balance-check__remark">📝 {saved.remark}</div>}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
