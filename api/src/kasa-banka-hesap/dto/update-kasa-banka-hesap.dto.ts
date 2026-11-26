import { CreateKasaBankaHesapDto } from './create-kasa-banka-hesap.dto'

export class UpdateKasaBankaHesapDto implements Partial<CreateKasaBankaHesapDto> {
  kod?: string
  ad?: string
  tip?: string
  dovizKodu?: string
  isYeriKodu?: string
  masrafYeriKodu?: string
  masrafYeriId?: number | null
  bankaAdi?: string
  anaBankaKodu?: string
  subeKodu?: string
  subeAdi?: string
  swiftKodu?: string
  ilgiliKisi?: string
  erisimKodu?: string
  ozelKod?: string
  kullanimda?: boolean
  aciklama?: string
}
