'use client'

import { useDraggable } from '@dnd-kit/core'
import type { BilesenTipi } from './types'

interface SolPanelProps {
  alanlar: { value: string; label: string }[]
}

const BILESENLER: { bilesen: BilesenTipi; ad: string }[] = [
  { bilesen: 'metin', ad: 'Metin' },
  { bilesen: 'checkbox', ad: 'Checkbox' },
  { bilesen: 'resim', ad: 'Resim' },
  { bilesen: 'tablo', ad: 'Tablo' },
  { bilesen: 'barkod', ad: 'Barkod' },
]

function DraggableItem({ id, data, children }: { id: string; data: Record<string, unknown>; children: React.ReactNode }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({ id, data })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="!px-1.5 !py-1 !bg-white !border !border-gray-200 !rounded-sm !text-[10px] !cursor-grab !active:cursor-grabbing hover:!border-[#FF9933]"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {children}
    </div>
  )
}

export default function SolPanel({ alanlar }: SolPanelProps) {
  return (
    <div className="!h-full !overflow-y-auto !p-2 !flex !flex-col !gap-2">
      <div>
        <div className="!text-[10px] !font-semibold !text-[#6b7280] !uppercase !mb-1">Bileşenler</div>
        <div className="!flex !flex-col !gap-1">
          {BILESENLER.map((b) => (
            <DraggableItem key={b.bilesen} id={`bilesen:${b.bilesen}`} data={{ tur: 'bilesen', bilesen: b.bilesen }}>
              <span className="!text-[10px] !text-[#333]">{b.ad}</span>
            </DraggableItem>
          ))}
        </div>
      </div>

      <div>
        <div className="!text-[10px] !font-semibold !text-[#6b7280] !uppercase !mb-1">Veri Alanları</div>
        {alanlar.length === 0 ? (
          <div className="!text-[10px] !text-[#9ca3af] !p-1.5">
            Kolonlar buraya gelecek.
            <br />
            Önce <b>Sorgular</b> sekmesinde sorguyu yazıp <b>Çalıştır</b> butonuna basın.
          </div>
        ) : (
          <div className="!flex !flex-col !gap-1">
            {alanlar.map((a) => (
              <DraggableItem key={a.value} id={`alan:${a.value}`} data={{ tur: 'alan', alan: a.value }}>
                <span className="!text-[10px] !text-[#6b7280]">{a.value}</span>
              </DraggableItem>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
