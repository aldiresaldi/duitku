import { useEffect, useState } from 'react';
import { loadConfig, saveConfig, syncFromEmail } from '../sync/emailSync';
import './SyncPanel.css';

interface Props {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function SyncPanel({ onShowToast }: Props) {
  const [cfg, setCfg] = useState(loadConfig());
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(c = cfg, silent = true) {
    if (!c) return;
    setBusy(true);
    try {
      const n = await syncFromEmail(c);
      if (n > 0) onShowToast(`${n} transaksi baru dari email`, 'success');
      else if (!silent) onShowToast('Tidak ada transaksi baru', 'info');
    } catch (e) {
      if (!silent) onShowToast(`Sinkron gagal: ${(e as Error).message}`, 'error');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!cfg) return;
    run(cfg);
    const t = setInterval(() => run(cfg), 120000);
    return () => clearInterval(t);
  }, [cfg]);

  function connect() {
    const c = { url: url.trim(), token: token.trim() };
    if (!c.url || !c.token) return onShowToast('Isi URL dan token', 'error');
    saveConfig(c);
    setCfg(c);
    setOpen(false);
    run(c, false);
  }

  function disconnect() {
    saveConfig(null);
    setCfg(null);
  }

  return (
    <div className="sync-panel">
      {cfg ? (
        <>
          <span className="sync-panel__status">📧 Email terhubung</span>
          <button className="sync-panel__btn" disabled={busy} onClick={() => run(cfg, false)}>
            {busy ? 'Menyinkronkan…' : 'Sinkronkan'}
          </button>
          <button className="sync-panel__btn sync-panel__btn--ghost" onClick={disconnect}>
            Putuskan
          </button>
        </>
      ) : (
        <button className="sync-panel__btn" onClick={() => setOpen(!open)}>
          📧 Hubungkan Email
        </button>
      )}
      {open && !cfg && (
        <div className="sync-panel__form">
          <input placeholder="URL Web App Apps Script" value={url} onChange={(e) => setUrl(e.target.value)} />
          <input placeholder="Token rahasia" type="password" value={token} onChange={(e) => setToken(e.target.value)} />
          <button className="sync-panel__btn" onClick={connect}>Simpan & Sinkronkan</button>
        </div>
      )}
    </div>
  );
}
