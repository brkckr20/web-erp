'use client'

import { Button, Dropdown, App } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons'
import { useState, useMemo, useEffect, useCallback } from 'react'
import type { ColDef, CellDoubleClickedEvent, CellContextMenuEvent, SelectionChangedEvent } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { kaliteKontrolApi, type KaliteKontrol } from '@/lib/kalite-kontrol-api'

interface KKRow {
  key: string
  id: number
  fisNo: string
  fisTarih: string
  cariHesap: string
  belgeAdi: string
  aciklama: string
  kayitEden: string
}

const formatTarih = (d: string | null) => {
  if (!d) return '-'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '-'
  return dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const mapRow = (f: KaliteKontrol): KKRow => ({
  key: String(f.id),
  id: f.id,
  fisNo: f.fisNo,
  fisTarih: formatTarih(f.fisTarihi),
  cariHesap: f.cariHesap?.ad ?? '',
  belgeAdi: f.belgeAdi ?? '',
  aciklama: f.aciklama ?? '',
  kayitEden: f.kayitYapan ?? '-',
})

interface KaliteKontrolListesiProps {
  onNew?: () => void
  onSelect?: (id: number) => void
}

export default function KaliteKontrolListesi({ onNew, onSelect }: KaliteKontrolListesiProps) {
  const [data, setData] = useState<KKRow[]>([])
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const { modal, message } = App.useApp()

  const handleNew = () => onNew?.()

  const handleSil = useCallback(() => {
    const r = data.find((d) => d.key === selectedRow)
    if (!r) return
    modal.confirm({
      title: 'Kaydı Sil',
      content: `${r.fisNo} nolu kalite kontrol kaydını silmek istediğinize emin misiniz?`,
      okText: 'Evet, sil',
      okButtonProps: { danger: true },
      cancelText: 'Vazgeç',
      onOk: async () => {
        try {
          await kaliteKontrolApi.remove(r.id)
          message.success('Kayıt silindi')
          load()
        } catch (err: any) {
          message.error('Silinirken hata: ' + (err?.message || err))
        }
      },
    })
  }, [data, selectedRow, modal, message])

  const load = useCallback(() => {
    kaliteKontrolApi
      .list()
      .then((res) => setData(res.map(mapRow)))
      .catch(() => setData([]))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const contextMenuItems: MenuProps['items'] = [
    { key: 'yeni', label: 'Yeni', icon: <PlusOutlined />, onClick: handleNew },
    {
      key: 'duzenle', label: 'Düzenle', disabled: !selectedRow,
      onClick: () => { const r = data.find((d) => d.key === selectedRow); if (r) onSelect?.(r.id) },
    },
    { type: 'divider' },
    { key: 'sil', label: 'Sil', danger: true, disabled: !selectedRow, onClick: handleSil },
  ]

  const columns = useMemo<ColDef<KKRow>[]>(() => [
    {
      headerName: 'Fiş No', field: 'fisNo', width: 90, resizable: true,
      cellClass: '!text-[#f57c00] !font-medium',
    },
    {
      headerName: 'Fiş Tarihi', field: 'fisTarih', width: 100, resizable: true,
    },
    {
      headerName: 'Cari Hesap', field: 'cariHesap', flex: 1, minWidth: 120, resizable: true,
      valueFormatter: (p) => p.value || '-',
    },
    {
      headerName: 'Belge No', field: 'belgeAdi', width: 100, resizable: true,
      valueFormatter: (p) => p.value || '-',
    },
    {
      headerName: 'Açıklama', field: 'aciklama', width: 150, resizable: true,
    },
    {
      headerName: 'Kayıt Eden', field: 'kayitEden', width: 110, resizable: true,
    },
  ], [])

  return (
    <Dropdown menu={{ items: contextMenuItems }} trigger={['contextMenu']}>
      <div className="!p-3 !flex !flex-col !h-full">
        <div className="!flex !items-center !justify-between !mb-3">
          <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
            Kalite Kontrol Girişleri
          </div>
          <div className="!flex !items-center !gap-1.5">
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={load}
              className="!text-[12px] !h-7"
            />
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleNew}
              className="!text-[12px] !h-7"
            >
              Yeni
            </Button>
            <Button
              size="small"
              danger
              disabled={!selectedRow}
              icon={<DeleteOutlined />}
              onClick={handleSil}
              className="!text-[12px] !h-7"
            >
              Sil
            </Button>
          </div>
        </div>

        <div className="!flex-1 !min-h-0" style={{ minHeight: 300 }}>
          <div className="!bg-white !rounded-sm !h-full !flex !flex-col">
            <div className="!flex-1 !min-h-0" style={{ minHeight: 250 }}>
              <DataGrid
                rowData={data}
                columnDefs={columns}
                domLayout="normal"
                exportFileName="kalite-kontrol"
                storageKey="kaliteKontrol"
                rowSelection="single"
                onCellDoubleClicked={(e: CellDoubleClickedEvent<KKRow>) => {
                  const row = e.data as KKRow | undefined
                  if (row?.id != null) onSelect?.(row.id)
                }}
                onCellContextMenu={(e: CellContextMenuEvent<KKRow>) => {
                  const row = e.data as KKRow | undefined
                  if (row?.key) {
                    e.node?.setSelected(true)
                    setSelectedRow(row.key)
                  }
                }}
                onSelectionChanged={(e: SelectionChangedEvent<KKRow>) => {
                  const sel = e.api.getSelectedRows()
                  setSelectedRow(sel[0]?.key ?? null)
                }}
              />
            </div>

            <div className="!border-t !border-gray-200 !px-3 !py-2 !flex !items-center !justify-between !bg-[#fafafa] !flex-shrink-0">
              <span />
              <span className="!text-[11px] !text-[#9ca3af] !tabular-nums">{data.length} kayıt</span>
            </div>
          </div>
        </div>
      </div>
    </Dropdown>
  )
}
