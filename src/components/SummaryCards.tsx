import { useState } from 'react';
import { formatRupiah } from '../utils/format';
import type { Summary } from '../db/types';
import './SummaryCards.css';

interface SummaryCardsProps {
  summary: Summary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const surplusClass = summary.surplus < 0 ? 'summary-card__value--negative' : '';
  const [isIncomeVisible, setIsIncomeVisible] = useState(false);
  const [isSurplusVisible, setIsSurplusVisible] = useState(false);

  // Generate password dinamis berdasarkan tanggal (YYYYMMDD)
  const getDynamicPassword = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  };

  const handleToggleIncome = () => {
    if (isIncomeVisible) {
      setIsIncomeVisible(false);
    } else {
      const pwd = prompt('Masukkan password untuk melihat Pemasukan:');
      if (pwd === getDynamicPassword()) {
        setIsIncomeVisible(true);
      } else if (pwd !== null && pwd !== '') {
        alert('Password salah!');
      }
    }
  };

  const handleToggleSurplus = () => {
    if (isSurplusVisible) {
      setIsSurplusVisible(false);
    } else {
      const pwd = prompt('Masukkan password untuk melihat Surplus:');
      if (pwd === getDynamicPassword()) {
        setIsSurplusVisible(true);
      } else if (pwd !== null && pwd !== '') {
        alert('Password salah!');
      }
    }
  };

  return (
    <section className="summary-grid" aria-label="Ringkasan Keuangan">
      <div className="summary-card summary-card--income">
        <div className="summary-card__icon-wrap summary-card__icon-wrap--income">
          <span className="summary-card__icon">📈</span>
        </div>
        <div className="summary-card__content">
          <div className="summary-card__label">Total Pemasukan</div>
          <div className="summary-card__value-wrapper">
            <div className="summary-card__value summary-card__value--income" id="totalIncome">
              {isIncomeVisible ? formatRupiah(summary.totalIncome) : 'Rp ****'}
            </div>
            <button
              className="btn-toggle-visibility"
              onClick={handleToggleIncome}
              title={isIncomeVisible ? "Sembunyikan" : "Tampilkan"}
              aria-label={isIncomeVisible ? "Sembunyikan Pemasukan" : "Tampilkan Pemasukan"}
            >
              {isIncomeVisible ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
      </div>

      <div className="summary-card summary-card--expense">
        <div className="summary-card__icon-wrap summary-card__icon-wrap--expense">
          <span className="summary-card__icon">📉</span>
        </div>
        <div className="summary-card__content">
          <div className="summary-card__label">Total Pengeluaran</div>
          <div className="summary-card__value summary-card__value--expense" id="totalExpense">
            {formatRupiah(summary.totalExpense)}
          </div>
        </div>
      </div>

      <div className="summary-card summary-card--surplus">
        <div className="summary-card__icon-wrap summary-card__icon-wrap--surplus">
          <span className="summary-card__icon">💎</span>
        </div>
        <div className="summary-card__content">
          <div className="summary-card__label">Sisa Uang (Surplus)</div>
          <div className="summary-card__value-wrapper">
            <div className={`summary-card__value summary-card__value--surplus ${surplusClass}`} id="totalSurplus">
              {isSurplusVisible ? formatRupiah(summary.surplus) : 'Rp ****'}
            </div>
            <button
              className="btn-toggle-visibility"
              onClick={handleToggleSurplus}
              title={isSurplusVisible ? "Sembunyikan" : "Tampilkan"}
              aria-label={isSurplusVisible ? "Sembunyikan Surplus" : "Tampilkan Surplus"}
            >
              {isSurplusVisible ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
