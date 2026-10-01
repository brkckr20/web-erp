export class CreateFaturaKalemDto {
  id?: number
  faturaId?: number
  // Doluysa: irsaliyeden snapshot — miktar alanları sunucuda kaynaktan kopyalanır, istemci değeri yok sayılır.
  irsaliyeKalemId?: number | null
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
  varyant1RenkId?: number
  varyant2RenkId?: number
  boyahaneRenkId?: number | null
}

export class UpdateFaturaKalemDto extends CreateFaturaKalemDto {}

export class CreateFaturaDto {
  faturaNo?: string
  faturaTipi: string
  faturaTarihi?: string
  aciklama?: string
  yetkili?: string
  kayitYapan?: string
  kayitTarihi?: string
  guncelleyen?: string
  guncellemeTarihi?: string
  cariHesapId?: number
  depoId?: number
  fasonTipiId?: number
  kalemler?: CreateFaturaKalemDto[]
  // Fatura kartından çoklu irsaliye bağlama: bu irsaliyelerin kalemleri snapshot alınır.
  irsaliyeIds?: number[]
}

export class UpdateFaturaDto extends CreateFaturaDto {}
