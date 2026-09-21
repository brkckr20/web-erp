'use client'

import { Dropdown, Button, Input } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { useState, useEffect, useMemo, useRef } from 'react'
import type { ColDef } from 'ag-grid-community'
import DataGrid, { type DataGridHandle } from '@/components/shared/DataGrid'
import { cariHesapApi, type CariHesap } from '@/lib/cari-hesap-api'

interface CariRow {
  key: string
  id: number
  kod: string
  ad: string
  ozelKod: string | null
  cariTipi: string
  kullanimda: boolean
}

interface CariHesapListesiProps {
  onSelect?: (kod: string) => void
  onNew?: () => void
}

export default function CariHesapListesi({ onSelect, onNew }: CariHesapListesiProps) {
  const [data, setData] = useState<CariRow[]>([])
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const gridRef = useRef<DataGridHandle>(null)

  const load = async () => {
    setLoading(true)
    try {
      const PAGE = 50
      let page = 1
      const all: CariRow[] = []
      for (;;) {
        const chunk = await cariHesapApi.list(undefined, page, PAGE)
        chunk.forEach((d: CariHesap) =>
          all.push({
            key: String(d.id),
            id: d.id,
            kod: d.kod,
            ad: d.ad,
            ozelKod: d.ozelKod ?? null,
            cariTipi: d.cariHesapTipi ?? '-',
            kullanimda: d.kullanimda,
          }),
        )
        if (chunk.length < PAGE) break
        page++
      }
      setData(all)
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    gridRef.current?.api?.setGridOption('quickFilterText', value)
  }

  const contextMenuItems: MenuProps['items'] = [
    { key: 'yeni', label: 'Yeni', icon: <PlusOutlined />, onClick: () => onNew?.() },
    { key: 'duzenle', label: 'Düzenle', disabled: !selectedRow, onClick: () => selectedRow && onSelect?.(selectedRow) },
    { type: 'divider' },
    { key: 'pasif', label: 'Pasif Yap', disabled: !selectedRow },
  ]

  const columns = useMemo<ColDef<CariRow>[]>(
    () => [
      {
        headerName: 'Kodu',
        field: 'kod',
        width: 120,
        cellStyle: { color: '#e65100', fontWeight: 500 },
      },
      { headerName: 'Adı', field: 'ad', flex: 1, minWidth: 160 },
      { headerName: 'Özel Kod', field: 'ozelKod', width: 100, valueFormatter: (p) => p.value ?? '-' },
      { headerName: 'Cari Tipi', field: 'cariTipi', width: 120, valueFormatter: (p) => p.value ?? '-' },
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
            Cari Hesap Kartları Listesi
          </div>
          <div className="!flex !items-center !gap-1.5">
            <Input
              size="small"
              placeholder="Ara..."
              allowClear
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              prefix={<SearchOutlined style={{ fontSize: 12, color: '#9ca3af' }} />}
              className="!w-52 !text-[12px]"
            />
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
            ref={gridRef}
            loading={loading}
            rowData={data}
            columnDefs={columns}
            domLayout="normal"
            exportFileName="cari-hesap-kartlari"
            storageKey="cariHesapListesi"
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