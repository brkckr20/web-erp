'use client'

import { Dropdown, Button, Spin } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect, useMemo } from 'react'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { rolApi, type Rol } from '@/lib/rol-api'
import YeniButonu, { useYeniYetkisi } from '@/components/shared/YeniButonu'

interface RolRow {
  key: string
  id: number
  ad: string
  aciklama: string
  kullaniciSayisi: number
  aktif: boolean
}

interface RolListesiProps {
  onSelect?: (id: number) => void
  onNew?: () => void
}

export default function RolListesi({ onSelect, onNew }: RolListesiProps) {
  const yeniIzinli = useYeniYetkisi().izinli
  const [data, setData] = useState<RolRow[]>([])
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const list = await rolApi.list()
      setData(
        list.map((r: Rol) => ({
          key: String(r.id),
          id: r.id,
          ad: r.ad,
          aciklama: r.aciklama ?? '',
          kullaniciSayisi: r._count?.kullanicilar ?? 0,
          aktif: r.aktif,
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
    { key: 'yeni', label: 'Yeni', icon: <PlusOutlined />, disabled: !yeniIzinli, onClick: () => onNew?.() },
    {
      key: 'duzenle',
      label: 'Düzenle',
      disabled: !selectedRow,
      onClick: () => {
        const secili = data.find((d) => d.key === selectedRow)
        if (secili) onSelect?.(secili.id)
      },
    },
  ]

  const columns = useMemo<ColDef<RolRow>[]>(
    () => [
      { headerName: 'Rol Adı', field: 'ad', width: 160, cellStyle: { color: '#f57c00', fontWeight: 500 } },
      { headerName: 'Açıklama', field: 'aciklama', flex: 1, minWidth: 180 },
      {
        headerName: 'Kullanıcı',
        field: 'kullaniciSayisi',
        width: 100,
        cellStyle: { textAlign: 'right' },
      },
      {
        headerName: 'Durum',
        field: 'aktif',
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
            Rol Yönetimi
          </div>
          <div className="!flex !items-center !gap-1.5">
            <Button size="small" icon={<ReloadOutlined />} onClick={load} className="!text-[11px] !h-7" />
            <YeniButonu onClick={onNew} className="!text-[11px] !h-7" />
          </div>
        </div>

        <div className="!bg-white !rounded-sm !flex-1 !min-h-0" style={{ minHeight: 300 }}>
          <Spin spinning={loading} classNames={{ root: '!h-full [&_.ant-spin-container]:!h-full' }}>
            <DataGrid
              rowData={data}
              columnDefs={columns}
              domLayout="normal"
              exportFileName="roller"
              rowSelection="single"
              onSelectionChanged={(e) => {
                const sel = e.api.getSelectedRows()
                setSelectedRow(sel[0]?.key ?? null)
              }}
              onRowDoubleClicked={(e) => e.data && onSelect?.(e.data.id)}
            />
          </Spin>
        </div>
      </div>
    </Dropdown>
  )
}
