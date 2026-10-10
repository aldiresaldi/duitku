import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { initializeMonth } from '../db/seed';
import type { Transaction, Summary } from '../db/types';

/**
 * Reactively fetch all transactions for a given month/year.
 * Automatically re-renders when data changes in IndexedDB.
 */
export function useTransactions(month: number, year: number) {
  const transactions = useLiveQuery(
    () =>
      db.transactions
        .where('[month+year]')
        .equals([month, year])
        .toArray(),
    [month, year],
    [] as Transaction[]
  );

  const summary: Summary = useLiveQuery(
    async () => {
      const txs = await db.transactions
        .where('[month+year]')
        .equals([month, year])
        .toArray();

      let totalIncome = 0;
      let totalExpense = 0;

      for (const tx of txs) {
        if (tx.type === 'income') {
          totalIncome += tx.amount;
        } else {
          totalExpense += tx.amount;
        }
      }

      return {
        totalIncome,
        totalExpense,
        surplus: totalIncome - totalExpense,
      };
    },
    [month, year],
    { totalIncome: 0, totalExpense: 0, surplus: 0 }
  ) ?? { totalIncome: 0, totalExpense: 0, surplus: 0 };

  async function addTransaction(data: {
    description: string;
    amount: number;
    type: 'income' | 'expense';
    note: string;
  }) {
    await db.transactions.add({
      ...data,
      month,
      year,
      createdAt: new Date(),
    });
  }

  async function deleteTransaction(id: number) {
    await db.transactions.delete(id);
  }

  async function updateTransaction(id: number, data: Partial<Transaction>) {
    await db.transactions.update(id, data);
  }

  async function ensureMonthInitialized() {
    await initializeMonth(month, year);
  }

  return {
    transactions,
    summary,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    ensureMonthInitialized,
  };
}
