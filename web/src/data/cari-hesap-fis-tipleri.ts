export interface CariHesapFisTipi {
  deger: string
  ad: string
}

export const CARI_HESAP_FIS_TIPLERI: CariHesapFisTipi[] = [
  { deger: '1', ad: 'Nakit Ödeme' },
  { deger: '2', ad: 'Nakit Tahsilat' },
  { deger: '3', ad: 'Borç Dekontu' },
  { deger: '4', ad: 'Alacak Dekontu' },
  { deger: '5', ad: 'Virman Fişi' },
  { deger: '6', ad: 'Açılış Fişi' },
  { deger: '7', ad: 'Gider Pusulası' },
  { deger: '12', ad: 'Özel Fiş' },
  { deger: '15', ad: 'Faktoring Fişi' },
  { deger: '16', ad: 'Kur Farkı Borç' },
  { deger: '17', ad: 'Kur Farkı Alacak' },
  { deger: '18', ad: 'Vade Farkı Borç' },
  { deger: '19', ad: 'Vade Farkı Alacak' },
  { deger: '40', ad: 'Firma Kredi Kartı Fişi' },
  { deger: '41', ad: 'Firma Kredi Kartı İade Fişi' },
  { deger: '42', ad: 'Kredi Kartı Fişi' },
  { deger: '43', ad: 'Kredi Kartı İade Fişi' },
]

/** Kasa/banka ayağı gerektiren, henüz kartta desteklenmeyen tipler. */
export const DESTEKLENMEYEN_FIS_TIPLERI = new Set(['1', '2', '7', '15', '40', '41', '42', '43'])

export const fisTipiEtiketi = (deger: string) =>
  CARI_HESAP_FIS_TIPLERI.find((t) => t.deger === deger)?.ad ?? deger

export const fisTipiSecenekleri = () =>
  CARI_HESAP_FIS_TIPLERI.map((t) => ({
    value: t.deger,
    label: `${t.deger}-${t.ad}`,
    disabled: DESTEKLENMEYEN_FIS_TIPLERI.has(t.deger),
  }))
