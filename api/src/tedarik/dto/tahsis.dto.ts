// Serbest ham stoktan sipariş kalemine elle tahsis isteği (planlama satırı başına).
export class TahsisSatirDto {
  siparisKalemId: number
  siparisNo?: string | null
  modelKod?: string | null
  malzemeId: number
  renkId?: number | null
  /** Planlama satırının ölçü birimi; kaynak stok miktarı bu birimden okunur. */
  birim?: string
  /** Tahsis edilecek miktar (ihtiyaç kadar). Free stok yetmezse kısmi yapılır. */
  miktar: number
}
