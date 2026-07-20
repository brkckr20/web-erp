'use client'

import { Select, Input, App } from 'antd'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { useState, useMemo, useEffect } from 'react'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { depoBazliStokApi, type DepoBazliStokSatir } from '@/lib/depo-bazli-stok-api'
import { depoApi, type Depo } from '@/lib/depo-api'

export default function DepoBazliStok() {
  const [satirlar, setSatirlar] = useState<DepoBazliStokSatir[]>([])
  const [depoList, setDepoList] = useState<Depo[]>([])
  const [depoFiltre, setDepoFiltre] = useState<string>('')
  const [arama, setArama] = useState('')
  const { message } = App.useApp()

  const load = () => {
    Promise.all([depoBazliStokApi.list(), depoApi.list()])
      .then(([s, d]) => {
        setSatirlar(s)
        setDepoList(d)
      })
      .catch((err: any) => message.error('Veriler yüklenemedi: ' + (err?.message || err)))
  }

  useEffect(() => {
    load()
  }, [])

  const filtrelenmis = useMemo(() => {
    let rows = satirlar
    if (depoFiltre) rows = rows.filter((r) => r.depoKod === depoFiltre)
    const q = arama.trim().toLowerCase()
    if (q) {
      rows = rows.filter(
        (r) =>
          r.malzemeKod.toLowerCase().includes(q) ||
          r.malzemeAd.toLowerCase().includes(q) ||
          r.depoKod.toLowerCase().includes(q) ||
          r.depoAd.toLowerCase().includes(q),
      )
    }
    return rows
  }, [satirlar, depoFiltre, arama])

  const miktarCol = (field: keyof DepoBazliStokSatir, baslik: string): ColDef<DepoBazliStokSatir> => ({
    headerName: baslik,
    field,
    width: 110,
    resizable: true,
    type: 'rightAligned',
    valueFormatter: (p) =>
      (p.value as number).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  })

  const columns = useMemo<ColDef<DepoBazliStokSatir>[]>(() => {
    const aktif = (f: keyof DepoBazliStokSatir) => satirlar.some((s) => Math.abs((s[f] as number) ?? 0) > 0.0001)
    const dinamik: ColDef<DepoBazliStokSatir>[] = []
    if (aktif('brutKg')) dinamik.push(miktarCol('brutKg', 'Brüt KG'))
    if (aktif('kg')) dinamik.push(miktarCol('kg', 'KG'))
    if (aktif('brutMt')) dinamik.push(miktarCol('brutMt', 'Brüt MT'))
    if (aktif('mt')) dinamik.push(miktarCol('mt', 'MT'))
    if (aktif('adet')) dinamik.push(miktarCol('adet', 'Adet'))

    return [
      { headerName: 'Depo Kodu', field: 'depoKod', width: 110, resizable: true },
      { headerName: 'Depo Adı', field: 'depoAd', width: 160, resizable: true },
      { headerName: 'Malzeme Kodu', field: 'malzemeKod', width: 130, resizable: true },
      { headerName: 'Malzeme Adı', field: 'malzemeAd', flex: 1, minWidth: 160, resizable: true },
      ...dinamik,
    ]
  }, [satirlar])

  return (
    <div className="!p-3 !flex !flex-col !h-full">
      <div className="!flex !items-center !justify-between !mb-3">
        <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
          Depo Bazlı Stok
        </div>
        <div className="!flex !items-center !gap-1.5">
          <Select
            size="small"
            allowClear
            placeholder="Tüm Depolar"
            value={depoFiltre || undefined}
            onChange={(v) => setDepoFiltre(v ?? '')}
            className="!w-48 !text-[12px]"
            options={depoList.map((d) => ({ value: d.kod, label: `${d.kod} ${d.ad}` }))}
          />
          <Input
            size="small"
            placeholder="Malzeme / Depo ara..."
            allowClear
            prefix={<SearchOutlined style={{ fontSize: 12, color: '#9ca3af' }} />}
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            className="!w-52 !text-[12px]"
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
        <div className="!bg-white !rounded-sm !h-full !flex !flex-col">
          <div className="!flex-1 !min-h-0" style={{ minHeight: 250 }}>
            <DataGrid
              rowData={filtrelenmis}
              columnDefs={columns}
              domLayout="normal"
              exportFileName="depo-bazli-stok"
            />
          </div>
          <div className="!border-t !border-gray-200 !px-3 !py-2 !flex !items-center !justify-between !bg-[#fafafa] !flex-shrink-0">
            <span className="!text-[11px] !text-[#9ca3af]">
              Toplam {filtrelenmis.length} kayıt
            </span>
            <span className="!text-[11px] !text-[#9ca3af] !tabular-nums">
              Depo-Malzeme: {satirlar.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
