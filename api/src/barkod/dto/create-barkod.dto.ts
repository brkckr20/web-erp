export class CreateBarkodDto {
  siparisNo: string
  modelKod: string
  renkKod: string
  beden: string
  kumasKod: string
  kumasRenkKod: string
  modelAd?: string
  renkAd?: string
  kumasAd?: string
  kumasRenkAd?: string
}

export class Barkod_lookupDto {
  barkod: string
}
