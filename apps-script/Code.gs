/**
 * DuitKu - Gmail sync (Google Apps Script)
 * Cara pakai: lihat apps-script/README.md
 */
const TOKEN = 'GANTI_DENGAN_TOKEN_RAHASIA_PANJANG'; // wajib diganti!
const SALARY_DEFAULT = 17582078;
const SHEET_NAME = 'Transaksi';
const SEARCH_QUERY =
  '((from:noreply.livin@bankmandiri.co.id subject:"Pembayaran Berhasil") OR ' +
  '(from:nexwave_donotreply@hrms.bipocloud.com subject:"Payment Slip")) after:2026/09/27';

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['refId', 'date', 'description', 'amount', 'type', 'source']);
  }
  return sh;
}

function parseAmount_(str) {
  // "130.000,00" -> 130000
  return parseInt(String(str).split(',')[0].replace(/\./g, ''), 10);
}

function processEmails() {
  const sh = getSheet_();
  const last = sh.getLastRow();
  const known = new Set(last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues().flat() : []);

  GmailApp.search(SEARCH_QUERY).forEach(function (thread) {
    thread.getMessages().forEach(function (msg) {
      const from = msg.getFrom();
      const body = msg.getPlainBody();
      const date = msg.getDate();

      if (from.indexOf('bankmandiri.co.id') !== -1) {
        const ref = (body.match(/No\.?\s*Referensi\s+(\d+)/i) || [])[1];
        const nominal = (body.match(/Nominal Transaksi\s+Rp\s*([\d.,]+)/i) || [])[1];
        const penerima = (body.match(/Penerima\s+([^\r\n]+)/i) || [])[1];
        if (!ref || !nominal || known.has(ref)) return;
        sh.appendRow([ref, date.toISOString(), (penerima || 'Pembayaran QRIS').trim(),
          parseAmount_(nominal), 'expense', 'livin']);
        known.add(ref);
      } else if (from.indexOf('bipocloud.com') !== -1) {
        const ref = 'slip-' + msg.getId();
        if (known.has(ref)) return;
        sh.appendRow([ref, date.toISOString(), 'Gaji (slip BIPO)', SALARY_DEFAULT, 'income', 'bipo']);
        known.add(ref);
      }
    });
  });
}

/** Jalankan SEKALI untuk membuat pengecekan otomatis tiap 5 menit. */
function installTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('processEmails').timeBased().everyMinutes(5).create();
  processEmails();
}

/** Endpoint untuk aplikasi: ?token=... */
function doGet(e) {
  const out = ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON);
  if (!e || !e.parameter || e.parameter.token !== TOKEN) {
    return out.setContent(JSON.stringify({ error: 'unauthorized' }));
  }
  const sh = getSheet_();
  const last = sh.getLastRow();
  const rows = last > 1 ? sh.getRange(2, 1, last - 1, 6).getValues() : [];
  const data = rows.map(function (r) {
    return { refId: r[0], date: r[1], description: r[2], amount: r[3], type: r[4], source: r[5] };
  });
  return out.setContent(JSON.stringify({ transactions: data }));
}
