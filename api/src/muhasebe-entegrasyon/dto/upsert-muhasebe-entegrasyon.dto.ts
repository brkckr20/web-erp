export class MuhasebeEntegrasyonTanimiDto {
  id?: number
  hesapTipi: string
  faturaTipi?: string | null
  depoId?: number | null
  fasonTipiId?: number | null
  kdvOrani?: number | null
  muhasebeHesapId?: number | null
  hesapKodu: string
  sira?: number
  aktif?: boolean
}

export class UpsertMuhasebeEntegrasyonDto {
  items: MuhasebeEntegrasyonTanimiDto[]
}
