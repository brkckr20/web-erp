'use client'

import { Dropdown, Button, Spin } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect, useMemo } from 'react'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { masrafYeriApi, type MasrafYeri } from '@/lib/masraf-yeri-api'
import YeniButonu, { useYeniYetkisi } from '@/components/shared/YeniButonu'

interface MasrafYeriRow {
  key: string
  id: number
  kod: string
  ad: string
  ozelKod: string | null
  erisimKodu: string | null
  dovizCinsi: string | null
  aciklama: string | null
}

interface MasrafYeriListesiProps {
  onSelect?: (id: number) => void
  onNew?: () => void
}

export default function MasrafYeriListesi({ onSelect, onNew }: MasrafYeriListesiProps) {
  const yeniIzinli = useYeniYetkisi().izinli
  const [data, setData] = useState<MasrafYeriRow[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const list = await masrafYeriApi.list()
      setData(
        list.map((m: MasrafYeri) => ({
          key: String(m.id),
          id: m.id,
          kod: m.kod,
          ad: m.ad,
          ozelKod: m.ozelKod,
          erisimKodu: m.erisimKodu,
          dovizCinsi: m.dovizCinsi,
          aciklama: m.aciklama,
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
    { key: 'duzenle', label: 'Düzenle', disabled: !selectedId, onClick: () => selectedId && onSelect?.(selectedId) },
  ]

  const columns = useMemo<ColDef<MasrafYeriRow>[]>(() => {
    const cols: ColDef<MasrafYeriRow>[] = [
      {
        headerName: 'Kodu',
        field: 'kod',
        width: 110,
        cellStyle: { color: '#f57c00', fontWeight: 500 },
      },
      { headerName: 'Adı', field: 'ad', flex: 1, minWidth: 160 },
      { headerName: 'Özel Kod', field: 'ozelKod', width: 120 },
      { headerName: 'Erişim Kodu', field: 'erisimKodu', width: 130 },
      { headerName: 'Döviz Cinsi', field: 'dovizCinsi', width: 110 },
      { headerName: 'Açıklama', field: 'aciklama', flex: 1, minWidth: 180 },
    ]
    return cols
  }, [])

  return (
    <Dropdown menu={{ items: contextMenuItems }} trigger={['contextMenu']}>
      <div className="!p-3 !h-full !flex !flex-col">
        <div className="!flex !items-center !justify-between !mb-3 !flex-shrink-0">
          <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
            Masraf Yerleri Listesi
          </div>
          <div className="!flex !items-center !gap-1.5">
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={load}
              className="!text-[11px] !h-7"
            />
            <YeniButonu onClick={onNew} className="!text-[11px] !h-7" />
          </div>
        </div>

        <div className="!bg-white !rounded-sm !flex-1 !min-h-0" style={{ minHeight: 300 }}>
          <Spin spinning={loading} classNames={{ root: '!h-full [&_.ant-spin-container]:!h-full' }}>
            <DataGrid
              rowData={data}
              columnDefs={columns}
              domLayout="normal"
              exportFileName="masraf-yerleri"
              rowSelection="single"
              onSelectionChanged={(e) => {
                const sel = e.api.getSelectedRows()
                setSelectedId(sel[0]?.id ?? null)
              }}
              onRowDoubleClicked={(e) => e.data && onSelect?.(e.data.id)}
            />
          </Spin>
        </div>
      </div>
    </Dropdown>
  )
}