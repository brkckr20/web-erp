export class IsEmriKalemDto {
  id?: number
  sira?: number
  siparisNo?: string
  malzemeId?: number
  malzemeKod?: string
  malzemeAd?: string
  kg?: number
  mt?: number
  adet?: number
}

export class CreateIsEmriDto {
  isEmriNo?: string
  aciklama?: string
  siparisNo?: string
  musteriSiparisNo?: string
  baslangicTarihi?: string
  bitisTarihi?: string
  durum?: string
  kayitYapan?: string
  kalemler?: IsEmriKalemDto[]
}
