'use client'

import { Dropdown, Button, Spin, InputNumber, Switch, Input } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect, useMemo } from 'react'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { bedenApi, type Beden } from '@/lib/beden-api'

interface BedenRow {
  key: string
  id: number
  kod: string
  sira: number
  kullanimda: boolean
}

interface BedenListesiProps {
  onSelect?: (kod: string) => void
  onNew?: () => void
}

export default function BedenListesi({ onSelect, onNew }: BedenListesiProps) {
  const [data, setData] = useState<BedenRow[]>([])
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<{ kod: string; sira: number; kullanimda: boolean }>({ kod: '', sira: 0, kullanimda: true })

  const load = async () => {
    setLoading(true)
    try {
      const list = await bedenApi.list()
      setData(
        list.map((b: Beden) => ({
          key: String(b.id),
          id: b.id,
          kod: b.kod,
          sira: b.sira,
          kullanimda: b.kullanimda,
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

  const handleSaveRow = async (id: number) => {
    try {
      await bedenApi.update(id, editForm)
      setEditingId(null)
      load()
    } catch {}
  }

  const contextMenuItems: MenuProps['items'] = [
    { key: 'yeni', label: 'Yeni', icon: <PlusOutlined />, onClick: () => onNew?.() },
    { key: 'duzenle', label: 'Düzenle', disabled: !selectedRow, onClick: () => selectedRow && onSelect?.(selectedRow) },
    { type: 'divider' },
    { key: 'pasif', label: 'Pasif Yap', disabled: !selectedRow },
  ]

  const columns = useMemo<ColDef<BedenRow>[]>(
    () => [
      {
        headerName: 'Kodu',
        field: 'kod',
        width: 110,
        cellStyle: { color: '#f57c00', fontWeight: 500 },
        editable: true,
        onCellDoubleClicked: (params) => {
          setEditingId(params.data.id)
          setEditForm({ kod: params.data.kod, sira: params.data.sira, kullanimda: params.data.kullanimda })
        },
      },
      {
        headerName: 'Sıra',
        field: 'sira',
        width: 80,
        editable: true,
      },
      {
        headerName: 'Durum',
        field: 'kullanimda',
        width: 80,
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
            Beden Tanımları
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
              exportFileName="beden-tanimlari"
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
