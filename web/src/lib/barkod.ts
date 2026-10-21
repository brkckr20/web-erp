/**
 * Barkod kodu son hanesini artırır (top kopyalama / toplu üretim).
 * Örnek: HM00000001 → HM00000002
 */
export function incrementBarkod(barkod: string): string {
  const m = barkod.match(/(\d+)$/)
  if (!m) return barkod
  const next = String(Number(m[1]) + 1).padStart(m[1].length, '0')
  return barkod.slice(0, m.index) + next
}
