# Rapor Yapısı Tasarımı

Bu dosya, projede kullanılacak rapor sisteminin mimari tasarımını tanımlar.

---

## 1. Genel Akış

```
┌─────────────────────────────────────────────────────────────────┐
│  1. RAPOR TASARIMI EKRANI                                       │
│     Kullanıcı şablon oluşturur:                                  │
│     - Şablon adı, ekran adı                                     │
│     - SQL sorguları tanımlar                                    │
│     - HTML kodu yazar (inline CSS)                              │
│     - Sayfa ayarları (boyut, yön, boşluklar)                    │
│     - Canlı önizleme (zoom ile)                                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │ Kaydet
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. ÇALIŞMA EKRANI (İrsaliye, Sipariş, vs.)                    │
│     "Rapor" butonu → Modal açılır                               │
│     - Ekran adına ait şablonlar listelenir                      │
│     - Şablon seç → Önizleme / PDF İndir                        │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. BACKEND                                                    │
│     - Sorguları çalıştırır                                     │
│     - Sonuçları HTML'e bind eder                               │
│     - Sayfa ayarlarını uygular                                  │
│     - PDF üretir (Puppeteer)                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Veri Bağlama (Data Binding)

### Sorgu Tanımları

Kullanıcı şablon editöründe sorguları tanımlar:

| Alan | Açıklama |
|---|---|
| Sorgu Adı | `irsaliye_baslik`, `irsaliye_kalemleri` gibi |
| SQL Kodu | Çalıştırılacak SQL sorgusu |

### HTML Şablonunda Kullanım

**Tek satır sonuç (başlık verisi):**

```html
<div>Fiş No: {{baslik.fis_no}}</div>
<div>Tarih: {{baslik.tarih}}</div>
<div>Cari: {{baslik.cari_adi}}</div>
```

**Çok satır sonuç (tablo verisi):**

```html
<table>
  <thead>
    <tr>
      <th>Sıra</th>
      <th>Malzeme</th>
      <th>Miktar</th>
      <th>Birim</th>
    </tr>
  </thead>
  <tbody>
    {{#each kalemler}}
    <tr>
      <td>{{sira}}</td>
      <td>{{malzeme_kod}}</td>
      <td>{{miktar}}</td>
      <td>{{birim}}</td>
    </tr>
    {{/each}}
  </tbody>
</table>
```

### Kurallar

| Sonuç Tipi | Kullanım | Örnek |
|---|---|---|
| Tek satır | `{{sorgu.kolon}}` | `{{baslik.fis_no}}` |
| Çok satır | `{{#each sorgu}}...{{/each}}` | Tablo satırları |
| Boş sonuç | `{{sorgu.kolon}}` → boş string | `{{baslik.fis_no}}` → "" |

---

## 3. Backend PDF Üretimi

### Akış

```
1. Şablonu DB'den çek
2. Sorguları sırasıyla çalıştır
   - Her sorgu için parametreleri SQL'e bind et
   - Sonuçları { sorguAdi: [...satırlar ] } formatında sakla
3. HTML'i parse et
   - {{sorgu.kolon}} → tek satır sonucundan değer al
   - {{#each sorgu}}...{{/each}} → çok satır sonucu için döngü
4. Sayfa ayarlarını uygula
   - @page CSS'i ekle (size, margin)
5. Puppeteer ile PDF üret
```

### Puppeteer Kullanımı

```ts
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setContent(bindsizHTML);
await page.pdf({
  path: 'output.pdf',
  format: sayfaBoyutu,    // 'A4', 'A5', vs.
  landscape: yon === 'yatay',
  margin: {
    top: `${ustBosluk}mm`,
    bottom: `${altBosluk}mm`,
    left: `${solBosluk}mm`,
    right: `${sagBosluk}mm`,
  },
  printBackground: true,
});
await browser.close();
```

---

## 4. Veri Modeli

### Prisma Schema

```prisma
model Sablon {
  id               Int      @id @default(autoincrement())
  ad               String   @db.NVarChar(100)
  ekranAdi         String   @map("ekran_adi") @db.NVarChar(100)
  htmlIcerik       String   @map("html_icerik") @db.NVarChar(4000)
  sayfaEn          Int      @default(210) @map("sayfa_en")
  sayfaBoy         Int      @default(297) @map("sayfa_boy")
  yon              String   @default("dikey") @db.NVarChar(10)
  ustBosluk        Int      @default(10) @map("ust_bosluk")
  altBosluk        Int      @default(10) @map("alt_bosluk")
  solBosluk        Int      @default(15) @map("sol_bosluk")
  sagBosluk        Int      @default(15) @map("sag_bosluk")
  aktif            Boolean  @default(true)
  olusturmaTarihi  DateTime @default(now()) @map("olusturma_tarihi")
  guncellemeTarihi DateTime? @map("guncelleme_tarihi")

  sorgular         SablonSorgu[]

  @@unique([ekranAdi, ad])
  @@map("sablon")
}

model SablonSorgu {
  id         Int    @id @default(autoincrement())
  sablonId   Int    @map("sablon_id")
  ad         String @db.NVarChar(100)
  sqlIcerik  String @map("sql_icerik") @db.NVarChar(4000)
  sira       Int    @default(0)

  sablon     Sablon @relation(fields: [sablonId], references: [id], onDelete: Cascade)

  @@map("sablon_sorgu")
}
```

### SQL Tabloları (Prisma Migration Yerine)

```sql
CREATE TABLE sablon (
  id INT IDENTITY(1,1) PRIMARY KEY,
  ad NVARCHAR(100) NOT NULL,
  ekran_adi NVARCHAR(100) NOT NULL,
  html_icerik NVARCHAR(4000) NOT NULL,
  sayfa_en INT DEFAULT 210,
  sayfa_boy INT DEFAULT 297,
  yon NVARCHAR(10) DEFAULT 'dikey',
  ust_bosluk INT DEFAULT 10,
  alt_bosluk INT DEFAULT 10,
  sol_bosluk INT DEFAULT 15,
  sag_bosluk INT DEFAULT 15,
  aktif BIT DEFAULT 1,
  olusturma_tarihi DATETIME DEFAULT GETDATE(),
  guncelleme_tarihi DATETIME NULL,
  CONSTRAINT uq_sablon_ekran_ad UNIQUE (ekran_adi, ad)
);

CREATE TABLE sablon_sorgu (
  id INT IDENTITY(1,1) PRIMARY KEY,
  sablon_id INT NOT NULL,
  ad NVARCHAR(100) NOT NULL,
  sql_icerik NVARCHAR(4000) NOT NULL,
  sira INT DEFAULT 0,
  FOREIGN KEY (sablon_id) REFERENCES sablon(id) ON DELETE CASCADE
);
```

---

## 5. Backend API Endpoints

| Endpoint | Yöntem | Açıklama |
|---|---|---|
| `/api/sablon?ekranAdi=irsaliye` | GET | Ekran adına ait şablonları listele |
| `/api/sablon/:id` | GET | Tek şablon detayı (sorgular dahil) |
| `/api/sablon` | POST | Şablon oluştur |
| `/api/sablon/:id` | PUT | Şablon güncelle |
| `/api/sablon/:id` | DELETE | Şablon sil |
| `/api/sablon/:id/onerizleme` | POST | HTML bind + PDF üret → PDF döndür |
| `/api/sablon/:id/sorgu` | POST | Tek sorguyu çalıştır (test için) |

---

## 6. Frontend Bileşenleri

### SablonListesi (`/rapor-tasarimi`)
- Ekran adına göre filtreleme
- Tablo: Şablon Adı, Ekran, Tarih, Durum (aktif/pasif), İşlemler
- Yeni Şablon Oluştur → SablonEditori'ne yönlendirme

### SablonEditori (`/rapor-tasarimi/yeni` veya `/rapor-tasarimi/:id`)
- **Sol Panel:**
  - Şablon Adı, Ekran Adı (dropdown: irsaliye, siparis, etc.)
  - Sayfa Ayarları: Boyut (A4/A5/Özel), Yön (Dikey/Yatay), Boşluklar (mm)
  - Sorgular: Listeleme, Ekle, Sil, Düzenleme (ad + SQL)
- **Sağ Panel (Yan Yana):**
  - Sol: HTML editör textarea
  - Sağ: Canlı önizleme (iframe, `transform: scale()` ile zoom)
  - Zoom slider: %20 - %150

### RaporModal (çalışma ekranlarında)
- Çalışma ekranındaki "Rapor" butonu ile açılır
- `ekranAdi` parametresi ile ilgili şablonları çeker
- Şablon seç → Önizleme (yeni sekme) veya PDF İndir

---

## 7. HTML Şablon Kuralları

### Inline CSS Zorunlu
Harici CSS dosyası kullanılmaz. Tüm stiller inline olmalıdır:

```html
<div style="font-family:Arial,sans-serif;font-size:11px">
  <h1 style="font-size:14px;text-align:center">FİŞ NO: {{baslik.fis_no}}</h1>
</div>
```

### Sayfa Boyutu
Backend, `@page` CSS'i ekler:

```css
@page {
  size: 210mm 297mm;  /* sayfa_en x sayfa_boy */
  margin: 10mm 15mm 10mm 15mm; /* ust sol sag alt */
}
```

### Barkod Üretimi
Barkod HTML içinde SVG olarak yerleştirilir:

```html
<div style="text-align:center">
  <!-- Barkod SVG'si buraya bind edilir -->
  <div style="font-size:10px;margin-top:4px">{{barkod.kod}}</div>
</div>
```

---

## 8. Durum Tablosu

| Bileşen | Durum |
|---|---|
| Prisma Schema (sablon, sablon_sorgu) | ✅ Tanımlandı |
| SQL Tabloları | ⏳ sqlcmd ile oluşturulacak |
| Backend Modülü (sablon) | ⏳ Sırada |
| PDF Üretimi (Puppeteer) | ⏳ Sırada |
| Frontend API Client | ⏳ Sırada |
| SablonListesi (API bağlantısı) | ⏳ Sırada |
| SablonEditori (API bağlantısı) | ⏳ Sırada |
| RaporModal (çalışma ekranları) | ⏳ Sırada |
