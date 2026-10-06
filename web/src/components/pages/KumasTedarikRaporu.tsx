'use client'

import { Input, App } from 'antd'
import { ReloadOutlined, SearchOutlined, WarningOutlined } from '@ant-design/icons'
import { useCallback, useState, useMemo, useEffect } from 'react'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { tedarikApi, type KumasPlanlamaSatir } from '@/lib/tedarik-api'

const miktarFmt = (v: unknown) =>
  Number(v ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })

export default function KumasTedarikRaporu() {
  const [satirlar, setSatirlar] = useState<KumasPlanlamaSatir[]>([])
  const [arama, setArama] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const { message } = App.useApp()

  const load = useCallback(() => {
    setYukleniyor(true)
    return tedarikApi
      .planlamaKumas()
      .then(setSatirlar)
      .catch((err: unknown) =>
        message.error('Veriler yüklenemedi: ' + (err instanceof Error ? err.message : String(err))),
      )
      .finally(() => setYukleniyor(false))
  }, [message])

  useEffect(() => {
    load()
  }, [load])

  // Rapor özeti: aynı Sipariş No + Malzeme + Varyant satırlarının miktarları toplanır.
  const filtrelenmis = useMemo(() => {
    const q = arama.trim().toLowerCase()
    const havuz = !q
      ? satirlar
      : satirlar.filter(
        (r) =>
          r.siparisNo.toLowerCase().includes(q) ||
          r.malzemeKod.toLowerCase().includes(q) ||
          r.malzemeAd.toLowerCase().includes(q) ||
          r.varyant1.toLowerCase().includes(q) ||
          r.varyant1Aciklama.toLowerCase().includes(q),
      )
    const gruplar = new Map<string, KumasPlanlamaSatir>()
    for (const r of havuz) {
      const key = [r.siparisNo, r.malzemeKod, r.malzemeAd, r.varyant1, r.varyant1Aciklama].join('|')
      const mevcut = gruplar.get(key)
      if (!mevcut) {
        gruplar.set(key, { ...r })
      } else {
        mevcut.brutMiktar = Number(mevcut.brutMiktar ?? 0) + Number(r.brutMiktar ?? 0)
        mevcut.gerekenMiktar = Number(mevcut.gerekenMiktar ?? 0) + Number(r.gerekenMiktar ?? 0)
        mevcut.guncelMi = mevcut.guncelMi !== false && r.guncelMi !== false
      }
    }
    return [...gruplar.values()]
  }, [satirlar, arama])

  const bayatSatirlar = useMemo(() => filtrelenmis.filter((r) => r.guncelMi === false), [filtrelenmis])

  const toplamGrup = useMemo(() => {
    const keys = new Set(
      satirlar.map((r) => [r.siparisNo, r.malzemeKod, r.malzemeAd, r.varyant1, r.varyant1Aciklama].join('|')),
    )
    return keys.size
  }, [satirlar])

  const columns = useMemo<ColDef<KumasPlanlamaSatir>[]>(() => [
    { headerName: 'Sipariş No', field: 'siparisNo', width: 110, resizable: true },
    { headerName: 'Malzeme Kodu', field: 'malzemeKod', width: 130, resizable: true },
    { headerName: 'Malzeme Adı', field: 'malzemeAd', width: 200, flex: 1, minWidth: 160, resizable: true },
    { headerName: 'Varyant-1', field: 'varyant1', width: 150, resizable: true },
    { headerName: 'Varyant-1 Açıklama', field: 'varyant1Aciklama', width: 190, resizable: true },
    {
      headerName: 'İhtiyaç Miktarı (Mt)',
      field: 'brutMiktar',
      width: 150,
      type: 'rightAligned',
      resizable: true,
      valueFormatter: (p) => miktarFmt(p.value),
    },
    {
      headerName: 'Kesim Fazlası İhtiyaç Miktarı (Mt)',
      field: 'gerekenMiktar',
      width: 200,
      type: 'rightAligned',
      resizable: true,
      valueFormatter: (p) => miktarFmt(p.value),
    },
  ], [])

  const sorguMetni = arama.trim() ? ` - "${arama.trim()}"` : ''

  return (
    <div className="!p-3 !flex !flex-col !h-full kumas-tedarik-raporu">
      <div className="!flex !items-center !justify-between !mb-3">
        <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
          Kumaş Tedarik Raporu
        </div>
        <div className="!flex !items-center !gap-1.5">
          <Input
            size="small"
            placeholder="Sipariş / Malzeme / Varyant ara..."
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

      {bayatSatirlar.length > 0 && (
        <div className="!mb-2 !flex !items-center !gap-2 !rounded-sm !border !border-[#fcd34d] !bg-[#fffbeb] !px-3 !py-1.5 !flex-shrink-0">
          <WarningOutlined style={{ color: '#d97706' }} />
          <span className="!text-[12px] !text-[#92400e]">
            <span className="!font-semibold">{bayatSatirlar.length} satırın</span> tedarik hesabı
            güncel değil (sipariş/reçete değişmiş, hesap yenilenmemiş).
          </span>
        </div>
      )}

      <div className="!flex-1 !min-h-0" style={{ minHeight: 300 }}>
        <div className="!bg-white !rounded-sm !h-full !flex !flex-col">
          <div className="!flex-1 !min-h-0" style={{ minHeight: 250 }}>
            <DataGrid
              loading={yukleniyor}
              rowData={filtrelenmis}
              columnDefs={columns}
              domLayout="normal"
              storageKey="kumas-tedarik-raporu"
              exportFileName="kumas-tedarik-raporu"
              getRowClass={(p) => (p.data?.guncelMi === false ? 'bayat-satir' : '')}
              getRowStyle={(p) => {
                if (p.data?.guncelMi === false) return undefined
                if (p.node?.isSelected()) return { background: '#ffe0b2' }
                return (p.node?.rowIndex ?? 0) % 2 === 1 ? { background: '#f6f8fa' } : undefined
              }}
              enableRowSelection
            />
          </div>
          <div className="!border-t !border-gray-200 !px-3 !py-2 !flex !items-center !justify-between !bg-[#fafafa] !flex-shrink-0">
            <span className="!text-[11px] !text-[#9ca3af]">
              Toplam {toplamGrup} kayıt{sorguMetni}
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
