'use client'

import { Dropdown, Button, Spin } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect, useMemo } from 'react'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { malzemeApi, type Malzeme } from '@/lib/malzeme-api'

interface KumasRow {
  key: string
  id: number
  kod: string
  ad: string
  kullanimda: boolean
  kumasTuruAd: string | null
  cinsi: string | null
  grm2: number | null
  ebat: string | null
  en: number | null
  boy: number | null
  iplikBoyali: boolean | null
  ormeTipi: string | null
  kumasUretimTipi: string | null
}

interface KumasListesiProps {
  onSelect?: (kod: string) => void
  onNew?: () => void
}

export default function KumasListesi({ onSelect, onNew }: KumasListesiProps) {
  const [data, setData] = useState<KumasRow[]>([])
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const list = await malzemeApi.list(2)
      setData(
        list.map((d: Malzeme) => ({
          key: String(d.id),
          id: d.id,
          kod: d.kod,
          ad: d.ad,
          kullanimda: d.kullanimda,
          kumasTuruAd: d.kumasTuru?.ad ?? null,
          cinsi: d.cinsi,
          grm2: d.grm2,
          ebat: d.ebat,
          en: d.en,
          boy: d.boy,
          iplikBoyali: d.iplikBoyali,
          ormeTipi: d.ormeTipi,
          kumasUretimTipi: d.kumasUretimTipi,
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

  const columns = useMemo<ColDef<KumasRow>[]>(
    () => [
      {
        headerName: 'Kodu',
        field: 'kod',
        width: 110,
        cellStyle: { color: '#e65100', fontWeight: 500 },
      },
      { headerName: 'Adı', field: 'ad', flex: 1, minWidth: 160 },
      { headerName: 'Türü', field: 'kumasTuruAd', width: 120, valueFormatter: (p) => p.value ?? '-' },
      { headerName: 'Cinsi', field: 'cinsi', width: 120, valueFormatter: (p) => p.value ?? '-' },
      { headerName: 'Gr/m²', field: 'grm2', width: 90, valueFormatter: (p) => p.value != null ? String(p.value) : '-' },
      { headerName: 'Ebat', field: 'ebat', width: 100, valueFormatter: (p) => p.value ?? '-' },
      { headerName: 'En', field: 'en', width: 80, valueFormatter: (p) => p.value != null ? String(p.value) : '-' },
      { headerName: 'Boy', field: 'boy', width: 80, valueFormatter: (p) => p.value != null ? String(p.value) : '-' },
      {
        headerName: 'İplik Boyalı',
        field: 'iplikBoyali',
        width: 100,
        valueFormatter: (p) => (p.value ? 'Evet' : 'Hayır'),
        cellStyle: (p) => (p.value ? { color: '#16a34a' } : { color: '#9ca3af' }),
      },
      { headerName: 'Örme Tipi', field: 'ormeTipi', width: 100, valueFormatter: (p) => p.value ?? '-' },
      { headerName: 'Kumaş Üretim Tipi', field: 'kumasUretimTipi', width: 130, valueFormatter: (p) => p.value ?? '-' },
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
            Kumaş Kartları Listesi
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
              exportFileName="kumas-kartlari"
              storageKey="kumasKarti"
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
