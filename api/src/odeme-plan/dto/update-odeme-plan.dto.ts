import { OdemePlanSatirDto } from './create-odeme-plan.dto'

export class UpdateOdemePlanDto {
  kod?: string
  ad?: string
  aciklama?: string
  yetkiKodu?: string | null
  ozelKod?: string | null
  uluslararasiKod?: string | null
  kullanimda?: boolean
  satirlar?: OdemePlanSatirDto[]
}
