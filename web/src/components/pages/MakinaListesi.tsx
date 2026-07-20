'use client'

import { Dropdown, Button, Spin } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect, useMemo } from 'react'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { makinaApi, type Makina } from '@/lib/makina-api'

interface MakinaRow {
  key: string
  id: number
  kod: string
  ad: string
  makinaTuru: string | null
  marka: string | null
  lokasyon: string | null
  durumu: string | null
  kullanimda: boolean
}

interface MakinaListesiProps {
  onSelect?: (kod: string) => void
  onNew?: () => void
}

export default function MakinaListesi({ onSelect, onNew }: MakinaListesiProps) {
  const [data, setData] = useState<MakinaRow[]>([])
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const list = await makinaApi.list()
      setData(
        list.map((d: Makina) => ({
          key: String(d.id),
          id: d.id,
          kod: d.kod,
          ad: d.ad,
          makinaTuru: d.makinaTuru,
          marka: d.marka,
          lokasyon: d.lokasyon,
          durumu: d.durumu,
          kullanimda: d.kullanimda,
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

  const columns = useMemo<ColDef<MakinaRow>[]>(
    () => [
      {
        headerName: 'Kodu',
        field: 'kod',
        width: 110,
        cellStyle: { color: '#f57c00', fontWeight: 500 },
      },
      { headerName: 'Adı', field: 'ad', flex: 1, minWidth: 160 },
      { headerName: 'Türü', field: 'makinaTuru', width: 130, valueFormatter: (p) => p.value ?? '-' },
      { headerName: 'Marka', field: 'marka', width: 120, valueFormatter: (p) => p.value ?? '-' },
      { headerName: 'Lokasyon', field: 'lokasyon', width: 140, valueFormatter: (p) => p.value ?? '-' },
      { headerName: 'Durumu', field: 'durumu', width: 110, valueFormatter: (p) => p.value ?? '-' },
      {
        headerName: 'Kullanımda',
        field: 'kullanimda',
        width: 100,
        valueFormatter: (p) => (p.value ? 'Aktif' : 'Pasif'),
      },
    ],
    [],
  )

  return (
    <Dropdown menu={{ items: contextMenuItems }} trigger={['contextMenu']}>
      <div className="!p-3 !h-full !flex !flex-col">
        <div className="!flex !items-center !justify-between !mb-3 !flex-shrink-0">
          <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
            Makina Kartları Listesi
          </div>
          <div className="!flex !items-center !gap-1.5">
            <Button size="small" icon={<ReloadOutlined />} onClick={load} className="!text-[11px] !h-7" />
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
          <Spin spinning={loading} wrapperClassName="!h-full [&_.ant-spin-container]:!h-full">
            <DataGrid
              rowData={data}
              columnDefs={columns}
              domLayout="normal"
              exportFileName="makina-kartlari"
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
