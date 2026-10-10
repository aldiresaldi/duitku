import { useState } from 'react';
import './TransactionForm.css';

interface TransactionFormProps {
  onSubmit: (data: {
    description: string;
    amount: number;
    type: 'income' | 'expense';
    note: string;
  }) => Promise<void>;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function TransactionForm({ onSubmit, onShowToast }: TransactionFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedDesc = description.trim();
    const numAmount = Number(amount);

    if (!trimmedDesc) {
      onShowToast('Keterangan tidak boleh kosong', 'error');
      return;
    }

    if (!numAmount || numAmount <= 0) {
      onShowToast('Jumlah harus lebih dari 0', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        description: trimmedDesc,
        amount: numAmount,
        type,
        note: note.trim(),
      });
      onShowToast(`"${trimmedDesc}" berhasil ditambahkan!`, 'success');

      // Reset form
      setDescription('');
      setAmount('');
      setNote('');
      setType('expense');
      setIsOpen(false); // Auto close after submit
    } catch {
      onShowToast('Gagal menambahkan transaksi', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="panel panel--form" aria-label="Tambah Transaksi">
      <div 
        className="panel__header panel__header--clickable" 
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
      >
        <h2 className="panel__title">
          <span className="panel__title-icon">✏️</span>
          Tambah Transaksi Manual
        </h2>
        <button className="panel__toggle-btn" aria-label="Toggle Form" type="button">
          {isOpen ? 'Tutup ✕' : 'Buka ＋'}
        </button>
      </div>
      
      {isOpen && (
        <form className="form-grid" onSubmit={handleSubmit} autoComplete="off" id="transactionForm">
          <div className="form-group">
            <label htmlFor="inputDesc" className="form-label">Keterangan</label>
            <input
              type="text"
              id="inputDesc"
              className="form-input"
              placeholder="Contoh: Makan siang"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="inputAmount" className="form-label">Jumlah (Rp)</label>
            <input
              type="number"
              id="inputAmount"
              className="form-input"
              placeholder="Contoh: 500000"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="inputType" className="form-label">Tipe</label>
            <select
              id="inputType"
              className="form-select"
              value={type}
              onChange={(e) => setType(e.target.value as 'income' | 'expense')}
            >
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="inputNote" className="form-label">
              Catatan <span className="form-label__optional">(opsional)</span>
            </label>
            <input
              type="text"
              id="inputNote"
              className="form-input"
              placeholder="Contoh: Untuk acara kantor"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn-submit"
            id="btnSubmit"
            disabled={isSubmitting}
          >
            <span>{isSubmitting ? '⏳' : '➕'}</span>
            {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
          </button>
        </form>
      )}
    </section>
  );
}
