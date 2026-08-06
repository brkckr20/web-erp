'use client'

import { useDroppable } from '@dnd-kit/core'
import type { Band, Secim } from './types'
import { bandTipiAdlari } from './mock'
import { OLCU } from './sabitler'
import type { VeriMap } from '@/lib/reports/deger-format'
import BandEleman from './BandEleman'
import KalemTabloBand from './KalemTabloBand'
import type { MouseEvent as ReactMouseEvent } from 'react'

interface BandSectionProps {
  band: Band
  index: number
  total: number
  secili: Secim | null
  ornekVeri?: VeriMap
  onSec: () => void
  onSeciliHucre: (bandId: string, hucreId: string) => void
  onBoyutBasla: (e: ReactMouseEvent, bandId: string, hucreId: string) => void
  onElemanSil: (bandId: string, hucreId: string) => void
  onYukari: () => void
  onAsagi: () => void
  onSil: () => void
  onElemanEkle: (bandId: string) => void
  onSelectKolon: (kolonId: string) => void
}

export default function BandSection(props: BandSectionProps) {
  const { band, index, total, secili } = props
  const bandSecili = secili?.tur === 'band' && secili.bandId === band.id
  const icerikYukseklik = band.elemanlar.reduce((a, e) => Math.max(a, e.y + e.yukseklik), 8)
  const bandYukseklik = band.yukseklik != null ? Math.max(band.yukseklik, icerikYukseklik) : icerikYukseklik
  const icerik = useDroppable({ id: `band:${band.id}` })
  return (
    <div
      onClick={props.onSec}
      className={`!rounded-sm !overflow-hidden !border !bg-white ${
        bandSecili ? '!border-[#FF9933] !ring-1 !ring-[#FF9933]' : '!border-dashed !border-gray-300'
      }`}
    >
      <div
        className="!flex !items-center !gap-1 !px-1.5 !py-0.5 !bg-[#f1f2f4] !border-b !border-gray-200 !cursor-pointer"
        onClick={props.onSec}
      >
        <span className="!text-[10px] !font-semibold !text-[#333]">{band.ad}</span>
        <span className="!text-[9px] !text-[#9ca3af]">{bandTipiAdlari[band.tip]}</span>
        <span className="!flex-1" />
        {band.tip !== 'kalem-tablo' && (
          <button
            type="button"
            className="!text-[10px] !text-[#9ca3af] !px-1"
            onClick={(e) => {
              e.stopPropagation()
              props.onElemanEkle(band.id)
            }}
            title="Eleman ekle"
          >
            + Eleman
          </button>
        )}
        <button
          type="button"
          className="!text-[10px] !text-[#9ca3af] !px-1 disabled:!opacity-30"
          onClick={(e) => {
            e.stopPropagation()
            props.onYukari()
          }}
          disabled={index <= 0}
        >
          ↑
        </button>
        <button
          type="button"
          className="!text-[10px] !text-[#9ca3af] !px-1 disabled:!opacity-30"
          onClick={(e) => {
            e.stopPropagation()
            props.onAsagi()
          }}
          disabled={index >= total - 1}
        >
          ↓
        </button>
        <button
          type="button"
          className="!text-[10px] !text-red-400 !px-1"
          onClick={(e) => {
            e.stopPropagation()
            props.onSil()
          }}
        >
          🗑
        </button>
      </div>
      <div
        // eslint-disable-next-line react-hooks/refs
        ref={icerik.setNodeRef}
        // eslint-disable-next-line react-hooks/refs
        className={`!p-1.5 !relative ${icerik.isOver ? '!ring-2 !ring-[#FF9933]/60' : ''}`}
        style={{ minHeight: bandYukseklik * OLCU }}
      >
        {band.tip === 'kalem-tablo' ? (
          <KalemTabloBand
            band={band}
            ornekVeri={props.ornekVeri}
            seciliKolonId={secili?.tur === 'kolon' ? secili.kolonId : null}
            onSelectKolon={props.onSelectKolon}
          />
        ) : (
          band.elemanlar.map((el) => (
            <BandEleman
              key={el.id}
              eleman={el}
              bandId={band.id}
              secili={secili?.tur === 'hucre' && secili.bandId === band.id && secili.hucreId === el.id}
              ornekVeri={props.ornekVeri}
              onSelect={() => props.onSeciliHucre(band.id, el.id)}
              onBoyutBasla={(e) => props.onBoyutBasla(e, band.id, el.id)}
              onSil={() => props.onElemanSil(band.id, el.id)}
            />
          ))
        )}
        {band.tip !== 'kalem-tablo' && band.elemanlar.length === 0 && (
          <div className="!flex !items-center !justify-center !h-10 !text-[10px] !text-[#9ca3af]">
            Alanları buraya sürükleyin veya + Eleman ekleyin
          </div>
        )}
      </div>
    </div>
  )
}
