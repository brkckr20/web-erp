'use client'

import { Dropdown, Button, Spin } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect, useMemo } from 'react'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'

interface SiparisRow {
  key: string
  id: number
  siparisNo: string
  tarih: string
  cariKod: string
  cariAd: string
  modelKod: string
  modelAd: string
  aciklama: string
}

interface SiparisGirisiProps {
  onSelect?: (id: number) => void
  onNew?: () => void
}

export default function SiparisGirisi({ onSelect, onNew }: SiparisGirisiProps) {
  const [data, setData] = useState<SiparisRow[]>([])
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setData([])
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
  ]

  const columns = useMemo<ColDef<SiparisRow>[]>(
    () => [
      { headerName: 'Sipariş No', field: 'siparisNo', width: 120, cellStyle: { color: '#f57c00', fontWeight: 500 } },
      { headerName: 'Tarih', field: 'tarih', width: 100 },
      { headerName: 'Cari Kod', field: 'cariKod', width: 100 },
      { headerName: 'Cari Adı', field: 'cariAd', flex: 1, minWidth: 150 },
      { headerName: 'Model Kod', field: 'modelKod', width: 100 },
      { headerName: 'Model Adı', field: 'modelAd', flex: 1, minWidth: 150 },
      { headerName: 'Açıklama', field: 'aciklama', flex: 1, minWidth: 120 },
    ],
    [],
  )

  return (
    <Dropdown menu={{ items: contextMenuItems }} trigger={['contextMenu']}>
      <div className="!p-3 !h-full !flex !flex-col">
        <div className="!flex !items-center !justify-between !mb-3 !flex-shrink-0">
          <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
            Sipariş Listesi
          </div>
          <div className="!flex !items-center !gap-1.5">
            <Button size="small" icon={<ReloadOutlined />} onClick={load} className="!text-[11px] !h-7" />
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={onNew} className="!text-[11px] !h-7">
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
              exportFileName="siparis-listesi"
              rowSelection="single"
              onSelectionChanged={(e) => {
                const sel = e.api.getSelectedRows()
                setSelectedRow(sel[0]?.id ?? null)
              }}
              onRowDoubleClicked={(e) => e.data && onSelect?.(e.data.id)}
            />
          </Spin>
        </div>
      </div>
    </Dropdown>
  )
}
