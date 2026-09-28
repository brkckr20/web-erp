'use client'

import { useEffect, useState } from 'react'
import { Button } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'

interface KurulumPromptu extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PwaRegister() {
  const [prompt, setPrompt] = useState<KurulumPromptu | null>(null)
  const [kuruluyor, setKuruluyor] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const sw = process.env.NODE_ENV === 'production' ? '/sw.js' : '/sw.dev.js'
    navigator.serviceWorker
      .register(sw, { scope: '/', updateViaCache: 'none' })
      .catch(() => undefined)

    const hazir = (e: Event) => {
      e.preventDefault()
      setPrompt(e as KurulumPromptu)
    }
    const kuruldu = () => setPrompt(null)

    window.addEventListener('beforeinstallprompt', hazir)
    window.addEventListener('appinstalled', kuruldu)
    return () => {
      window.removeEventListener('beforeinstallprompt', hazir)
      window.removeEventListener('appinstalled', kuruldu)
    }
  }, [])

  const kur = async () => {
    if (!prompt) return
    setKuruluyor(true)
    try {
      await prompt.prompt()
      const sonuc = await prompt.userChoice
      if (sonuc.outcome === 'accepted') setPrompt(null)
    } finally {
      setKuruluyor(false)
    }
  }

  if (!prompt) return null

  return (
    <div className="!fixed !bottom-4 !right-4 !z-[9999]">
      <Button
        type="primary"
        size="small"
        icon={<DownloadOutlined />}
        loading={kuruluyor}
        onClick={kur}
        className="!rounded-sm !font-semibold !shadow-lg"
        style={{ backgroundColor: '#f57c00' }}
      >
        Uygulamayı Kur
      </Button>
    </div>
  )
}
