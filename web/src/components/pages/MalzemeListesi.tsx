'use client'

import { Dropdown, Button } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined, FileTextOutlined } from '@ant-design/icons'
import { useState, useEffect, useMemo } from 'react'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { malzemeApi, type Malzeme } from '@/lib/malzeme-api'

interface MalzemeRow {
  key: string
  id: number
  kod: string
  ad: string
  malzemeTuru: string | null
  tipi: string | null
  kategori: string | null
  kullanimda: boolean
}

interface MalzemeListesiProps {
  onSelect?: (kod: string) => void
  onNew?: () => void
  onStokEkstresi?: (kod: string) => void
}

export default function MalzemeListesi({ onSelect, onNew, onStokEkstresi }: MalzemeListesiProps) {
  const [data, setData] = useState<MalzemeRow[]>([])
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const list = await malzemeApi.list()
      setData(
        list.map((d: Malzeme) => ({
          key: String(d.id),
          id: d.id,
          kod: d.kod,
          ad: d.ad,
          malzemeTuru: d.malzemeTuru,
          tipi: d.tipi,
          kategori: d.kategori,
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
    { key: 'stok-ekstresi', label: 'Ekstre', icon: <FileTextOutlined />, disabled: !selectedRow, onClick: () => selectedRow && onStokEkstresi?.(selectedRow) },
  ]

  const columns = useMemo<ColDef<MalzemeRow>[]>(
    () => [
      {
        headerName: 'Kodu',
        field: 'kod',
        width: 110,
        cellStyle: { color: '#e65100', fontWeight: 500 },
      },
      { headerName: 'Adı', field: 'ad', flex: 1, minWidth: 160 },
      { headerName: 'Türü', field: 'malzemeTuru', width: 120, valueFormatter: (p) => p.value ?? '-' },
      { headerName: 'Tipi', field: 'tipi', width: 120, valueFormatter: (p) => p.value ?? '-' },
      { headerName: 'Kategori', field: 'kategori', width: 120, valueFormatter: (p) => p.value ?? '-' },
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
            Malzeme Kartları Listesi
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
            <DataGrid
              loading={loading}
              rowData={data}
              columnDefs={columns}
              domLayout="normal"
              exportFileName="malzeme-kartlari"
              storageKey="malzemeKarti"
              rowSelection="single"
              onSelectionChanged={(e) => {
                const sel = e.api.getSelectedRows()
                setSelectedRow(sel[0]?.kod ?? null)
              }}
              onRowDoubleClicked={(e) => e.data && onSelect?.(e.data.kod)}
            />
        </div>
      </div>
    </Dropdown>
  )
}
