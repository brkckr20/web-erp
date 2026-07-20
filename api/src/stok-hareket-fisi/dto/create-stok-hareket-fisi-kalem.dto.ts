export class CreateStokHareketFisiKalemDto {
  fisId: number
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
