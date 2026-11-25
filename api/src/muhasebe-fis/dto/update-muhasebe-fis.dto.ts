import { MuhasebeFisSatirDto } from './create-muhasebe-fis.dto'

export class UpdateMuhasebeFisDto {
  fisTarihi?: string
  belgeNo?: string | null
  k?: string | null
  ozelKod?: string | null
  erisimKodu?: string | null
  aciklama?: string | null
  kaynakTuru?: string | null
  kaynakId?: number | null
  fasonTipiId?: number | null
  masrafYeri?: string | null
  satirlar?: MuhasebeFisSatirDto[]
}
