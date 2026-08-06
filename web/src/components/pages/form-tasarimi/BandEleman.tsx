'use client'

import { useDraggable } from '@dnd-kit/core'
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react'
import type { BandHucre } from './types'
import { HIZA_CSS, OLCU, hucreGosterim, hucreStil } from './sabitler'
import type { VeriMap } from '@/lib/reports/deger-format'

interface BandElemanProps {
  eleman: BandHucre
  bandId: string
  secili: boolean
  ornekVeri?: VeriMap
  onSelect: () => void
  onBoyutBasla: (e: ReactMouseEvent) => void
  onSil: () => void
}

export default function BandEleman({ eleman, bandId, secili, ornekVeri, onSelect, onBoyutBasla, onSil }: BandElemanProps) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: `eleman:${bandId}:${eleman.id}`,
    data: { tur: 'eleman', bandId, hucreId: eleman.id },
  })
  const s = hucreStil(eleman)
  const style: CSSProperties = {
    left: eleman.x * OLCU,
    top: eleman.y * OLCU,
    width: eleman.genislik * OLCU,
    height: eleman.yukseklik * OLCU,
    fontSize: s.fontBoyutu ?? 9,
    fontWeight: s.kalin ? 'bold' : undefined,
    textAlign: s.hizalama ? HIZA_CSS[s.hizalama] : 'left',
    background: s.arkaPlan,
    border: s.kenarlik ? '1px solid #d1d5db' : '1px dashed transparent',
    opacity: isDragging ? 0.6 : 1,
  }
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`!absolute !flex !items-center !rounded-sm !cursor-move !select-none !overflow-hidden ${
        secili ? '!ring-2 !ring-[#FF9933]' : 'hover:!ring-1 hover:!ring-[#FF9933]/50'
      }`}
      style={style}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      <span className="!block !w-full !leading-tight !px-1">
        {hucreGosterim(eleman, ornekVeri) || <span className="!text-[9px] !text-gray-300">boş</span>}
      </span>
      {secili && (
        <>
          <div
            className="!absolute !right-0 !bottom-0 !w-3 !h-3 !cursor-se-resize !bg-[#FF9933] !rounded-sm"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => {
              e.stopPropagation()
              onBoyutBasla(e)
            }}
          />
          <button
            type="button"
            className="!absolute !-top-2 !-right-2 !w-4 !h-4 !flex !items-center !justify-center !text-[10px] !text-white !bg-red-500 !rounded-full !shadow !cursor-pointer"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onSil()
            }}
            title="Elemanı sil"
          >
            ×
          </button>
        </>
      )}
    </div>
  )
}
