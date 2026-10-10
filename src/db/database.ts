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

    // Perbaikan: bulan yang terlanjur 'initialized' tanpa transaksi template diinisialisasi ulang.
    this.version(3).stores({}).upgrade(async (tx) => {
      const statuses = await tx.table('monthStatus').toArray();
      for (const s of statuses) {
        const [y, m] = String(s.id).split('-').map(Number);
        const txs = await tx.table('transactions').where('[month+year]').equals([m, y]).toArray();
        if (!txs.some((t) => !t.refId)) await tx.table('monthStatus').delete(s.id);
      }
    });

    // Perbaikan: transaksi template lama bertanggal waktu pembuatan -> awal periode (29 bulan sebelumnya).
    this.version(4).stores({}).upgrade(async (tx) => {
      const statuses = await tx.table('monthStatus').toArray();
      for (const s of statuses) {
        const [y, m] = String(s.id).split('-').map(Number);
        const init = new Date(s.initializedAt).getTime();
        const start = new Date(y, m - 2, 29, 0, 0, 0, 0);
        const txs = await tx.table('transactions').where('[month+year]').equals([m, y]).toArray();
        for (const t of txs) {
          if (!t.refId && Math.abs(new Date(t.createdAt).getTime() - init) < 5000) {
            await tx.table('transactions').update(t.id, { createdAt: start });
          }
        }
      }
    });
  }
}

export const db = new FinanceDB();

