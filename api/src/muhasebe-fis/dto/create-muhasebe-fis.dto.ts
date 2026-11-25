export class MuhasebeFisSatirDto {
  id?: number
  hesapKodu: string
  hesapAdi?: string | null
  cariHesapId?: number | null
  ozelKod?: string | null
  aciklama?: string | null
  vadeTarihi?: string | null
  miktar?: number | null
  belgeNo?: string | null
  doviz?: string | null
  dovizKuru?: number | null
  dovizTutari?: number | null
  borc?: number
  alacak?: number
}

export class CreateMuhasebeFisDto {
  fisTipi: string
  fisTarihi: string
  belgeNo?: string | null
  k?: string | null
  ozelKod?: string | null
  erisimKodu?: string | null
  aciklama?: string | null
  kaynakTuru?: string | null
  kaynakId?: number | null
  fasonTipiId?: number | null
  masrafYeri?: string | null
  satirlar: MuhasebeFisSatirDto[]
}
