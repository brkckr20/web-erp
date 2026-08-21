export class SiparisRenkKumasGrupDto {
  id?: number;
  kumasGrupId?: number;
  renkId?: number | null;
}

export class SiparisStickerDto {
  id?: number;
  sira?: number;
  deger?: string;
}

export class SiparisRenkBedenDto {
  id?: number;
  bedenId?: number;
  miktar?: number;
  fiyat?: number;
  aciklama?: string;
  barkod?: string;
  stickerler?: SiparisStickerDto[];
}

export class SiparisRenkDto {
  id?: number;
  ozelKod?: string;
  musteriOrderNo?: string;
  partOrderNo?: string;
  aciklama?: string;
  istemeTarihi?: string;
  fiyat?: number;
  kesimUretim?: string;
  lot?: number;
  lotToplami?: number;
  toplam?: number;
  genelToplam?: number;
  sira?: number;
  kumasGruplari?: SiparisRenkKumasGrupDto[];
  bedenler?: SiparisRenkBedenDto[];
}

export class SiparisKalemDto {
  id?: number;
  malzemeId?: number | null;
  aciklama?: string;
  ozelKod?: string;
  dovizCinsi?: string;
  dovizFiyati?: number;
  dovizKuru?: number;
  fiyat?: number;
  miktar?: number;
  tutar?: number;
  sira?: number;
  renkler?: SiparisRenkDto[];
}

export class SiparisAciklamaDto {
  id?: number;
  tip?: string;
  metin?: string;
}

export class CreateSiparisDto {
  siparisNo?: string;
  numaratorId?: number;
  musteriOrderNo?: string;
  tarih?: string;
  istemeTarihi?: string;
  mIstemeTarihi?: string;
  kesimFazlasi?: string;
  musteriTemsilcisi?: string;
  toplamTutar?: number;
  toplamDoviz?: string;
  onaylandi?: boolean;
  tamamlandi?: boolean;
  durum?: string;
  kayitYapan?: string;
  kayitTarihi?: string;
  guncelleyen?: string;
  guncellemeTarihi?: string;
  cariHesapId?: number;
  kalemler?: SiparisKalemDto[];
  aciklamalar?: SiparisAciklamaDto[];
}

export class UpdateSiparisDto extends CreateSiparisDto {}
