# Menghubungkan Gmail ke DuitKu

1. Buka https://script.google.com → **Proyek baru**. (Disarankan dibuat dari Google Sheet: https://sheets.new → Extensions → Apps Script, supaya data tersimpan di Sheet.)
2. Hapus isi default, tempel isi `Code.gs`.
3. Ganti `TOKEN` dengan teks acak panjang (rahasia!). Cek juga `SALARY_DEFAULT`.
4. Pilih fungsi `installTrigger` → **Run**. Izinkan akses Gmail & Sheet (muncul peringatan "belum diverifikasi" → Advanced → lanjutkan; ini skrip milik Anda sendiri).
5. **Deploy → New deployment → Web app**: Execute as **Me**, Who has access **Anyone**. Salin URL `.../exec`.
6. Di aplikasi DuitKu klik **Hubungkan Email**, tempel URL dan token.

Email Livin' ("Pembayaran Berhasil") dicatat sebagai pengeluaran dengan deskripsi = nama penerima.
Email "Payment Slip" BIPO dicatat sebagai pemasukan gaji, kecuali gaji bulan itu sudah ada.
