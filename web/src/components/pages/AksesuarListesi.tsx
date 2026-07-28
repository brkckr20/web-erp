'use client'

import { Dropdown, Button, Spin } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect, useMemo } from 'react'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { aksesuarApi, type Aksesuar } from '@/lib/aksesuar-api'
import { aksesuarTipiApi, type AksesuarTipi } from '@/lib/aksesuar-tipi-api'

interface AksesuarRow {
  key: string
  id: number
  kod: string
  ad: string
  kullanimda: boolean
  cinsi: string | null
  renk: string | null
  ebat: string | null
  ureticiUrunKodu: string | null
  markaAd: string | null
  ozellik1: string | null
}

interface AksesuarListesiProps {
  onSelect?: (kod: string) => void
  onNew?: (tipId?: number, tipAd?: string) => void
  onNewTipi?: () => void
}

export default function AksesuarListesi({ onSelect, onNew, onNewTipi }: AksesuarListesiProps) {
  const [data, setData] = useState<AksesuarRow[]>([])
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [tipList, setTipList] = useState<AksesuarTipi[]>([])

  const load = async () => {
    setLoading(true)
    try {
      const list = await aksesuarApi.list()
      setData(
        list.map((d: Aksesuar) => ({
          key: String(d.id),
          id: d.id,
          kod: d.kod,
          ad: d.ad,
          kullanimda: d.kullanimda,
          cinsi: d.cinsi ?? null,
          renk: (d as any).renk ?? null,
          ebat: d.ebat ?? null,
          ureticiUrunKodu: d.ureticiUrunKodu ?? null,
          markaAd: (d as any).markaRef?.ad ?? null,
          ozellik1: (d as any).ozellik1 ?? null,
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
    aksesuarTipiApi.list().then(setTipList).catch(() => {})
  }, [])

  const contextMenuItems: MenuProps['items'] = [
    { key: 'yeni', label: 'Yeni', icon: <PlusOutlined />, onClick: () => onNew?.() },
    { key: 'duzenle', label: 'Düzenle', disabled: !selectedRow, onClick: () => selectedRow && onSelect?.(selectedRow) },
    { type: 'divider' },
  ]

  const yeniDropdownItems: MenuProps['items'] = tipList
    .filter((t) => t.kullanimda)
    .map((t) => ({
      key: String(t.id),
      label: t.ad,
      icon: <PlusOutlined />,
      onClick: () => onNew?.(t.id, t.ad),
    }))

  const columns = useMemo<ColDef<AksesuarRow>[]>(
    () => [
      {
        headerName: 'Kodu',
        field: 'kod',
        width: 130,
        cellStyle: { color: '#f57c00', fontWeight: 500 },
      },
      { headerName: 'Adı', field: 'ad', flex: 1, minWidth: 160 },
      { headerName: 'Cinsi', field: 'cinsi', width: 100, valueFormatter: (p) => p.value ?? '-' },
      { headerName: 'Renk', field: 'renk', width: 90, valueFormatter: (p) => p.value ?? '-' },
      { headerName: 'Ebat', field: 'ebat', width: 120, valueFormatter: (p) => p.value ?? '-' },
      { headerName: 'Üretici Kodu', field: 'ureticiUrunKodu', width: 120, valueFormatter: (p) => p.value ?? '-' },
      { headerName: 'Marka', field: 'markaAd', width: 100, valueFormatter: (p) => p.value ?? '-' },
      { headerName: 'Özellik 1', field: 'ozellik1', width: 100, valueFormatter: (p) => p.value ?? '-' },
      {
        headerName: 'Durum',
        field: 'kullanimda',
        width: 90,
        valueFormatter: (p) => (p.value ? 'Aktif' : 'Pasif'),
        cellStyle: (p) => (p.value ? { color: '#16a34a' } : { color: '#9ca3af' }),
      },
    ],
    [],
  )

  return (
    <Dropdown menu={{ items: contextMenuItems }} trigger={['contextMenu']}>
      <div className="!p-3 !h-full !flex !flex-col">
        <div className="!flex !items-center !justify-between !mb-3 !flex-shrink-0">
          <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
            Aksesuar Listesi
          </div>
          <div className="!flex !items-center !gap-1.5">
            <Button size="small" icon={<ReloadOutlined />} onClick={load} className="!text-[11px] !h-7" />
            <Dropdown menu={{ items: yeniDropdownItems }} trigger={['click']}>
              <Button type="primary" size="small" icon={<PlusOutlined />} className="!text-[11px] !h-7">
                Yeni
              </Button>
            </Dropdown>
          </div>
        </div>

        <div className="!bg-white !rounded-sm !flex-1 !min-h-0" style={{ minHeight: 300 }}>
          <Spin spinning={loading} classNames={{ root: '!h-full [&_.ant-spin-container]:!h-full' }}>
            <DataGrid
              rowData={data}
              columnDefs={columns}
              domLayout="normal"
              exportFileName="aksesuar-listesi"
              rowSelection="single"
              onSelectionChanged={(e) => {
                const sel = e.api.getSelectedRows()
                setSelectedRow(sel[0]?.kod ?? null)
              }}
              onRowDoubleClicked={(e) => e.data && onSelect?.(e.data.kod)}
            />
          </Spin>
        </div>
      </div>
    </Dropdown>
  )
}