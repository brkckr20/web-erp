export class CreateKesimDto {
  siparisNo: string
  modelKod: string
  modelAd?: string
  renkAd: string
  beden: string
  planlananMiktar?: number
  kesilenMiktar?: number
  fireMiktar?: number
  kumasAd?: string
  kumasRenk?: string
  gerekliMiktar?: number
  brutMiktar?: number
  kumasMiktar?: number
  birimTuketim?: number
  beklenenAdet?: number
  kalanMT?: number
  fireOrani?: number
  iadeTalep?: boolean
  tarih?: string
  durum?: string
  kaynakFisId?: number | null
  kaynakFisNo?: string | null
  kaynakKalemId?: number | null
  manuelFire?: boolean
  olusturanKullanici?: number | null
}

export class UpdateKesimDto extends CreateKesimDto {}

export class TopluKesimDto {
  kayitlar: CreateKesimDto[]
}
