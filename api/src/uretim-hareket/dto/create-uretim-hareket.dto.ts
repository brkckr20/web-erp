export class CreateUretimHareketDto {
  siparisNo: string
  modelKod: string
  modelAd?: string
  renkAd: string
  beden: string
  rotaKod?: string | null
  rotaOperasyonId?: number | null
  islemKod: string
  islemAd: string
  yon?: string
  miktar?: number
  kalite?: string
  birimFiyat?: number | null
  dovizCinsi?: string
  dovizKuru?: number | null
  cariKod?: string | null
  cariAd?: string | null
  tarih?: string
  aciklama?: string | null
  barkod?: string | null
  kayitYapan?: string | null
  olusturanKullanici?: number | null
}

export class UpdateUretimHareketDto extends CreateUretimHareketDto {}

export class TopluUretimHareketDto {
  kayitlar: CreateUretimHareketDto[]
}
