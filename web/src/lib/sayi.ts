/**
 * Türkçe ondalık ayracını (virgül) destekleyen sayı yardımcıları.
 *
 * Operatör "7,9" yazdığında `parseFloat('7,9')` 7 döndürüyor, `Number('7,9')` ise
 * NaN üretiyordu. Bu yüzden tutar/miktar hesapları bozuluyor ve sayısal alanlar
 * kaydedilirken null'a düşüyordu. Bu modül tek bir normalize noktası sunar.
 */

/** "7,9" / "7.9" / "1.234,56" gibi girdileri sayıya çevirir. Geçersizse 0 döner. */
export function parseSayi(v: string | number | null | undefined): number {
  if (v === null || v === undefined || v === '') return 0
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const s = String(v).trim().replace(/\s/g, '')
  if (!s) return 0
  const virgulVar = s.includes(',')
  const noktaVar = s.includes('.')
  let normalize: string
  if (virgulVar && noktaVar) {
    // Hem binlik hem ondalık ayracı var: son görünen ayraç ondalıktır.
    const ondalikIdx = Math.max(s.lastIndexOf(','), s.lastIndexOf('.'))
    const bas = s.slice(0, ondalikIdx).replace(/[.,]/g, '')
    const son = s.slice(ondalikIdx + 1).replace(/[.,]/g, '')
    normalize = `${bas}.${son}`
  } else if (virgulVar) {
    normalize = s.replace(',', '.')
  } else {
    normalize = s
  }
  const n = Number(normalize)
  return Number.isFinite(n) ? n : 0
}

/**
 * Sayısal grid hücresi için girdi ayrıştırıcı.
 * Virgüllü yazılan değeri sayıya çevirir; boş veya sayı olmayan girdide null döner.
 */
export function parseSayiGirdi(v: unknown): number | null {
  if (v === null || v === undefined) return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  const s = String(v).trim()
  if (!s) return null
  if (!/^-?[\d.,]+$/.test(s)) return null
  const n = parseSayi(s)
  return Number.isFinite(n) ? n : null
}
