import { CariHesapHareketDto } from './create-cari-hesap-fis.dto'

export class UpdateCariHesapFisDto {
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
  hareketler?: CariHesapHareketDto[]
}
