'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Kaydedilmemiş (kirli) değişiklik takibi.
 *
 * `deps`: kullanıcıyla değişen form değerleri (her render yeniden hesaplanır).
 * `temizle()`: ilk yükleme veya kayıt başarılı sonrası çağrılır. Snapshot
 * render sonrası effect'te alınır (batch sorunu yaşamamak için); snapshot
 * alınana kadar `kirli` false döner, böylece yükleme sırasında sekmede
 * kırmızı nokta bir kare bile yanıp sönmez.
 */
export function useKirli(deps: readonly unknown[]): { kirli: boolean; temizle: () => void } {
  const ser = JSON.stringify(deps)
  const [temizSer, setTemizSer] = useState<string>(() => ser)
  const [talep, setTalep] = useState(0)
  const serRef = useRef(ser)
  serRef.current = ser

  // temizle() çağrıldı, henüz snapshot alınmadı: aradaki değişiklikler kirli sayılmaz.
  const bekleyenRef = useRef(false)

  useEffect(() => {
    if (talep === 0) return
    bekleyenRef.current = false
    setTemizSer(serRef.current)
  }, [talep])

  const temizle = useCallback(() => {
    bekleyenRef.current = true
    setTalep((t) => t + 1)
  }, [])

  return { kirli: !bekleyenRef.current && ser !== temizSer, temizle }
}
