'use client'

import { Dropdown, Button, Spin } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect, useMemo } from 'react'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { renkApi, type Renk } from '@/lib/renk-api'

interface RenkRow {
  key: string
  id: number
  kod: string
  ad: string
  renkHex: string
  cariAdi: string
  parentRenkAdi: string
  tarih: string | null
  talepTarihi: string | null
  okeyTarihi: string | null
  ozelKod: string
  pantoneNo: string
  fiyat: number | null
  dovizCinsi: string
  renkTuru: string
  kullanimda: boolean
}

interface BoyahaneRenkListesiProps {
  onSelect?: (kod: string) => void
  onNew?: () => void
}

export default function BoyahaneRenkListesi({ onSelect, onNew }: BoyahaneRenkListesiProps) {
  const [data, setData] = useState<RenkRow[]>([])
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const list = await renkApi.list(2)
      setData(
        list.map((r: Renk) => ({
          key: String(r.id),
          id: r.id,
          kod: r.kod,
          ad: r.ad,
          renkHex: r.renk ?? '#000000',
          cariAdi: r.cariAdi ?? '',
          parentRenkAdi: r.parentRenkAdi ?? '',
          tarih: r.tarih,
          talepTarihi: r.talepTarihi,
          okeyTarihi: r.okeyTarihi,
          ozelKod: r.ozelKod ?? '',
          pantoneNo: r.pantoneNo ?? '',
          fiyat: r.fiyat,
          dovizCinsi: r.dovizCinsi ?? 'TRY',
          renkTuru: r.renkTuru ?? '',
          kullanimda: r.kullanimda,
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

  const columns = useMemo<ColDef<RenkRow>[]>(
    () => [
      {
        headerName: 'Kodu',
        field: 'kod',
        width: 110,
        cellStyle: { color: '#f57c00', fontWeight: 500 },
      },
      { headerName: 'Adı', field: 'ad', flex: 1, minWidth: 120 },
      { headerName: 'Cari', field: 'cariAdi', flex: 1, minWidth: 120 },
      { headerName: 'Parent Renk', field: 'parentRenkAdi', flex: 1, minWidth: 120 },
      {
        headerName: 'Tarih',
        field: 'tarih',
        width: 110,
        valueFormatter: (p) => {
          if (!p.value) return '-'
          const d = new Date(p.value)
          return d.toLocaleDateString('tr-TR')
        },
      },
      {
        headerName: 'Talep Tarihi',
        field: 'talepTarihi',
        width: 110,
        valueFormatter: (p) => {
          if (!p.value) return '-'
          const d = new Date(p.value)
          return d.toLocaleDateString('tr-TR')
        },
      },
      {
        headerName: 'Okey Tarihi',
        field: 'okeyTarihi',
        width: 110,
        valueFormatter: (p) => {
          if (!p.value) return '-'
          const d = new Date(p.value)
          return d.toLocaleDateString('tr-TR')
        },
      },
      { headerName: 'Özel Kod', field: 'ozelKod', width: 100 },
      { headerName: 'Pantone No', field: 'pantoneNo', width: 100 },
      { headerName: 'Renk Türü', field: 'renkTuru', width: 100 },
      {
        headerName: 'Fiyat',
        field: 'fiyat',
        width: 100,
        type: 'rightAligned',
        valueFormatter: (p) => {
          if (p.value == null) return '-'
          return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(p.value)
        },
      },
      { headerName: 'Döviz', field: 'dovizCinsi', width: 70 },
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
            Boyahane Renk Kartları Listesi
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
              exportFileName="boyahane-renk-kartlari"
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