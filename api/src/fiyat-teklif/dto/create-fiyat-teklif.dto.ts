export class FiyatTeklifKalemDto {
  malzemeKod: string
  malzemeAd?: string
  miktar: number
  birim?: string
  birimFiyat?: number
  dovizCinsi?: string
  dovizKuru?: number | null
  aciklama?: string
}

export class CreateFiyatTeklifDto {
  tarih?: string
  gecerlilikTarihi?: string | null
  cariKod: string
  cariAd?: string
  aciklama?: string
  olusturanKullanici?: number | null
  kalemler: FiyatTeklifKalemDto[]
}

export class UpdateFiyatTeklifDto extends CreateFiyatTeklifDto {}
