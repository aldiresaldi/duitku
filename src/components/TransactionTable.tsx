import type { Transaction } from '../db/types';
import { formatRupiah, formatDate, formatTime } from '../utils/format';
import './TransactionTable.css';

interface TransactionTableProps {
  transactions: Transaction[];
  onDelete: (id: number) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function TransactionTable({ transactions, onDelete, onShowToast }: TransactionTableProps) {
  const handleDelete = (tx: Transaction) => {
    if (tx.id !== undefined) {
      onDelete(tx.id);
      onShowToast(`"${tx.description}" berhasil dihapus`, 'info');
    }
  };

  return (
    <section className="panel panel--table" aria-label="Daftar Transaksi">
      <div className="panel__header">
        <h2 className="panel__title">
          <span className="panel__title-icon">📋</span>
          Daftar Transaksi
        </h2>
        <span className="panel__badge" id="txCount">
          {transactions.length} transaksi
        </span>
      </div>

      {transactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📭</div>
          <div className="empty-state__text">Belum ada transaksi bulan ini.</div>
          <div className="empty-state__subtext">Transaksi dari template bulanan akan otomatis dibuat.</div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table id="transactionTable">
            <thead>
              <tr>
                <th className="th-no">No</th>
                <th>Keterangan</th>
                <th>Tipe</th>
                <th className="th-date">Tanggal</th>
                <th className="th-amount">Jumlah</th>
                <th className="th-action"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, index) => (
                <tr key={tx.id} className="row-animate" style={{ animationDelay: `${index * 0.03}s` }}>
                  <td className="td-no">{index + 1}</td>
                  <td>
                    <div className="td-desc">{tx.description}</div>
                    {tx.note && <div className="td-note">{tx.note}</div>}
                  </td>
                  <td>
                    <span className={`type-badge type-badge--${tx.type}`}>
                      <span className="type-badge__dot" />
                      {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                    </span>
                  </td>
                  <td className="td-date">
                    <div className="td-date__primary">{formatDate(tx.createdAt)}</div>
                    {new Date(tx.createdAt).getTime() % 60000 !== 0 || new Date(tx.createdAt).getHours() !== 0 || new Date(tx.createdAt).getMinutes() !== 0 ? (
                      <div className="td-date__secondary">{formatTime(tx.createdAt)}</div>
                    ) : (
                      <div className="td-date__secondary">Rutin bulanan</div>
                    )}
                  </td>
                  <td className={`td-amount td-amount--${tx.type}`}>
                    {tx.type === 'income' ? '+' : '-'} {formatRupiah(tx.amount)}
                  </td>
                  <td className="td-action">
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(tx)}
                      title={`Hapus ${tx.description}`}
                      aria-label={`Hapus ${tx.description}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
