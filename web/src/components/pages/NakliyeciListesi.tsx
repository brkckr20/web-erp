'use client'

import { Dropdown, Button, App } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect, useMemo } from 'react'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { nakliyeciApi, type Nakliyeci } from '@/lib/nakliyeci-api'

interface NakliyeciRow {
  key: string
  id: number
  unvan: string
  ad: string | null
  soyad: string | null
  tc: string | null
  plakalar: string
  aktif: boolean
}

interface NakliyeciListesiProps {
  onSelect?: (id: number) => void
  onNew?: () => void
}

export default function NakliyeciListesi({ onSelect, onNew }: NakliyeciListesiProps) {
  const { message, modal } = App.useApp()
  const [data, setData] = useState<NakliyeciRow[]>([])
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const list = await nakliyeciApi.list()
      setData(
        list.map((d: Nakliyeci) => ({
          key: String(d.id),
          id: d.id,
          unvan: d.unvan,
          ad: d.ad,
          soyad: d.soyad,
          tc: d.tc,
          plakalar: (d.plakalar ?? []).map((p) => p.plaka).join(', '),
          aktif: d.aktif,
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

  const seciliId = selectedRow ? Number(selectedRow) : null

  const handleSil = () => {
    if (!seciliId) return
    modal.confirm({
      title: 'Nakliyeci Sil',
      content: 'Seçili nakliyeciyi silmek istediğinize emin misiniz?',
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await nakliyeciApi.delete(seciliId)
          message.success('Nakliyeci silindi')
          setSelectedRow(null)
          load()
        } catch {
          message.error('Silme sırasında hata oluştu')
        }
      },
    })
  }

  const contextMenuItems: MenuProps['items'] = [
    { key: 'yeni', label: 'Yeni', icon: <PlusOutlined />, onClick: () => onNew?.() },
    { key: 'duzenle', label: 'Düzenle', disabled: !selectedRow, onClick: () => seciliId && onSelect?.(seciliId) },
    { type: 'divider' },
    { key: 'sil', label: 'Sil', danger: true, disabled: !selectedRow, onClick: handleSil },
  ]

  const columns = useMemo<ColDef<NakliyeciRow>[]>(
    () => [
      {
        headerName: 'Ünvan',
        field: 'unvan',
        minWidth: 220,
        flex: 1,
        cellStyle: { color: '#e65100', fontWeight: 500 },
      },
      { headerName: 'Ad', field: 'ad', width: 140, valueFormatter: (p) => p.value ?? '-' },
      { headerName: 'Soyad', field: 'soyad', width: 140, valueFormatter: (p) => p.value ?? '-' },
      { headerName: 'TC', field: 'tc', width: 120, valueFormatter: (p) => p.value ?? '-' },
      { headerName: 'Plakalar', field: 'plakalar', width: 180, valueFormatter: (p) => p.value || '-' },
      {
        headerName: 'Durum',
        field: 'aktif',
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
            Nakliyeci Tanımları Listesi
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
            exportFileName="nakliyeci-tanimlari"
            storageKey="nakliyeciTanimlari"
            rowSelection="single"
            onSelectionChanged={(e) => {
              const sel = e.api.getSelectedRows()
              setSelectedRow(sel[0]?.key ?? null)
            }}
            onRowDoubleClicked={(e) => e.data && onSelect?.(e.data.id)}
          />
        </div>
      </div>
    </Dropdown>
  )
}
