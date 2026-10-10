import { useState, useCallback } from 'react';
import type { MonthYear } from '../db/types';

/**
 * Hook for navigating between months.
 * Initializes to the current month/year.
 */
export function useMonthNavigation() {
  const now = new Date();
  const [current, setCurrent] = useState<MonthYear>({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  const goToPrevMonth = useCallback(() => {
    setCurrent((prev) => {
      if (prev.month === 1) {
        return { month: 12, year: prev.year - 1 };
      }
      return { month: prev.month - 1, year: prev.year };
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrent((prev) => {
      if (prev.month === 12) {
        return { month: 1, year: prev.year + 1 };
      }
      return { month: prev.month + 1, year: prev.year };
    });
  }, []);

  const goToMonth = useCallback((month: number, year: number) => {
    setCurrent({ month, year });
  }, []);

  const isCurrentMonth =
    current.month === now.getMonth() + 1 && current.year === now.getFullYear();

  return {
    ...current,
    goToPrevMonth,
    goToNextMonth,
    goToMonth,
    isCurrentMonth,
  };
}
