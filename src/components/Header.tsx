import { getMonthName } from '../utils/format';
import './Header.css';

interface HeaderProps {
  month: number;
  year: number;
  isCurrentMonth: boolean;
}

export function Header({ month, year, isCurrentMonth }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__logo">💰</div>
      <h1 className="app-header__title">Pencatat Keuangan Pribadi</h1>
      <p className="app-header__subtitle">Kelola pemasukan & pengeluaran bulanan Anda</p>
      <div className="app-header__month-badge">
        {isCurrentMonth && <span className="app-header__dot" />}
        <span>{getMonthName(month)} {year}</span>
      </div>
    </header>
  );
}
