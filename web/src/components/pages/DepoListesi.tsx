'use client'

import { Dropdown, Button, Spin } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect, useMemo } from 'react'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { depoApi, type Depo } from '@/lib/depo-api'

interface DepoRow {
  key: string
  id: number
  kod: string
  ad: string
  sehir: string | null
  durum: boolean
}

interface DepoListesiProps {
  onSelect?: (kod: string) => void
  onNew?: () => void
}

export default function DepoListesi({ onSelect, onNew }: DepoListesiProps) {
  const [data, setData] = useState<DepoRow[]>([])
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const list = await depoApi.list()
      setData(
        list.map((d: Depo) => ({
          key: String(d.id),
          id: d.id,
          kod: d.kod,
          ad: d.ad,
          sehir: d.sehir,
          durum: d.durum,
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
    { key: 'yeni', label: 'Yeni', icon: <PlusOutlined />, onClick: () => onNew?.() },
    { key: 'duzenle', label: 'Düzenle', disabled: !selectedRow, onClick: () => selectedRow && onSelect?.(selectedRow) },
    { type: 'divider' },
    { key: 'pasif', label: 'Pasif Yap', disabled: !selectedRow },
  ]

  const columns = useMemo<ColDef<DepoRow>[]>(
    () => [
      {
        headerName: 'Kodu',
        field: 'kod',
        width: 110,
        cellStyle: { color: '#f57c00', fontWeight: 500 },
      },
      { headerName: 'Adı', field: 'ad', flex: 1, minWidth: 160 },
      { headerName: 'Şehir', field: 'sehir', width: 130, valueFormatter: (p) => p.value ?? '-' },
      {
        headerName: 'Durum',
        field: 'durum',
        width: 100,
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
            Depo Tanımları Listesi
          </div>
          <div className="!flex !items-center !gap-1.5">
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={load}
              className="!text-[11px] !h-7"
            />
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={onNew}
              className="!text-[11px] !h-7"
            >
              Yeni
            </Button>
          </div>
        </div>

        <div className="!bg-white !rounded-sm !flex-1 !min-h-0" style={{ minHeight: 300 }}>
          <Spin spinning={loading} classNames={{ root: "!h-full [&_.ant-spin-container]:!h-full" }}>
            <DataGrid
              rowData={data}
              columnDefs={columns}
              domLayout="normal"
              exportFileName="depo-tanimlari"
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
