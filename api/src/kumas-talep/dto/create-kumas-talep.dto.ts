export class KumasTalepKalemDto {
  kumasKod: string
  kumasAd?: string
  renk?: string
  miktar: number
  birim?: string
  aciklama?: string
}

export class CreateKumasTalepDto {
  siparisId?: number | null
  siparisNo: string
  tarih?: string
  talepEden?: string
  aciklama?: string
  olusturanKullanici?: number | null
  kalemler: KumasTalepKalemDto[]
}

export class UpdateKumasTalepDto extends CreateKumasTalepDto {}
