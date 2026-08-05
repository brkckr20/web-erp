import type { Band, BandHucre, BandSatir, BandTipi, FormSorguDraft, FormTasarimDraft } from './types'

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

function hucre(alan?: string, etiket?: string): BandHucre {
  return { id: uidYeni(), alan, etiket }
}

function satir(hucreler: BandHucre[]): BandSatir {
  return { id: uidYeni(), hucreler }
}

export function yeniBand(tip: BandTipi): Band {
  const band: Band = { id: uidYeni(), tip, ad: bandTipiAdlari[tip], kolonSayisi: 2, satirlar: [] }
  if (tip === 'ust-bilgi') {
    band.kolonSayisi = 2
    band.satirlar = [satir([hucre('S1.fis_no', 'Fiş No'), hucre('S1.fis_tarihi', 'Fiş Tarihi')])]
  } else if (tip === 'alanlar') {
    band.kolonSayisi = 2
    band.satirlar = [satir([hucre('S1.cari_hesap', 'Cari Hesap'), hucre('S1.depo', 'Depo')])]
  } else if (tip === 'kalem-tablo') {
    band.tabloKolonlari = []
  } else if (tip === 'toplamlar') {
    band.kolonSayisi = 2
    band.satirlar = [satir([hucre('S2.tutar', 'Toplam'), hucre()])]
  } else {
    band.kolonSayisi = 2
    band.satirlar = [satir([hucre(undefined, 'Teslim Alan'), hucre(undefined, 'Kaşe')])]
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
    ekranTuru: 'stok-hareket-fisi',
    sorgular,
    layout: bandTipiSirasi.map(yeniBand),
    sayfa: { boyut: 'A4', yon: 'dikey', kenarUst: 8, kenarAlt: 8, kenarSol: 10, kenarSag: 10 },
  }
}

function ornekStokFisi(): FormTasarimDraft {
  const form = bosForm('Stok Hareket Fişi')
  form.ekranTuru = 'stok-hareket-fisi'

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
  ust.satirlar = [satir([hucre('S1.fis_no', 'Fiş No'), hucre('S1.fis_tarihi', 'Tarih'), hucre('S1.fis_tipi', 'Fiş Tipi'), hucre()])]

  const alan = form.layout.find((b) => b.tip === 'alanlar')!
  alan.kolonSayisi = 2
  alan.satirlar = [
    satir([hucre('S1.cari_hesap', 'Cari Hesap'), hucre('S1.depo', 'Depo')]),
    satir([hucre('S1.kayit_yapan', 'Kayıt Eden'), hucre('S1.sevk_tarihi', 'Sevk Tarihi')]),
  ]

  const kalem = form.layout.find((b) => b.tip === 'kalem-tablo')!
  kalem.sorguId = s2.id
  kalem.tabloKolonlari = ['sira', 'malzeme_kod', 'malzeme_ad', 'kg', 'birim_fiyat', 'tutar'].map((k) => ({
    id: uidYeni(),
    alan: `S2.${k}`,
  }))

  const top = form.layout.find((b) => b.tip === 'toplamlar')!
  top.satirlar = [satir([hucre('S2.tutar', 'Genel Toplam'), hucre()])]

  return form
}

export const ornekFormlar: FormTasarimDraft[] = [ornekStokFisi()]