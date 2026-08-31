export class CreateIadeTalepDto {
  siparisNo: string
  modelKod: string
  modelAd?: string
  renkAd: string
  beden: string
  kumasAd?: string
  kumasRenk?: string
  kalanMT: number
  aciklama?: string
}

export class UpdateIadeTalepDto extends CreateIadeTalepDto {}
