'use client'

import { Input, App } from 'antd'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { useCallback, useState, useMemo, useEffect } from 'react'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { tedarikApi, type KumasPlanlamaSatir } from '@/lib/tedarik-api'

export default function KumasPlanlama() {
  const [satirlar, setSatirlar] = useState<KumasPlanlamaSatir[]>([])
  const [arama, setArama] = useState('')
  const { message } = App.useApp()

  const load = useCallback(() => {
    tedarikApi
      .planlamaKumas()
      .then(setSatirlar)
      .catch((err: unknown) =>
        message.error('Veriler yüklenemedi: ' + (err instanceof Error ? err.message : String(err))),
      )
  }, [message])

  useEffect(() => {
    load()
  }, [load])

  const filtrelenmis = useMemo(() => {
    const q = arama.trim().toLowerCase()
    if (!q) return satirlar
    return satirlar.filter(
      (r) =>
        r.siparisNo.toLowerCase().includes(q) ||
        (r.modelKod ?? '').toLowerCase().includes(q) ||
        (r.modelAd ?? '').toLowerCase().includes(q) ||
        (r.musteriAd ?? '').toLowerCase().includes(q) ||
        r.malzemeKod.toLowerCase().includes(q) ||
        r.malzemeAd.toLowerCase().includes(q) ||
        (r.islem ?? '').toLowerCase().includes(q) ||
        r.varyant1.toLowerCase().includes(q) ||
        r.varyant1Aciklama.toLowerCase().includes(q),
    )
  }, [satirlar, arama])

  const columns = useMemo<ColDef<KumasPlanlamaSatir>[]>(() => [
    { headerName: 'Sipariş No', field: 'siparisNo', width: 110, resizable: true },
    {
      headerName: 'Model Kodu - Adı',
      width: 200,
      resizable: true,
      flex: 1,
      minWidth: 160,
      valueGetter: (p) => [p.data?.modelKod, p.data?.modelAd].filter(Boolean).join(' - ') || '',
    },
    {
      headerName: 'Sipariş Miktarı',
      field: 'siparisMiktar',
      width: 110,
      type: 'rightAligned',
      resizable: true,
      valueFormatter: (p) => Number(p.value).toLocaleString('tr-TR', { maximumFractionDigits: 2 }),
    },
    { headerName: 'Müşteri Adı', field: 'musteriAd', width: 180, resizable: true },
    { headerName: 'Malzeme Kodu', field: 'malzemeKod', width: 130, resizable: true },
    { headerName: 'Malzeme Adı', field: 'malzemeAd', width: 160, resizable: true },
    { headerName: 'İşlem', field: 'islem', width: 140, resizable: true },
    { headerName: 'Varyant-1', field: 'varyant1', width: 190, resizable: true },
    { headerName: 'Varyant-1 Açıklama', field: 'varyant1Aciklama', width: 190, resizable: true },
    {
      headerName: 'Gereken Miktar',
      field: 'gerekenMiktar',
      width: 120,
      type: 'rightAligned',
      resizable: true,
      valueFormatter: (p) =>
        Number(p.value).toLocaleString('tr-TR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
    },
  ], [])

  const sorguMetni = arama.trim() ? ` - "${arama.trim()}"` : ''

  return (
    <div className="!p-3 !flex !flex-col !h-full">
      <div className="!flex !items-center !justify-between !mb-3">
        <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
          Kumaş Planlama
        </div>
        <div className="!flex !items-center !gap-1.5">
          <Input
            size="small"
            placeholder="Sipariş / Model / Müşteri / Malzeme ara..."
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
        <div className="!bg-white !rounded-sm !h-full !flex !flex-col">
          <div className="!flex-1 !min-h-0" style={{ minHeight: 250 }}>
            <DataGrid
              rowData={filtrelenmis}
              columnDefs={columns}
              domLayout="normal"
              storageKey="kumas-planlama"
              exportFileName="kumas-planlama"
              enableRowSelection
            />
          </div>
          <div className="!border-t !border-gray-200 !px-3 !py-2 !flex !items-center !justify-between !bg-[#fafafa] !flex-shrink-0">
            <span className="!text-[11px] !text-[#9ca3af]">
              Toplam {satirlar.length} kayıt{sorguMetni}
            </span>
            <span className="!text-[11px] !text-[#9ca3af] !tabular-nums">
              Görüntülenen: {filtrelenmis.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}