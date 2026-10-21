/**
 * Kalemdeki miktarı okur. Ölçü birimine göre alan seçimi:
 *  - 'brutKg' → brüt kg (yoksa net kg)
 *  - 'kg'     → net kg (yoksa brüt kg)
 *  - 'brutMt' → brüt mt (yoksa net mt)
 *  - 'mt'     → net mt (yoksa brüt mt)
 *  - 'adet'   → adet
 *
 * NOT: Fason akışında operatör miktarı çoğu zaman NET alanına yazıyor (brüt boş
 * kalıyor) — mevcut kayıtlar böyle. Bu yüzden sabit "brüt" okumak miktarı 0 yapıp
 * satırları gizliyordu.
 */
export function kalemMiktari(
  olcuBirimi: string | null | undefined,
  brutKg: number,
  netKg: number,
  brutMt: number,
  netMt: number,
  adet: number,
): number {
  switch (olcuBirimi) {
    case 'brutKg': return brutKg > 0 ? brutKg : netKg
    case 'kg': return netKg > 0 ? netKg : brutKg
    case 'brutMt': return brutMt > 0 ? brutMt : netMt
    case 'mt': return netMt > 0 ? netMt : brutMt
    case 'adet': return adet
    default: return 0
  }
}
