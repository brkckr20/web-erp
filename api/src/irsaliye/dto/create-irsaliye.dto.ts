export class CreateIrsaliyeKalemDto {
  id?: number
  irsaliyeId?: number
  malzemeId?: number
  tip?: string
  takipNo?: string
  brutAgirlik?: number
  netAgirlik?: number
  brutMetre?: number
  netMetre?: number
  adet?: number
  olcuBirimi?: string
  miktar?: number
  birimFiyat?: number
  doviz?: string
  kdv?: number
  satirTutari?: number
  aciklama?: string
  uuid?: string
}

export class UpdateIrsaliyeKalemDto extends CreateIrsaliyeKalemDto {}

export class CreateIrsaliyeDto {
  irsaliyeNo?: string
  irsaliyeTipi: string
  irsaliyeTarihi?: string
  aciklama?: string
  faturaNo?: string
  faturaTarihi?: string
  sevkNo?: string
  sevkTarihi?: string
  onaylandi?: boolean
  tamamlandi?: boolean
  kayitYapan?: string
  kayitTarihi?: string
  guncelleyen?: string
  guncellemeTarihi?: string
  cariHesapId?: number
  depoId?: number
  fasonTipiId?: number
  kalemler?: CreateIrsaliyeKalemDto[]
}

export class UpdateIrsaliyeDto extends CreateIrsaliyeDto {}
