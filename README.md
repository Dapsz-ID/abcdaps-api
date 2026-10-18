# abcdaps-api

Website API downloader TikTok dan Instagram dengan UI carbon-black, dokumentasi endpoint, playground, dan metadata Open Graph/Twitter Card.

## Fitur

- UI mobile-first dan responsif.
- Font Awesome melalui CDN.
- Endpoint TikTok untuk video, image slide, author, statistik, musik, dan metadata.
- Endpoint Instagram untuk video, gambar carousel, thumbnail, serta mode audio.
- GET dan POST JSON.
- Halaman dokumentasi di `/docs`.
- Open Graph dan Twitter Card untuk preview tautan website.
- Deploy ke Vercel.

## Struktur

```text
.
├── api/
│   ├── instagram.js
│   └── tiktok.js
├── lib/
│   └── http.js
├── app.js
├── docs.css
├── docs.html
├── favicon.svg
├── index.html
├── og-image.png
├── package.json
├── style.css
└── vercel.json
```

## Deploy ke Vercel

1. Upload project ini ke repository Git.
2. Import repository di Vercel.
3. Framework preset pilih `Other`.
4. Build command dan output directory dapat dikosongkan.
5. Deploy.

Vercel akan mendeteksi file dalam folder `api` sebagai serverless functions.

## Menjalankan lokal

```bash
npm install
npm run dev
```

## Endpoint

### TikTok

```http
GET /api/tiktok?url=https%3A%2F%2Fwww.tiktok.com%2F%40user%2Fvideo%2F1234567890123456789
```

POST JSON:

```json
{
  "url": "https://www.tiktok.com/@user/video/1234567890123456789"
}
```

### Instagram

```http
GET /api/instagram?url=https%3A%2F%2Fwww.instagram.com%2Freel%2FREPLACE_ME%2F
```

Mode audio:

```http
GET /api/instagram?url=https%3A%2F%2Fwww.instagram.com%2Freel%2FREPLACE_ME%2F&mode=audio
```

POST JSON:

```json
{
  "url": "https://www.instagram.com/reel/REPLACE_ME/",
  "mode": "audio"
}
```

## Format response

Sukses:

```json
{
  "success": true,
  "status_code": 200,
  "data": {},
  "timestamp": 1790000000000
}
```

Gagal:

```json
{
  "success": false,
  "status_code": 502,
  "error": {
    "code": "EXTRACTION_FAILED",
    "message": "Penjelasan error"
  },
  "timestamp": 1790000000000
}
```

## Twitter Card dan WhatsApp preview

Halaman utama dan docs menyediakan Open Graph serta Twitter Card metadata. Ganti `https://abcdaps-api.vercel.app/` di `index.html` dan `docs.html` dengan domain deployment milik Anda. WhatsApp menggunakan metadata Open Graph dan perlu mengambil halaman publik tanpa login; perubahan preview dapat tersimpan di cache WhatsApp.

`og-image.png` adalah gambar preview 1200×630 yang digunakan oleh metadata Open Graph dan Twitter Card. Pastikan file ini dapat diakses secara publik setelah deployment.

## Catatan penting

- Ekstraksi bergantung pada endpoint/platform dan layanan sumber pihak ketiga yang dapat berubah atau membatasi request.
- Konten privat atau yang memerlukan login dapat gagal diekstrak.
- Vercel memiliki batas waktu dan resource serverless. Request upstream yang lambat mungkin timeout.
- Untuk penggunaan publik, tambahkan rate limiting, logging, dan proteksi penyalahgunaan.
- Gunakan hanya konten yang Anda miliki atau memiliki izin untuk mengunduh.
