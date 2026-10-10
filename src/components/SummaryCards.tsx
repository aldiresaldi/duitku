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

  const handleToggleIncome = () => {
    if (isIncomeVisible) {
      setIsIncomeVisible(false);
    } else {
      const pwd = prompt('Masukkan password untuk melihat Pemasukan:');
      if (pwd === 'aldizix6ZWY') {
        setIsIncomeVisible(true);
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
          <div className={`summary-card__value summary-card__value--surplus ${surplusClass}`} id="totalSurplus">
            {formatRupiah(summary.surplus)}
          </div>
        </div>
      </div>
    </section>
  );
}
