export interface Transaction {
  id?: number;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  note: string;
  month: number; // 1-12
  year: number;
  createdAt: Date;
  refId?: string; // unique id from email sync (dedupe)
}

export interface MonthlyTemplate {
  id?: number;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  note: string;
  isActive: boolean;
}

export interface MonthStatus {
  id: string; // "YYYY-MM" format
  isInitialized: boolean;
  initializedAt: Date;
}

export interface MonthYear {
  month: number;
  year: number;
}

export interface Summary {
  totalIncome: number;
  totalExpense: number;
  surplus: number;
}

