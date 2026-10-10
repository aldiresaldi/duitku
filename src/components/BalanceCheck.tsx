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

export function BalanceCheck({ summary, month, year }: Props) {
  const key = `duitku-balance-${year}-${String(month).padStart(2, '0')}`;
  const load = (): Saved | null => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as Saved;
    } catch { /* ignore */ }
    return null;
  };

  const [saved, setSaved] = useState<Saved | null>(load);
  const [balanceInput, setBalanceInput] = useState('');
  const [remark, setRemark] = useState('');
  const [isOpen, setIsOpen] = useState(false);

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
    setIsOpen(false); // Auto close after save
  }

  const gap = saved ? saved.balance - summary.surplus : 0;
  const ok = saved && Math.abs(gap) < 1000;

  return (
    <section className={`balance-check${saved && !ok ? ' balance-check--anomaly' : ''}`} aria-label="Cek Saldo Riil">
      <div 
        className="balance-check__header-toggle" 
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
      >
        <div className="balance-check__header-title">
          💳 Cek Saldo Riil / Anomali
          {saved && !ok && !isOpen && (
            <span className="balance-check__header-badge">⚠️ Anomali</span>
          )}
        </div>
        <button className="balance-check__toggle-btn" type="button" aria-label="Toggle Panel">
          {isOpen ? 'Tutup ✕' : 'Buka ＋'}
        </button>
      </div>

      {isOpen && (
        <div className="balance-check__body">
          <div className="balance-check__row">
            <label className="balance-check__label" htmlFor="realBalance">Saldo di rekening Anda (Rp)</label>
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
        </div>
      )}
    </section>
  );
}
