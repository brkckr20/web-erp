'use client'

import { Dropdown, Button, Input } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { useState, useEffect, useMemo, useRef } from 'react'
import type { ColDef } from 'ag-grid-community'
import DataGrid, { type DataGridHandle } from '@/components/shared/DataGrid'
import { sirketApi, type Sirket } from '@/lib/sirket-api'

interface SirketRow {
  key: string
  id: number
  ad: string
  vergiNo: string
  telefon: string
  adresSayisi: number
  ibanSayisi: number
}

interface SirketListesiProps {
  onSelect?: (id: number) => void
  onNew?: () => void
}

export default function SirketListesi({ onSelect, onNew }: SirketListesiProps) {
  const [data, setData] = useState<SirketRow[]>([])
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const gridRef = useRef<DataGridHandle>(null)

  const load = async () => {
    setLoading(true)
    try {
      const list = await sirketApi.list()
      setData(
        list.map((d: Sirket) => ({
          key: String(d.id),
          id: d.id,
          ad: d.ad,
          vergiNo: d.vergiNo ?? '-',
          telefon: d.telefon ?? '-',
          adresSayisi: d.adresler?.length ?? 0,
          ibanSayisi: d.ibanlar?.length ?? 0,
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

  const handleSearchChange = (value: string) => {
    setSearch(value)
    gridRef.current?.api?.setGridOption('quickFilterText', value)
  }

  const contextMenuItems: MenuProps['items'] = [
    { key: 'yeni', label: 'Yeni', icon: <PlusOutlined />, onClick: () => onNew?.() },
    { key: 'duzenle', label: 'Düzenle', disabled: !selectedRow, onClick: () => selectedRow && onSelect?.(selectedRow) },
  ]

  const columns = useMemo<ColDef<SirketRow>[]>(
    () => [
      { headerName: 'Şirket Adı', field: 'ad', flex: 1, minWidth: 200, cellStyle: { color: '#e65100', fontWeight: 500 } },
      { headerName: 'Vergi No', field: 'vergiNo', width: 130, valueFormatter: (p) => p.value ?? '-' },
      { headerName: 'Telefon', field: 'telefon', width: 150, valueFormatter: (p) => p.value ?? '-' },
      { headerName: 'Adres', field: 'adresSayisi', width: 80 },
      { headerName: 'IBAN', field: 'ibanSayisi', width: 80 },
    ],
    [],
  )

  return (
    <Dropdown menu={{ items: contextMenuItems }} trigger={['contextMenu']}>
      <div className="!p-3 !h-full !flex !flex-col">
        <div className="!flex !items-center !justify-between !mb-3 !flex-shrink-0">
          <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
            Şirket Tanımları
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
            exportFileName="sirket-tanimlari"
            storageKey="sirketListesi"
            rowSelection="single"
            onSelectionChanged={(e) => {
              const sel = e.api.getSelectedRows()
              setSelectedRow(sel[0]?.id ?? null)
            }}
            onRowDoubleClicked={(e) => e.data && onSelect?.(e.data.id)}
          />
        </div>
      </div>
    </Dropdown>
  )
}
