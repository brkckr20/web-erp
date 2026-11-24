export class CreateMasrafYeriDto {
  kod: string
  ad: string
  ozelKod?: string | null
  erisimKodu?: string | null
  aciklama?: string | null
  dovizCinsi?: string | null
  kullanimda?: boolean
}