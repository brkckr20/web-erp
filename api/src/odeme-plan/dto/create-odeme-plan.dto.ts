export class OdemePlanSatirDto {
  id?: number
  sira?: number
  gun: number
  oran: number
}

export class CreateOdemePlanDto {
  kod: string
  ad: string
  aciklama?: string
  yetkiKodu?: string | null
  ozelKod?: string | null
  uluslararasiKod?: string | null
  kullanimda?: boolean
  satirlar?: OdemePlanSatirDto[]
}
