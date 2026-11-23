'use client'

import { Dropdown, Button, Spin } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect, useMemo } from 'react'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { odemePlanApi, type OdemePlan } from '@/lib/odeme-plan-api'
import YeniButonu, { useYeniYetkisi } from '@/components/shared/YeniButonu'

interface PlanRow {
  key: string
  id: number
  kod: string
  ad: string
  yetkiKodu: string | null
  ozelKod: string | null
  uluslararasiKod: string | null
  aciklama: string | null
}

interface OdemePlanListesiProps {
  onSelect?: (id: number) => void
  onNew?: () => void
}

export default function OdemePlanListesi({ onSelect, onNew }: OdemePlanListesiProps) {
  const yeniIzinli = useYeniYetkisi().izinli
  const [data, setData] = useState<PlanRow[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const list = await odemePlanApi.list()
      setData(
        list.map((p: OdemePlan) => ({
          key: String(p.id),
          id: p.id,
          kod: p.kod,
          ad: p.ad,
          yetkiKodu: p.yetkiKodu,
          ozelKod: p.ozelKod,
          uluslararasiKod: p.uluslararasiKod,
          aciklama: p.aciklama,
        })),
      )
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const contextMenuItems: MenuProps['items'] = [
    { key: 'yeni', label: 'Yeni', icon: <PlusOutlined />, disabled: !yeniIzinli, onClick: () => onNew?.() },
    { key: 'duzenle', label: 'Düzenle', disabled: !selectedId, onClick: () => selectedId && onSelect?.(selectedId) },
  ]

  const columns = useMemo<ColDef<PlanRow>[]>(() => {
    const cols: ColDef<PlanRow>[] = [
      {
        headerName: 'Kodu',
        field: 'kod',
        width: 110,
        cellStyle: { color: '#f57c00', fontWeight: 500 },
      },
      { headerName: 'Adı', field: 'ad', flex: 1, minWidth: 160 },
      { headerName: 'Yetki Kodu', field: 'yetkiKodu', width: 130 },
      { headerName: 'Özel Kod', field: 'ozelKod', width: 120 },
      { headerName: 'Uluslararası Kod', field: 'uluslararasiKod', width: 150 },
      { headerName: 'Açıklama', field: 'aciklama', flex: 1, minWidth: 180 },
    ]
    return cols
  }, [])

  return (
    <Dropdown menu={{ items: contextMenuItems }} trigger={['contextMenu']}>
      <div className="!p-3 !h-full !flex !flex-col">
        <div className="!flex !items-center !justify-between !mb-3 !flex-shrink-0">
          <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
            Ödeme Planları Listesi
          </div>
          <div className="!flex !items-center !gap-1.5">
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={load}
              className="!text-[11px] !h-7"
            />
            <YeniButonu onClick={onNew} className="!text-[11px] !h-7" />
          </div>
        </div>

        <div className="!bg-white !rounded-sm !flex-1 !min-h-0" style={{ minHeight: 300 }}>
          <Spin spinning={loading} classNames={{ root: '!h-full [&_.ant-spin-container]:!h-full' }}>
            <DataGrid
              rowData={data}
              columnDefs={columns}
              domLayout="normal"
              exportFileName="odeme-planlari"
              rowSelection="single"
              onSelectionChanged={(e) => {
                const sel = e.api.getSelectedRows()
                setSelectedId(sel[0]?.id ?? null)
              }}
              onRowDoubleClicked={(e) => e.data && onSelect?.(e.data.id)}
            />
          </Spin>
        </div>
      </div>
    </Dropdown>
  )
}
