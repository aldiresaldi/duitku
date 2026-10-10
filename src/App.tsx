import { useEffect, useState } from 'react';
import { initializeApp } from './db/seed';
import { useMonthNavigation } from './hooks/useMonthNavigation';
import { useTransactions } from './hooks/useTransactions';
import { useToast } from './hooks/useToast';
import { Header } from './components/Header';
import { MonthNavigator } from './components/MonthNavigator';
import { SummaryCards } from './components/SummaryCards';
import { TransactionForm } from './components/TransactionForm';
import { TransactionTable } from './components/TransactionTable';
import { SyncPanel } from './components/SyncPanel';
import { BalanceCheck } from './components/BalanceCheck';
import { ToastContainer } from './components/Toast';
import './App.css';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const { month, year, goToPrevMonth, goToNextMonth, goToMonth, isCurrentMonth } =
    useMonthNavigation();
  const {
    transactions,
    summary,
    addTransaction,
    deleteTransaction,
    ensureMonthInitialized,
  } = useTransactions(month, year);
  const { toasts, showToast, dismissToast } = useToast();

  // Initialize app on first load
  useEffect(() => {
    initializeApp().then(() => setIsReady(true));
  }, []);

  // Initialize month when navigating to a new month
  useEffect(() => {
    if (isReady) {
      ensureMonthInitialized();
    }
  }, [month, year, isReady]);

  if (!isReady) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner" />
        <p className="app-loading__text">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header month={month} year={year} isCurrentMonth={isCurrentMonth} />

      <MonthNavigator
        month={month}
        year={year}
        onPrev={goToPrevMonth}
        onNext={goToNextMonth}
        onGoToMonth={goToMonth}
      />

      <SyncPanel onShowToast={showToast} />

      <SummaryCards summary={summary} />

      <BalanceCheck summary={summary} month={month} year={year} />

      <TransactionForm
        onSubmit={addTransaction}
        onShowToast={showToast}
      />

      <TransactionTable
        transactions={transactions}
        onDelete={deleteTransaction}
        onShowToast={showToast}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <footer className="app-footer">
        <p>Pencatat Keuangan Pribadi &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
