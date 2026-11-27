export class BankaFisHareketDto {
  id?: number
  cariHesapId: number
  ozelKod?: string | null
  hesapKodu?: string | null
  hesapAdi?: string | null
  aciklama?: string | null
  vadeTarihi?: string | null
  belgeNo?: string | null
  borc?: number | string
  alacak?: number | string
  doviz?: string | null
  dovizKuru?: number | string | null
  belgeTuru?: string | null
  belgeId?: number | null
  kontrol?: string | null
}

export class CreateBankaFisDto {
  fisTipi: string
  fisTarihi: string
  belgeNo?: string | null
  k?: string | null
  erisimKodu?: string | null
  ozelKod?: string | null
  dovizCinsi?: string | null
  dovizKuru?: number | string | null
  kurTarihi?: string | null
  masrafYeri?: string | null
  masrafYeriId?: number | null
  aciklama?: string | null
  hareketler: BankaFisHareketDto[]
}
