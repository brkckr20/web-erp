'use client'

import { Select, Input, App } from 'antd'
import { ReloadOutlined, SearchOutlined, FileTextOutlined } from '@ant-design/icons'
import { useState, useMemo, useEffect } from 'react'
import type { ColDef, CellContextMenuEvent } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import SagTikMenu from '@/components/shared/SagTikMenu'
import { depoStokDetayApi, type DepoStokDetaySatir } from '@/lib/depo-bazli-stok-api'
import { depoApi, type Depo } from '@/lib/depo-api'

const tire = (v: string | null) => v || '-'

/** Satırın birleşik anahtarı (id'siz). Tıklanan satırın hafızası için. */
const satirAnahtari = (r: DepoStokDetaySatir) =>
  [r.depoKod, r.malzemeKod, r.renkKod, r.siparisNo, r.partiNo, r.takipNo].map((v) => v ?? '').join('|')

export default function DepoStokDetay({ onStokEkstresi }: { onStokEkstresi?: (malzemeKod: string, depoKod?: string) => void }) {
  const [satirlar, setSatirlar] = useState<DepoStokDetaySatir[]>([])
  const [depoList, setDepoList] = useState<Depo[]>([])
  const [depoFiltre, setDepoFiltre] = useState<string[]>([])
  const [arama, setArama] = useState('')
  const [loading, setLoading] = useState(false)
  const [tiklananSatir, setTiklananSatir] = useState<string | null>(null)
  const [sagTik, setSagTik] = useState<{ x: number; y: number; kod: string; depoKod: string } | null>(null)
  const { message } = App.useApp()

  const load = () => {
    setLoading(true)
    Promise.all([depoStokDetayApi.list(), depoApi.list()])
      .then(([s, d]) => {
        setSatirlar(s)
        setDepoList(d)
      })
      .catch((err: any) => message.error('Veriler yüklenemedi: ' + (err?.message || err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const filtrelenmis = useMemo(() => {
    let rows = satirlar.filter((r) => Math.abs(r.brutKg) > 0.0001 || Math.abs(r.kg) > 0.0001 || Math.abs(r.brutMt) > 0.0001 || Math.abs(r.mt) > 0.0001 || Math.abs(r.adet) > 0.0001)
    if (depoFiltre.length > 0) rows = rows.filter((r) => depoFiltre.includes(r.depoKod))
    const q = arama.trim().toLowerCase()
    if (q) {
      rows = rows.filter(
        (r) =>
          r.malzemeKod.toLowerCase().includes(q) ||
          r.malzemeAd.toLowerCase().includes(q) ||
          r.depoKod.toLowerCase().includes(q) ||
          r.depoAd.toLowerCase().includes(q) ||
          (r.renkKod ?? '').toLowerCase().includes(q) ||
          (r.renkAd ?? '').toLowerCase().includes(q) ||
          (r.siparisNo ?? '').toLowerCase().includes(q) ||
          (r.partiNo ?? '').toLowerCase().includes(q) ||
          (r.takipNo ?? '').toLowerCase().includes(q),
      )
    }
    return rows
  }, [satirlar, depoFiltre, arama])

  const miktarCol = (field: keyof DepoStokDetaySatir, baslik: string): ColDef<DepoStokDetaySatir> => ({
    headerName: baslik,
    field,
    width: 110,
    resizable: true,
    type: 'rightAligned',
    valueFormatter: (p) =>
      (p.value as number).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  })

  const columns = useMemo<ColDef<DepoStokDetaySatir>[]>(() => {
    const aktif = (f: keyof DepoStokDetaySatir) => satirlar.some((s) => Math.abs((s[f] as number) ?? 0) > 0.0001)
    const dinamik: ColDef<DepoStokDetaySatir>[] = []
    if (aktif('brutKg')) dinamik.push(miktarCol('brutKg', 'Brüt KG'))
    if (aktif('kg')) dinamik.push(miktarCol('kg', 'KG'))
    if (aktif('brutMt')) dinamik.push(miktarCol('brutMt', 'Brüt MT'))
    if (aktif('mt')) dinamik.push(miktarCol('mt', 'MT'))
    if (aktif('adet')) dinamik.push(miktarCol('adet', 'Adet'))

    return [
      { headerName: 'Depo Kodu', field: 'depoKod', width: 100, resizable: true },
      { headerName: 'Depo Adı', field: 'depoAd', width: 140, resizable: true },
      { headerName: 'Malzeme Kodu', field: 'malzemeKod', width: 120, resizable: true },
      { headerName: 'Malzeme Adı', field: 'malzemeAd', width: 170, resizable: true },
      { headerName: 'Renk Kodu', field: 'renkKod', width: 110, resizable: true, valueFormatter: (p) => tire(p.value as string | null) },
      { headerName: 'Renk Adı', field: 'renkAd', width: 150, resizable: true, valueFormatter: (p) => tire(p.value as string | null) },
      { headerName: 'Sipariş No', field: 'siparisNo', width: 110, resizable: true, valueFormatter: (p) => tire(p.value as string | null) },
      { headerName: 'Parti No', field: 'partiNo', width: 110, resizable: true, valueFormatter: (p) => tire(p.value as string | null) },
      { headerName: 'Takip No', field: 'takipNo', width: 110, resizable: true, valueFormatter: (p) => tire(p.value as string | null) },
      ...dinamik,
    ]
  }, [satirlar])

  return (
    <div className="!p-3 !flex !flex-col !h-full">
      <div className="!flex !items-center !justify-between !mb-3">
        <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
          Depo Stok Detayı
        </div>
        <div className="!flex !items-center !gap-1.5">
          <Select
            size="small"
            mode="multiple"
            allowClear
            maxTagCount="responsive"
            placeholder="Tüm Depolar"
            value={depoFiltre}
            onChange={(v) => setDepoFiltre(v ?? [])}
            className="!w-64 !text-[12px]"
            options={depoList.map((d) => ({ value: d.kod, label: `${d.kod} ${d.ad}` }))}
          />
          <Input
            size="small"
            placeholder="Malzeme / Renk / Sipariş / Parti ara..."
            allowClear
            prefix={<SearchOutlined style={{ fontSize: 12, color: '#9ca3af' }} />}
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            className="!w-64 !text-[12px]"
          />
          <button
            type="button"
            onClick={load}
            className="!text-[12px] !h-7 !px-2 !border !border-gray-300 !rounded !bg-white hover:!bg-gray-50 !flex !items-center !gap-1"
          >
            <ReloadOutlined /> Yenile
          </button>
        </div>
      </div>

      <div className="!flex-1 !min-h-0" style={{ minHeight: 300 }}>
        <div className="!bg-white !rounded-sm !h-full !flex !flex-col" onContextMenu={(e: any) => { e.preventDefault(); return false; }}>
          <div className="!flex-1 !min-h-0" style={{ minHeight: 250 }}>
            <DataGrid
              loading={loading}
              rowData={filtrelenmis}
              columnDefs={columns}
              domLayout="normal"
              exportFileName="depo-stok-detay"
              onCellClicked={(e) => {
                const a = e.data ? satirAnahtari(e.data) : null
                setTiklananSatir((prev) => (prev === a ? null : a))
              }}
              getRowClass={(e) =>
                e.data && satirAnahtari(e.data) === tiklananSatir ? 'secili-satir' : undefined
              }
              onCellContextMenu={(e: CellContextMenuEvent<DepoStokDetaySatir>) => {
                const ev = e.event as MouseEvent | undefined
                ev?.preventDefault?.()
                if (e.data) setSagTik({ x: ev?.clientX ?? 0, y: ev?.clientY ?? 0, kod: e.data.malzemeKod, depoKod: e.data.depoKod ?? '' })
              }}
            />
          </div>
          <div className="!border-t !border-gray-200 !px-3 !py-2 !flex !items-center !justify-between !bg-[#fafafa] !flex-shrink-0">
            <span className="!text-[11px] !text-[#9ca3af]">
              Toplam {filtrelenmis.length} kayıt
            </span>
            <span className="!text-[11px] !text-[#9ca3af] !tabular-nums">
              Depo-Malzeme-Renk-Sipariş-Parti: {satirlar.length}
            </span>
          </div>
        </div>
      </div>
      {sagTik && (
        <SagTikMenu
          position={sagTik}
          items={[
            {
              key: 'ekstre',
              label: 'Malzeme Ekstresi',
              icon: <FileTextOutlined />,
              onClick: () => {
                onStokEkstresi?.(sagTik.kod, sagTik.depoKod || undefined)
                setSagTik(null)
              },
            },
          ]}
          onClose={() => setSagTik(null)}
        />
      )}
    </div>
  )
}
