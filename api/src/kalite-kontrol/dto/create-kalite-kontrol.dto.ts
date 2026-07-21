export class CreateKaliteKontrolKalemDto {
  barkod?: string
  malzemeId?: number
  netAgirlik?: number
  netMetre?: number
  adet?: number
  aciklama?: string
  isEmriNo?: string
  isEmriKg?: number
}

export class UpdateKaliteKontrolKalemDto extends CreateKaliteKontrolKalemDto {}

export class CreateKaliteKontrolDto {
  fisNo: string
  isEmriNo?: string
  fisTarihi?: string
  aciklama?: string
  belgeAdi?: string
  kayitYapan?: string
  kayitTarihi?: string
  guncelleyen?: string
  guncellemeTarihi?: string
  cariHesapId?: number
  depoId?: number
  isEmriId?: number
  kalemler?: CreateKaliteKontrolKalemDto[]
}

export class UpdateKaliteKontrolDto extends CreateKaliteKontrolDto {}
