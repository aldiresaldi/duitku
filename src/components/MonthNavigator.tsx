import { getMonthName } from '../utils/format';
import './MonthNavigator.css';

interface MonthNavigatorProps {
  month: number;
  year: number;
  onPrev: () => void;
  onNext: () => void;
  onGoToMonth: (month: number, year: number) => void;
}

export function MonthNavigator({ month, year, onPrev, onNext, onGoToMonth }: MonthNavigatorProps) {
  const now = new Date();
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onGoToMonth(Number(e.target.value), year);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onGoToMonth(month, Number(e.target.value));
  };

  // Generate year options (2024 to current year + 2)
  const currentYear = now.getFullYear();
  const years = Array.from({ length: currentYear - 2024 + 3 }, (_, i) => 2024 + i);

  return (
    <div className="month-nav">
      <button
        className="month-nav__btn month-nav__btn--prev"
        onClick={onPrev}
        aria-label="Bulan sebelumnya"
        title="Bulan sebelumnya"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div className="month-nav__center">
        <div className="month-nav__selectors">
          <select
            className="month-nav__select"
            value={month}
            onChange={handleMonthChange}
            aria-label="Pilih bulan"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {getMonthName(i + 1)}
              </option>
            ))}
          </select>
          <select
            className="month-nav__select month-nav__select--year"
            value={year}
            onChange={handleYearChange}
            aria-label="Pilih tahun"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        {isCurrentMonth && (
          <span className="month-nav__current-tag">Bulan ini</span>
        )}
      </div>

      <button
        className="month-nav__btn month-nav__btn--next"
        onClick={onNext}
        aria-label="Bulan berikutnya"
        title="Bulan berikutnya"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
