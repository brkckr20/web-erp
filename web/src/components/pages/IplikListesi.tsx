'use client'

import { Button, Spin } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect, useMemo } from 'react'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { malzemeApi, type Malzeme } from '@/lib/malzeme-api'

interface IplikRow {
  key: string
  id: number
  kod: string
  ad: string
  kullanimda: boolean
}

interface IplikListesiProps {
  onSelect?: (kod: string) => void
  onNew?: () => void
}

export default function IplikListesi({ onSelect, onNew }: IplikListesiProps) {
  const [data, setData] = useState<IplikRow[]>([])
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const list = await malzemeApi.list(3)
      setData(
        list.map((d: Malzeme) => ({
          key: String(d.id),
          id: d.id,
          kod: d.kod,
          ad: d.ad,
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

  const columns = useMemo<ColDef<IplikRow>[]>(
    () => [
      {
        headerName: 'Kodu',
        field: 'kod',
        width: 110,
        cellStyle: { color: '#e65100', fontWeight: 500 },
      },
      { headerName: 'Adı', field: 'ad', flex: 1, minWidth: 160 },
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
    <div className="!p-3 !h-full !flex !flex-col">
      <div className="!flex !items-center !justify-between !mb-3 !flex-shrink-0">
        <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
          İplik Kartları Listesi
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
        <Spin spinning={loading} classNames={{ root: "!h-full [&_.ant-spin-container]:!h-full" }}>
          <DataGrid
            rowData={data}
            columnDefs={columns}
            domLayout="normal"
            exportFileName="iplik-kartlari"
            storageKey="iplikKarti"
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
  )
}
