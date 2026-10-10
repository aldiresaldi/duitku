/**
 * DuitKu - Gmail sync (Google Apps Script)
 * Cara pakai: lihat apps-script/README.md
 */
const TOKEN = 'GANTI_DENGAN_TOKEN_RAHASIA_PANJANG'; // wajib diganti!
const SALARY_DEFAULT = 17582078;
const SHEET_NAME = 'Transaksi';
const SEARCH_QUERY =
  '((from:noreply.livin@bankmandiri.co.id (subject:"Pembayaran Berhasil" OR subject:"Top-up Berhasil")) OR ' +
  '(from:bca@bca.co.id subject:"Internet Transaction Journal") OR ' +
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

function parseAmountEn_(str) {
  // "45,000.00" -> 45000
  return Math.round(parseFloat(String(str).replace(/,/g, '')));
}

/** Email BCA "Internet Transaction Journal" (QRIS, Virtual Account/GoPay, transfer). */
function parseBca_(body) {
  const field = function (name) {
    const m = body.match(new RegExp(name + '\\s*:\\s*([^\\r\\n]+)', 'i'));
    return m ? m[1].trim() : '';
  };
  const amt = (body.match(/Total Payment\s*:\s*IDR\s*([\d.,]+)/i) ||
    body.match(/Transfer Amount\s*:\s*IDR\s*([\d.,]+)/i) ||
    body.match(/Pay Amount\s*:\s*IDR\s*([\d.,]+)/i) ||
    body.match(/Amount\s*:\s*IDR\s*([\d.,]+)/i) || [])[1];
  const ref = (body.match(/Reference No\.?\s*:\s*([A-Za-z0-9]+)/i) || [])[1];
  if (!amt || !ref) return null;

  const product = field('Company/Product Name');
  let desc;
  if (/go-?pay/i.test(product)) desc = 'Top up GoPay';
  else if (field('Payment to')) desc = field('Payment to');
  else if (product) desc = product;
  else if (field('Beneficiary Name')) desc = 'Transfer ke ' + field('Beneficiary Name');
  else desc = 'Transaksi BCA';
  const remarks = field('Remarks') || field('Description');
  if (remarks && desc.indexOf('Transfer ke') === 0) desc += ' (' + remarks + ')';
  return { refId: 'bca-' + ref, description: desc, amount: parseAmountEn_(amt) };
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
        const nominal = (body.match(/Total Transaksi\s+Rp\s*([\d.,]+)/i) ||
          body.match(/Nominal (?:Transaksi|Top-?up)\s+Rp\s*([\d.,]+)/i) || [])[1];
        const penerima = (body.match(/Penerima\s+([^\r\n]+)/i) || [])[1];
        const penyedia = (body.match(/Penyedia Jasa\s+([^\r\n]+)/i) || [])[1];
        let desc = (penerima || '').trim();
        if (!desc && penyedia) desc = /go-?pay/i.test(penyedia) ? 'Top up GoPay' : 'Top-up ' + penyedia.trim();
        if (!desc) desc = 'Pembayaran QRIS';
        if (!refNum || !nominal || known.has(ref)) return;
        sh.appendRow([ref, date.toISOString(), desc,
          parseAmount_(nominal), 'expense', 'livin']);
        known.add(ref);
      } else if (from.indexOf('bca.co.id') !== -1) {
        const p = parseBca_(body);
        if (!p || known.has(p.refId)) return;
        sh.appendRow([p.refId, date.toISOString(), p.description, p.amount, 'expense', 'bca']);
        known.add(p.refId);
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
