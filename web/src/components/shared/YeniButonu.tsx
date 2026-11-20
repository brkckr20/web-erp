'use client'

import { Button, Tooltip } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useSekmeYetkisi } from '@/context/SekmeYetkiContext'
import { YETKI_YOK } from '@/lib/yetki'

interface YeniButonuProps {
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export function useYeniYetkisi(): { gorunur: boolean; izinli: boolean } {
  const yetki = useSekmeYetkisi()
  return { gorunur: yetki('goruntule'), izinli: yetki('kaydet') }
}

/** Liste ekranlarının "Yeni" butonu: ekran görünmüyorsa gizli, kaydet izni yoksa pasif + gerekçe. */
export default function YeniButonu({ onClick, disabled, className = '!text-[11px] !h-7' }: YeniButonuProps) {
  const { gorunur, izinli } = useYeniYetkisi()
  if (!gorunur) return null
  const dugme = (
    <Button
      type="primary"
      size="small"
      icon={<PlusOutlined />}
      onClick={onClick}
      disabled={disabled || !izinli}
      className={className}
    >
      Yeni
    </Button>
  )
  return izinli ? dugme : <Tooltip title={YETKI_YOK}><span className="!inline-flex">{dugme}</span></Tooltip>
}
