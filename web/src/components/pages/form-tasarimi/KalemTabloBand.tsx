'use client'

import { useDroppable } from '@dnd-kit/core'
import type { Band, TabloBaslikArkaPlan, TabloKolon } from './types'
import { alanEtiket } from './sabitler'
import { alanCoz, degerMetin, type VeriMap } from '@/lib/reports/deger-format'

interface KolonHucreProps {
  bandId: string
  kolon: TabloKolon
  secili: boolean
  baslikArkaPlan: TabloBaslikArkaPlan
  onSelectKolon: (kolonId: string) => void
}

function KolonHucre({ bandId, kolon, secili, baslikArkaPlan, onSelectKolon }: KolonHucreProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `kolon:${bandId}:${kolon.id}` })
  const arkaPlan =
    secili ? '!bg-[#FF9933]/20' : isOver ? '!bg-[#FF9933]/40' : baslikArkaPlan === 'gri' ? '!bg-gray-50' : '!bg-white'
  return (
    <th
      ref={setNodeRef}
      className={`!border !border-gray-300 !p-0.5 !align-top !cursor-pointer ${arkaPlan}`}
      onClick={() => onSelectKolon(kolon.id)}
    >
      <div className="!text-[9px] !font-semibold !text-center">
        {kolon.baslik || (kolon.alan ? alanEtiket(kolon.alan) : '...')}
      </div>
    </th>
  )
}

interface KalemTabloBandProps {
  band: Band
  ornekVeri?: VeriMap
  seciliKolonId: string | null
  onSelectKolon: (kolonId: string) => void
}

export default function KalemTabloBand({ band, ornekVeri, seciliKolonId, onSelectKolon }: KalemTabloBandProps) {
  const kolonlar = band.tabloKolonlari ?? []
  const yeniKolon = useDroppable({ id: `yeni-kolon:${band.id}` })
  const baslikArkaPlan = band.baslikArkaPlan ?? 'gri'
  const cizgiStili = band.cizgiStili ?? 'yatay'
  const veriHucreSinif =
    cizgiStili === 'yok'
      ? '!p-0.5 !text-[9px]'
      : cizgiStili === 'kareli'
      ? '!border !border-gray-200 !p-0.5 !text-[9px]'
      : '!border-t !border-gray-200 !p-0.5 !text-[9px]'

  let ornekSatir: Record<string, unknown> | undefined
  const ilk = kolonlar.find((k) => k.alan)
  const coz = ilk?.alan ? alanCoz(ilk.alan) : null
  if (coz && ornekVeri) ornekSatir = ornekVeri[coz.sirano]?.[0]

  return (
    <table className="!w-full !border-collapse" style={{ borderSpacing: 1 }}>
      <thead>
        <tr>
          {kolonlar.map((kolon) => (
            <KolonHucre
              key={kolon.id}
              bandId={band.id}
              kolon={kolon}
              secili={seciliKolonId === kolon.id}
              baslikArkaPlan={baslikArkaPlan}
              onSelectKolon={onSelectKolon}
            />
          ))}
          <th
            // eslint-disable-next-line react-hooks/refs
            ref={yeniKolon.setNodeRef}
            // eslint-disable-next-line react-hooks/refs
            className={`!border !border-dashed !border-gray-400 !p-0.5 !min-w-[40px] ${yeniKolon.isOver ? '!bg-[#FF9933]/40' : ''}`}
          >
            <span className="!text-[9px] !text-gray-400">+ kolon</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          {kolonlar.map((kolon) => {
            const c = kolon.alan ? alanCoz(kolon.alan) : null
            const val = c && ornekSatir ? ornekSatir[c.kolon] : undefined
            return (
              <td key={kolon.id} className={veriHucreSinif}>
                {val !== undefined ? degerMetin(val, kolon.format) : kolon.alan ? alanEtiket(kolon.alan) : ' '}
              </td>
            )
          })}
          <td className={veriHucreSinif} />
        </tr>
      </tbody>
    </table>
  )
}
