# HRIS Mini - Frontend

Sistem Manajemen Sumber Daya Manusia (HRIS) Mini. Proyek ini dibangun menggunakan **React + Vite** dan **Tailwind CSS**.

## 🚀 Panduan Instalasi (Untuk QA)

Ikuti langkah-langkah berikut untuk menjalankan proyek di perangkat lokal Anda:

### 1. Prasyarat

Pastikan Anda sudah menginstal:

- **Node.js** (Versi 18 ke atas)
- **NPM** atau **PNPM**

### 2. Clone Repository

Buka terminal dan jalankan perintah berikut:

```bash
git clone <url-repository-anda>
cd hris
```

### 3. Instalasi Dependency

Instal semua library yang dibutuhkan:

```bash
npm install
# atau jika menggunakan pnpm
pnpm install
```

### 4. Konfigurasi Environment (.env)

Buat file baru bernama `.env` di folder root, lalu masukkan konfigurasi berikut:

```env
VITE_API_URL=/api
VITE_API_KEY=
```

### 5. Menjalankan Aplikasi

Jalankan server pengembangan:

```bash
npm run dev
```

Setelah jalan, buka browser di alamat: `http://localhost:5173`

---

## 🛠️ Catatan Penting untuk QA

Saat ini terdapat beberapa fitur yang sedang dalam tahap integrasi dengan Backend. Jika Anda menemukan isu berikut, hal tersebut adalah **dikarenakan limitasi Backend (bukan Bug Frontend)**:

1.  **Status "Blokir" (Mode Simulasi)**: Karena data real dari Backend belum tersedia, saat ini aktif **Mode Simulasi** khusus untuk akun bernama **"Budi Pratama"**. Akun tersebut akan otomatis muncul dengan status "Blokir" agar Anda dapat mengetes fitur Unlock.
2.  **Error 404 saat "Buka Gembok"**: Endpoint `/unlock` belum tersedia di sisi Backend. API akan tetap dipanggil namun akan menghasilkan error 404.
3.  **Alert Login Terblokir**: Hanya akan muncul jika API Login mengembalikan pesan error yang mengandung kata "blokir" atau "locked".
4.  **Login Role Parameter**: Saat ini login belum bisa memproses parameter `role` secara spesifik dari Backend.
5.  **Identifikasi User Baru**: Logika untuk membedakan "User Baru" (untuk flow ganti password pertama kali) belum tersedia sepenuhnya dari sisi Backend.



## 💻 Tech Stack

- **Library Utama**: React 19
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **Icon**: HeroIcons
- **HTTP Client**: Axios
