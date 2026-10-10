import Dexie, { type EntityTable } from 'dexie';
import type { Transaction, MonthlyTemplate, MonthStatus } from './types';

class FinanceDB extends Dexie {
  transactions!: EntityTable<Transaction, 'id'>;
  monthlyTemplates!: EntityTable<MonthlyTemplate, 'id'>;
  monthStatus!: EntityTable<MonthStatus, 'id'>;

  constructor() {
    super('PencatatKeuanganDB');

    this.version(1).stores({
      transactions: '++id, type, [month+year]',
      monthlyTemplates: '++id, type, isActive',
      monthStatus: 'id',
    });
    this.version(2).stores({
      transactions: '++id, type, [month+year], refId',
    });
  }
}

export const db = new FinanceDB();

