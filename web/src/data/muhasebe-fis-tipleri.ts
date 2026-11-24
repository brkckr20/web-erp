export const MUHASEBE_FIS_TIPLERI = [
  { deger: '1', ad: 'Mahsup Fişi' },
  { deger: '2', ad: 'Tahsilat Fişi' },
  { deger: '3', ad: 'Tediye Fişi' },
  { deger: '4', ad: 'Açılış Fişi' },
  { deger: '5', ad: 'Kapanış Fişi' },
]

export const muhasebeFisTipiEtiketi = (deger: string) =>
  MUHASEBE_FIS_TIPLERI.find((t) => t.deger === deger)?.ad ?? deger

export const muhasebeFisTipiSecenekleri = () =>
  MUHASEBE_FIS_TIPLERI.map((t) => ({ value: t.deger, label: `${t.deger}-${t.ad}` }))
