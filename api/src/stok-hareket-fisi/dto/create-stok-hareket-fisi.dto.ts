export class CreateStokHareketFisiKalemDto {
  fisId?: number
  islemTipi?: string
  malzemeId?: number
  grM2?: number
  brutAgirlik?: number
  netAgirlik?: number
  brutMetre?: number
  netMetre?: number
  adet?: number
  dovizFiyati?: number
  doviz?: string
  birimFiyat?: number
  variantId?: number
  renkId?: number
  aciklama?: string
  uuid?: string
  takipNo?: string
  desenId?: number
  islemId?: number
  satirTutari?: number
  kdv?: number
  alici?: string
  olcuBirimi?: string
  fisNo?: string
  marka?: string
  fire?: number
  miktar?: number
  variant?: string
  pesinOdeme?: boolean
  vadeliOdeme?: boolean
  satirAciklama?: string
  partiNo?: string
  siparisNo?: string
  musteriSiparisNo?: string
  maliyetHesaplandi?: boolean
  cipLi?: boolean
}

export class UpdateStokHareketFisiKalemDto extends CreateStokHareketFisiKalemDto {}

export class CreateStokHareketFisiDto {
  fisNo?: string
  fisTipi: string
  fisTarihi?: string
  aciklama?: string
  faturaNo?: string
  faturaTarihi?: string
  sevkNo?: string
  sevkTarihi?: string
  vadeTarihi?: string
  yetkili?: string
  onaylandi?: boolean
  tamamlandi?: boolean
  musteriSiparisNo?: string
  siparisNo?: string
  vade?: number
  odemeTipi?: string
  kayitYapan?: string
  kayitTarihi?: string
  guncelleyen?: string
  guncellemeTarihi?: string
  tasiyiciId?: number
  nakliyeciId?: number
  belgeAdi?: string
  cariHesapId?: number
  depoId?: number
  kalemler?: CreateStokHareketFisiKalemDto[]
}

export class UpdateStokHareketFisiDto extends CreateStokHareketFisiDto {}
