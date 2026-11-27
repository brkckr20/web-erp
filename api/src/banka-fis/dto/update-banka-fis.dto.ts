import { BankaFisHareketDto } from './create-banka-fis.dto'

export class UpdateBankaFisDto {
  fisTarihi?: string
  belgeNo?: string | null
  k?: string | null
  erisimKodu?: string | null
  ozelKod?: string | null
  dovizCinsi?: string | null
  dovizKuru?: number | string | null
  kurTarihi?: string | null
  masrafYeri?: string | null
  masrafYeriId?: number | null
  aciklama?: string | null
  hareketler?: BankaFisHareketDto[]
}
