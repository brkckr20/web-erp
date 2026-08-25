'use client'

import { Button, InputNumber, Select } from 'antd'
import type { SayfaAyari } from './types'

interface SayfaAyariPanelProps {
  sayfa: SayfaAyari
  onChange: (p: Partial<SayfaAyari>) => void
}

export default function SayfaAyariPanel({ sayfa, onChange }: SayfaAyariPanelProps) {
  return (
    <div className="!border !border-gray-300 !rounded-sm !bg-[#FAFAFA] !p-2 !flex !items-center !gap-3 !shrink-0">
      <span className="!text-[11px] !font-semibold !text-[#333]">Sayfa Ayarı</span>
      <span className="!text-[10px] !text-[#6b7280]">Boyut:</span>
      <Select
        size="small"
        className="!w-20"
        value={sayfa.boyut}
        onChange={(v) => onChange({ boyut: v })}
        options={[
          { value: 'A4', label: 'A4' },
          { value: 'A5', label: 'A5' },
          { value: 'Ozel', label: 'Özel' },
        ]}
      />
      <span className="!text-[10px] !text-[#6b7280]">Yön:</span>
      <Select
        size="small"
        className="!w-24"
        value={sayfa.yon}
        onChange={(v) => onChange({ yon: v })}
        options={[
          { value: 'dikey', label: 'Dikey' },
          { value: 'yatay', label: 'Yatay' },
        ]}
      />
      <span className="!text-[10px] !text-[#6b7280]">Kenarlar (mm):</span>
      {(
        [
          ['kenarUst', 'Üst'],
          ['kenarAlt', 'Alt'],
          ['kenarSol', 'Sol'],
          ['kenarSag', 'Sağ'],
        ] as const
      ).map(([k, lbl]) => (
        <span key={k} className="!flex !items-center !gap-1">
          <span className="!text-[9px] !text-[#9ca3af]">{lbl}</span>
          <InputNumber
            size="small"
            className="!w-14"
            min={0}
            max={50}
            value={sayfa[k]}
            onChange={(v) => onChange({ [k]: v ?? 0 } as Partial<SayfaAyari>)}
          />
        </span>
      ))}
      {sayfa.boyut === 'Ozel' && (
        <>
          <span className="!text-[10px] !text-[#6b7280]">Özel Boyut (mm):</span>
          <span className="!flex !items-center !gap-1">
            <span className="!text-[9px] !text-[#9ca3af]">Genişlik</span>
            <InputNumber
              size="small"
              className="!w-16"
              min={10}
              max={500}
              value={sayfa.ozelGenislik ?? 210}
              onChange={(v) => onChange({ ozelGenislik: v ?? 210 })}
            />
          </span>
          <span className="!flex !items-center !gap-1">
            <span className="!text-[9px] !text-[#9ca3af]">Yükseklik</span>
            <InputNumber
              size="small"
              className="!w-16"
              min={10}
              max={500}
              value={sayfa.ozelYukseklik ?? 297}
              onChange={(v) => onChange({ ozelYukseklik: v ?? 297 })}
            />
          </span>
          <Button
            size="small"
            className="!h-5 !text-[9px]"
            onClick={() => onChange({ boyut: 'A4', ozelGenislik: undefined, ozelYukseklik: undefined })}
          >
            Sıfırla
          </Button>
        </>
      )}
    </div>
  )
}
