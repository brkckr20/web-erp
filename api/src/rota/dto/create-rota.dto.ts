export interface RotaOperasyonDto {
  sira: number
  operasyonKodu: string
  operasyonAdi?: string | null
  varsayilanYer?: string | null
  birim?: string | null
  birimFiyat?: number | null
}

export class CreateRotaDto {
  kod: string
  ad: string
  ozelKod?: string | null
  hizmetKodu?: string | null
  kullanimda?: boolean
  operasyonlar?: RotaOperasyonDto[]
}
