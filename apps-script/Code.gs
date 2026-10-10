/**
 * DuitKu - Gmail sync (Google Apps Script)
 * Versi Terbaru: Mandiri Livin (Pengeluaran), skip BCA Aldi, BIPO Gaji dinamis.
 */
const TOKEN = 'GANTI_DENGAN_TOKEN_RAHASIA_PANJANG'; // Wajib diganti dengan token Anda!
const SALARY_DEFAULT = 17582078;
const SHEET_NAME = 'Transaksi';

const SEARCH_QUERY =
  '((from:noreply.livin@bankmandiri.co.id (subject:"Pembayaran Berhasil" OR subject:"Top-up Berhasil" OR subject:"Transfer Berhasil")) OR ' +
  '(from:nexwave_donotreply@hrms.bipocloud.com subject:"Payment Slip")) after:2026/07/28';

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
        const refNum = (body.match(/Referensi[\s\S]{0,40}?(\d{8,})/i) || [])[1];
        const ref = 'livin-' + refNum;
        if (!refNum || known.has(ref)) return;

        const nominal = (body.match(/Total Transaksi\s+Rp\s*([\d.,]+)/i) ||
          body.match(/Nominal (?:Transaksi|Top-?up)\s+Rp\s*([\d.,]+)/i) || [])[1];
        if (!nominal) return;

        // Aturan: Jika transfer ke BCA atas nama aldi, kita SKIP
        const bodyLower = body.toLowerCase();
        if (bodyLower.includes('aldi') && (bodyLower.includes('bca') || bodyLower.includes('central asia'))) {
          known.add(ref); // Tandai sudah diproses agar tidak dibaca berulang
          return; // Skip, jangan masuk ke Excel
        }

        const penerima = (body.match(/(?:Penerima|Nama Tujuan)\s+([^\r\n]+)/i) || [])[1];
        const penyedia = (body.match(/Penyedia Jasa\s+([^\r\n]+)/i) || [])[1];
        
        let desc = (penerima || '').trim();
        if (!desc && penyedia) {
          // Top up gopay otomatis dihitung sebagai pengeluaran
          desc = /go-?pay/i.test(penyedia) ? 'Top up GoPay' : 'Top-up ' + penyedia.trim();
        }
        if (!desc) desc = 'Pengeluaran Mandiri';

        sh.appendRow([ref, date.toISOString(), desc, parseAmount_(nominal), 'expense', 'livin']);
        known.add(ref);

      } else if (from.indexOf('bipocloud.com') !== -1) {
        const ref = 'slip-' + msg.getId();
        if (known.has(ref)) return;

        // Aturan: Gaji bisa masuk tgl 26/27/28/29.
        // Agar rapi masuk ke periode bulan baru di aplikasi web (yang mulai tiap tgl 29),
        // kita ubah tanggal datanya menjadi minimal tgl 29 bulan tersebut.
        let d = new Date(date.getTime());
        if (d.getDate() >= 25 && d.getDate() < 29) {
          d.setDate(29);
        }

        sh.appendRow([ref, d.toISOString(), 'Gaji (slip BIPO)', SALARY_DEFAULT, 'income', 'bipo']);
        known.add(ref);
      }
    });
  });
}

function installTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('processEmails').timeBased().everyMinutes(5).create();
  processEmails();
}

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
