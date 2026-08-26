import type { Band, BandHucre, BandTipi, FormSorguDraft, FormTasarimDraft } from './types'

let uid = 0
export const uidYeni = () => `id-${++uid}-${Date.now().toString(36)}`

export const SERVIS_DEMO_NOTU = 'Demo çalıştırıcı — gerçek kolonlar backend fazında dönecek.'

const TABLO_SEMA: Record<string, { kolonlar: string[]; ornek: Record<string, unknown>[] }> = {
  stok_hareket_fisi: {
    kolonlar: ['id', 'fis_tipi', 'fis_no', 'fis_tarihi', 'sevk_tarihi', 'cari_hesap', 'depo', 'kayit_yapan'],
    ornek: [
      {
        id: 1,
        fis_tipi: '10-Üretim Fişi',
        fis_no: 'ÜRT-2026-0001',
        fis_tarihi: '05.08.2026',
        sevk_tarihi: '06.08.2026',
        cari_hesap: 'CAN TEKSTİL',
        depo: 'ANA DEPO',
        kayit_yapan: 'Ayşe',
      },
    ],
  },
  stok_hareket_fisi_kalem: {
    kolonlar: ['id', 'fis_id', 'sira', 'malzeme_kod', 'malzeme_ad', 'kg', 'birim_fiyat', 'kdv', 'tutar'],
    ornek: [
      { id: 1, fis_id: 1, sira: 1, malzeme_kod: 'KM-001', malzeme_ad: 'Süprem Pamuk 150cm', kg: 120.5, birim_fiyat: 85, kdv: 20, tutar: 10242.5 },
      { id: 2, fis_id: 1, sira: 2, malzeme_kod: 'İP-007', malzeme_ad: 'İplik 30/1 Penye', kg: 40, birim_fiyat: 45, kdv: 20, tutar: 1800 },
    ],
  },
  irsaliye: {
    kolonlar: ['id', 'irsaliye_no', 'irsaliye_tarihi', 'cari_hesap', 'depo', 'sevk_adresi'],
    ornek: [
      { id: 1, irsaliye_no: 'IRS-2026-0145', irsaliye_tarihi: '05.08.2026', cari_hesap: 'ZARA TEKSTİL', depo: 'ANA DEPO', sevk_adresi: 'İstanbul' },
    ],
  },
  irsaliye_kalem: {
    kolonlar: ['id', 'irsaliye_id', 'sira', 'malzeme_kod', 'malzeme_ad', 'adet', 'birim_fiyat', 'tutar'],
    ornek: [
      { id: 1, irsaliye_id: 1, sira: 1, malzeme_kod: 'KM-010', malzeme_ad: 'Ribana Pamuk', adet: 50, birim_fiyat: 92, tutar: 4600 },
      { id: 2, irsaliye_id: 1, sira: 2, malzeme_kod: 'AK-003', malzeme_ad: 'Lastik 3cm', adet: 200, birim_fiyat: 1.2, tutar: 240 },
    ],
  },
}

export function demoSorguCalistir(
  sql: string,
): { kolonlar: string[]; satirlar: Record<string, unknown>[] } | { hata: string } {
  const m = sql.toLowerCase().match(/(?:from|join)\s+([a-z_0-9]+)/)
  if (!m) return { hata: 'SQL içinde FROM/JOIN tablosu bulunamadı.' }
  const sema = TABLO_SEMA[m[1]]
  if (!sema) return { hata: `"${m[1]}" için demo veri yok. Gerçek backend bağlanınca sorgu çalışacak.` }
  return { kolonlar: sema.kolonlar, satirlar: sema.ornek }
}

export const bandTipiAdlari: Record<BandTipi, string> = {
  'ust-bilgi': 'Üst Bilgi',
  alanlar: 'Alanlar',
  'kalem-tablo': 'Kalem Tablosu',
  toplamlar: 'Toplamlar',
  imza: 'İmza / Kaşe',
}

export const bandTipiSirasi: BandTipi[] = ['ust-bilgi', 'alanlar', 'kalem-tablo', 'toplamlar', 'imza']

function eleman(x: number, y: number, genislik: number, yukseklik: number, alan?: string, etiket?: string): BandHucre {
  return { id: uidYeni(), x, y, genislik, yukseklik, alan, etiket }
}

export function yeniBand(tip: BandTipi): Band {
  const band: Band = { id: uidYeni(), tip, ad: bandTipiAdlari[tip], elemanlar: [] }
  if (tip === 'kalem-tablo') {
    band.tabloKolonlari = []
  }
  return band
}

export function bosForm(ad = 'Yeni Form'): FormTasarimDraft {
  const sorgular: FormSorguDraft[] = Array.from({ length: 10 }, (_, i) => ({
    id: uidYeni(),
    sirano: i + 1,
    ad: '',
    sorguMetni: '',
    kolonlar: [],
    satirlar: [],
  }))
  return {
    id: uidYeni(),
    ad,
    ekranTuru: 'Malzeme Yönetim Fişleri',
    sorgular,
    layout: bandTipiSirasi.map(yeniBand),
    sayfa: { boyut: 'A4', yon: 'dikey', kenarUst: 8, kenarAlt: 8, kenarSol: 10, kenarSag: 10 },
  }
}

function ornekStokFisi(): FormTasarimDraft {
  const form = bosForm('Malzeme Yönetim Fişi')
  form.ekranTuru = 'Malzeme Yönetim Fişleri'

  const s1: FormSorguDraft = { id: uidYeni(), sirano: 1, ad: 'Fiş Başlığı', sorguMetni: 'SELECT * FROM stok_hareket_fisi WHERE id = :id', kolonlar: [], satirlar: [] }
  const s2: FormSorguDraft = { id: uidYeni(), sirano: 2, ad: 'Fiş Kalemleri', sorguMetni: 'SELECT * FROM stok_hareket_fisi_kalem WHERE fis_id = :id', kolonlar: [], satirlar: [] }
  const r1 = demoSorguCalistir(s1.sorguMetni)
  if ('kolonlar' in r1) {
    s1.kolonlar = r1.kolonlar
    s1.satirlar = r1.satirlar
    s1.demoSonuc = true
  }
  const r2 = demoSorguCalistir(s2.sorguMetni)
  if ('kolonlar' in r2) {
    s2.kolonlar = r2.kolonlar
    s2.satirlar = r2.satirlar
    s2.demoSonuc = true
  }
  form.sorgular = [s1, s2]

  const ust = form.layout.find((b) => b.tip === 'ust-bilgi')!
  ust.elemanlar = [
    eleman(0, 0, 60, 8, 'S1.fis_no', 'Fiş No'),
    eleman(70, 0, 60, 8, 'S1.fis_tarihi', 'Tarih'),
    eleman(140, 0, 70, 8, 'S1.fis_tipi', 'Fiş Tipi'),
  ]

  const alan = form.layout.find((b) => b.tip === 'alanlar')!
  alan.elemanlar = [
    eleman(0, 0, 105, 8, 'S1.cari_hesap', 'Cari Hesap'),
    eleman(0, 12, 105, 8, 'S1.depo', 'Depo'),
    eleman(115, 0, 95, 8, 'S1.kayit_yapan', 'Kayıt Eden'),
    eleman(115, 12, 95, 8, 'S1.sevk_tarihi', 'Sevk Tarihi'),
  ]

  const kalem = form.layout.find((b) => b.tip === 'kalem-tablo')!
  kalem.sorguId = s2.id
  kalem.tabloKolonlari = ['sira', 'malzeme_kod', 'malzeme_ad', 'kg', 'birim_fiyat', 'tutar'].map((k) => ({
    id: uidYeni(),
    alan: `S2.${k}`,
  }))

  const top = form.layout.find((b) => b.tip === 'toplamlar')!
  top.elemanlar = [eleman(120, 0, 90, 8, 'S2.tutar', 'Genel Toplam')]

  return form
}

export const ornekFormlar: FormTasarimDraft[] = [ornekStokFisi()]
