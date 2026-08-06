import type { HucreFormat } from '@/components/pages/form-tasarimi/types'
import { trDate, trNumber } from './pdf-common'

// Sorgu sonucu satırları — key = sorgunun sirano'su ("S1", "S2" ...)
export type VeriMap = Record<number, Record<string, unknown>[]>

export function alanCoz(alan: string): { sirano: number; kolon: string } | null {
  const m = /^S(\d+)\.(.+)$/.exec(alan)
  if (!m) return null
  return { sirano: Number(m[1]), kolon: m[2] }
}

function tarihGibi(v: unknown): Date | null {
  if (v instanceof Date && !isNaN(v.getTime())) return v
  if (typeof v !== 'string') return null
  const s = v.trim()
  const pat = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d{1,7})?)?([Zz]|[+-]\d{2}:?\d{2})?)?$/
  if (!pat.test(s)) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

function sayiCoz(v: unknown): number | null {
  if (typeof v === 'number') return isFinite(v) ? v : null
  if (typeof v === 'boolean') return v ? 1 : 0
  if (typeof v !== 'string') return null
  const s = v.trim().replace(/\s/g, '')
  if (!s) return null
  if (/^[+-]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) return parseFloat(s.replace(/\./g, '').replace(',', '.'))
  if (/^[+-]?\d+(,\d+)?$/.test(s)) return parseFloat(s.replace(',', '.'))
  if (/^[+-]?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(s)) return parseFloat(s)
  return null
}

function tarihGoster(d: Date, format: HucreFormat): string {
  if (format === 'tarih-yil-ay-gun') return d.toISOString().slice(0, 10)
  const gun = String(d.getDate()).padStart(2, '0')
  const ay = String(d.getMonth() + 1).padStart(2, '0')
  const yil = d.getFullYear()
  if (format === 'tarih-gun-ay-yil-saat') {
    const sa = String(d.getHours()).padStart(2, '0')
    const dk = String(d.getMinutes()).padStart(2, '0')
    return `${gun}.${ay}.${yil} ${sa}:${dk}`
  }
  return `${gun}.${ay}.${yil}`
}

export function degerMetin(v: unknown, format?: HucreFormat): string {
  if (v === null || v === undefined) return ''
  const f = format ?? 'otomatik'

  if (f.startsWith('tarih')) {
    const d = tarihGibi(v)
    return d ? tarihGoster(d, f) : String(v)
  }

  if (f.startsWith('sayi')) {
    const n = sayiCoz(v)
    if (n !== null) return trNumber(n, Number(f.slice('sayi-'.length)))
    return String(v)
  }

  // otomatik
  if (typeof v === 'number' && isFinite(v)) return trNumber(v, 2)
  const d = tarihGibi(v)
  if (d) return trDate(d.toISOString())
  if (typeof v === 'boolean') return v ? 'Evet' : 'Hayır'
  return String(v)
}
