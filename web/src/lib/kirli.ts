'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Kaydedilmemiş (kirli) değişiklik takibi.
 *
 * `deps`: kullanıcıyla değişen form değerleri (her render yeniden hesaplanır).
 * `temizle()`: ilk yükleme veya kayıt başarılı sonrası çağrılır. State
 * güncellemeleri tamamlandıktan SONRA snapshot alır (batch sorunu yaşamamak
 * için ref + effect ile).
 */
export function useKirli(deps: readonly unknown[]): { kirli: boolean; temizle: () => void } {
  const ser = JSON.stringify(deps)
  const [temizSer, setTemizSer] = useState<string>(() => ser)
  const [talep, setTalep] = useState(0)
  const serRef = useRef(ser)
  serRef.current = ser

  useEffect(() => {
    if (talep === 0) return
    setTemizSer(serRef.current)
  }, [talep])

  const temizle = useCallback(() => setTalep((t) => t + 1), [])

  return { kirli: ser !== temizSer, temizle }
}
