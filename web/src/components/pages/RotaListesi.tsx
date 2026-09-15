'use client'

import { Dropdown, Button } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect, useMemo } from 'react'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { rotaApi, type Rota } from '@/lib/rota-api'

interface RotaRow {
  key: string
  id: number
  kod: string
  ad: string
  ozelKod: string | null
  hizmetKodu: string | null
  kullanimda: boolean
  operasyonSayisi: number
}

interface RotaListesiProps {
  onSelect?: (kod: string) => void
  onNew?: () => void
}

export default function RotaListesi({ onSelect, onNew }: RotaListesiProps) {
  const [data, setData] = useState<RotaRow[]>([])
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const list = await rotaApi.list()
      setData(
        list.map((d: Rota) => ({
          key: String(d.id),
          id: d.id,
          kod: d.kod,
          ad: d.ad,
          ozelKod: d.ozelKod,
          hizmetKodu: d.hizmetKodu,
          kullanimda: d.kullanimda,
          operasyonSayisi: d.operasyonlar.length,
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
  ]

  const columns = useMemo<ColDef<RotaRow>[]>(
    () => [
      {
        headerName: 'Kodu',
        field: 'kod',
        width: 110,
        cellStyle: { color: '#e65100', fontWeight: 500 },
      },
      { headerName: 'Adı', field: 'ad', flex: 1, minWidth: 180 },
      { headerName: 'Özel Kod', field: 'ozelKod', width: 120, valueFormatter: (p) => p.value ?? '-' },
      { headerName: 'Hizmet Kodu', field: 'hizmetKodu', width: 130, valueFormatter: (p) => p.value ?? '-' },
      { headerName: 'Operasyon', field: 'operasyonSayisi', width: 100 },
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
            Rota Tanımları Listesi
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
            exportFileName="rota-tanimlari"
            storageKey="rotaTanimlari"
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
