export class SirketAdresDto {
  id?: number
  baslik?: string
  adres?: string
  ilce?: string
  il?: string
  postaKodu?: string
  sira?: number
}

export class SirketWebDto {
  id?: number
  site: string
  sira?: number
}

export class SirketIbanDto {
  id?: number
  banka?: string
  iban: string
  aciklama?: string
  sira?: number
}

export class CreateSirketDto {
  ad: string
  telefon?: string
  fax?: string
  eposta?: string
  vergiDairesi?: string
  vergiNo?: string
  mersisNo?: string
  eFaturaEtiketi?: string
  eIrsaliyeEtiketi?: string
  adresler?: SirketAdresDto[]
  webler?: SirketWebDto[]
  ibanlar?: SirketIbanDto[]
}

export class UpdateSirketDto extends CreateSirketDto {}
