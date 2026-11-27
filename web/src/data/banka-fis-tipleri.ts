export interface BankaFisTipi {
  deger: string
  ad: string
  /** Havale tiplerinde cari satırının yönü fiş tipiyle sabittir. */
  cariYon?: 'borc' | 'alacak'
}

export const BANKA_FIS_TIPLERI: BankaFisTipi[] = [
  { deger: '1', ad: 'Banka İşlem Fişi' },
  { deger: '2', ad: 'Virman Fişi' },
  // Gelen havale: cari alacaklanır (borcumuz değil, alacağımız kapanır).
  { deger: '3', ad: 'Gelen Havaleler', cariYon: 'alacak' },
  // Gönderilen havale: cari borçlanır, yani borcumuz azalır.
  { deger: '4', ad: 'Gönderilen Havaleler', cariYon: 'borc' },
  { deger: '5', ad: 'Açılış Fişi' },
]

export const cariYonu = (deger: string) =>
  BANKA_FIS_TIPLERI.find((t) => t.deger === deger)?.cariYon

export const fisTipiEtiketi = (deger: string) =>
  BANKA_FIS_TIPLERI.find((t) => t.deger === deger)?.ad ?? deger

export const fisTipiSecenekleri = () =>
  BANKA_FIS_TIPLERI.map((t) => ({
    value: t.deger,
    label: `${t.deger}-${t.ad}`,
  }))
