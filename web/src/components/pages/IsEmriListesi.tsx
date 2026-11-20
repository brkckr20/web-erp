'use client'

import { Tag, Dropdown, Button } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useMemo, useEffect, useCallback } from 'react'
import type { ColDef, CellDoubleClickedEvent, CellContextMenuEvent, SelectionChangedEvent } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { isEmriApi, type IsEmri } from '@/lib/is-emri-api'
import YeniButonu, { useYeniYetkisi } from '@/components/shared/YeniButonu'

interface IsEmriRow {
  key: string
  id: number
  isEmriNo: string
  siparisNo: string | null
  musteriSiparisNo: string | null
  aciklama: string | null
  kalemSayisi: number
  durum: string | null
}

interface IsEmriListesiProps {
  onSelect?: (kod: string) => void
  onNew?: () => void
}

const mapIsEmri = (d: IsEmri): IsEmriRow => ({
  key: String(d.id),
  id: d.id,
  isEmriNo: d.isEmriNo,
  siparisNo: d.siparisNo,
  musteriSiparisNo: d.musteriSiparisNo,
  aciklama: d.aciklama,
  kalemSayisi: (d.kalemler ?? []).length,
  durum: d.durum,
})

export default function IsEmriListesi({ onSelect, onNew }: IsEmriListesiProps) {
  const yeniIzinli = useYeniYetkisi().izinli
  const [data, setData] = useState<IsEmriRow[]>([])
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    isEmriApi
      .list()
      .then((list) => setData(list.map(mapIsEmri)))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const contextMenuItems: MenuProps['items'] = [
    { key: 'yeni', label: 'Yeni', icon: <PlusOutlined />, disabled: !yeniIzinli, onClick: () => onNew?.() },
    {
      key: 'duzenle',
      label: 'Düzenle',
      disabled: !selectedRow,
      onClick: () => {
        const row = data.find((d) => d.key === selectedRow)
        if (row) onSelect?.(row.isEmriNo)
      },
    },
    { type: 'divider' },
    { key: 'pasif', label: 'Pasif Yap', disabled: !selectedRow },
  ]

  const columns = useMemo<ColDef<IsEmriRow>[]>(
    () => [
      {
        headerName: 'İş Emri No',
        field: 'isEmriNo',
        width: 120,
        resizable: true,
        cellClass: '!text-[#f57c00] !font-medium',
      },
      {
        headerName: 'Sipariş No',
        field: 'siparisNo',
        width: 110,
        resizable: true,
        valueFormatter: (p) => p.value || '-',
      },
      {
        headerName: 'Müşteri Sip. No',
        field: 'musteriSiparisNo',
        width: 130,
        resizable: true,
        valueFormatter: (p) => p.value || '-',
      },
      {
        headerName: 'Açıklama',
        field: 'aciklama',
        flex: 1,
        minWidth: 160,
        resizable: true,
        valueFormatter: (p) => p.value || '-',
      },
      {
        headerName: 'Kalem',
        field: 'kalemSayisi',
        width: 80,
        resizable: true,
        type: 'rightAligned',
      },
      {
        headerName: 'Durum',
        field: 'durum',
        width: 100,
        resizable: true,
        cellRenderer: (p: { value: string | null }) => (
          <Tag color={p.value ? 'blue' : 'default'} className="!text-[10px]">
            {p.value ?? '-'}
          </Tag>
        ),
      },
    ],
    [],
  )

  return (
    <Dropdown menu={{ items: contextMenuItems }} trigger={['contextMenu']}>
      <div className="!p-3 !flex !flex-col !h-full">
        <div className="!flex !items-center !justify-between !mb-3">
          <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
            İş Emri Tanımları Listesi
          </div>
          <div className="!flex !items-center !gap-1.5">
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={load}
              className="!text-[12px] !h-7"
            />
            <YeniButonu onClick={onNew} className="!text-[12px] !h-7" />
          </div>
        </div>

        <div className="!flex-1 !min-h-0" style={{ minHeight: 300 }}>
          <div className="!bg-white !rounded-sm !h-full !flex !flex-col">
            <div className="!flex-1 !min-h-0" style={{ minHeight: 250 }}>
              <DataGrid
                loading={loading}
                rowData={data}
                columnDefs={columns}
                domLayout="normal"
                exportFileName="is-emri-tanimlari"
                storageKey="isEmriTanimlari"
                rowSelection="single"
                onCellDoubleClicked={(e: CellDoubleClickedEvent<IsEmriRow>) => {
                  const row = e.data as IsEmriRow | undefined
                  if (row?.isEmriNo) onSelect?.(row.isEmriNo)
                }}
                onCellContextMenu={(e: CellContextMenuEvent<IsEmriRow>) => {
                  const row = e.data as IsEmriRow | undefined
                  if (row?.key) {
                    e.node?.setSelected(true)
                    setSelectedRow(row.key)
                  }
                }}
                onSelectionChanged={(e: SelectionChangedEvent<IsEmriRow>) => {
                  const sel = e.api.getSelectedRows()
                  setSelectedRow(sel[0]?.key ?? null)
                }}
              />
            </div>

            <div className="!border-t !border-gray-200 !px-3 !py-2 !flex !items-center !justify-between !bg-[#fafafa] !flex-shrink-0">
              <span className="!text-[11px] !text-[#9ca3af]">Çift tık veya sağ tık → Düzenle</span>
              <span className="!text-[11px] !text-[#9ca3af] !tabular-nums">{data.length} kayıt</span>
            </div>
          </div>
        </div>
      </div>
    </Dropdown>
  )
}
