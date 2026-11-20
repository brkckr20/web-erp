import { CreateKasaBankaHesapDto } from './create-kasa-banka-hesap.dto'

export class UpdateKasaBankaHesapDto implements Partial<CreateKasaBankaHesapDto> {
  kod?: string
  ad?: string
  tip?: string
  dovizKodu?: string
  acilisBakiye?: number
  bankaAdi?: string
  sube?: string
  iban?: string
  hesapNo?: string
  kullanimda?: boolean
  aciklama?: string
}
