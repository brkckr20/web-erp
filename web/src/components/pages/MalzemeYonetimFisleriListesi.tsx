'use client'

import { Input, Select, Button, Tag, Dropdown, App, Modal } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons'
import { useState, useMemo, useEffect } from 'react'
import type { ColDef, CellDoubleClickedEvent, CellContextMenuEvent, SelectionChangedEvent } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { malzemeYonetimFisleriApi, type MalzemeYonetimFisi } from '@/lib/malzeme-yonetim-fisleri-api'

interface FisRow {
  key: string
  id: number
  irsaliyeTipi: string
  irsaliyeNo: string
  irsaliyeTarih: string
  cariHesap: string
  aciklama: string
  depo: string
  kayitEden: string
}

const formatTarih = (d: string | null) => {
  if (!d) return '-'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '-'
  return dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const mapFis = (f: MalzemeYonetimFisi): FisRow => ({
  key: String(f.id),
  id: f.id,
  irsaliyeTipi: f.irsaliyeTipi,
  irsaliyeNo: f.irsaliyeNo,
  irsaliyeTarih: formatTarih(f.irsaliyeTarihi),
  cariHesap: f.cariHesap?.ad ?? '',
  aciklama: f.aciklama ?? '',
  depo: f.depo?.kod ?? '',
  kayitEden: f.kayitYapan ?? '-',
})

const fisTipiMap: Record<string, string> = {
  '10': '10-Üretim Fişi',
  '16': '16-Sayım Fişi',
  '17': '17-Depo Transfer Giriş',
  '18': '18-Özel Fiş (Giriş)',
  '20': '20-Karma Koli Üretim',
  '40': '40-Üretimden İade',
  '99': '99-Sayım Farkı Noksanı',
  '101': '101-Sayım Farkı Fazlası',
  '130': '130-Sarf Fişi',
  '131': '131-Fire Fişi',
  '132': '132-Özel Fiş (Çıkış)',
  '135': '135-Transfer Çıkış',
  '136': '136-Karma Koli Sarf',
  '137': '137-Karma Koli Bozma',
  '140': '140-Üretime Çıkış Fişi',
}

const fisTipiOptions = Object.entries(fisTipiMap).map(([value, label]) => ({ value, label }))

interface MalzemeYonetimFisleriListesiProps {
  onNew?: (irsaliyeTipi: string) => void
  onSelect?: (info: { id: number; irsaliyeTipi: string; irsaliyeNo: string }) => void
}

export default function MalzemeYonetimFisleriListesi({ onNew, onSelect }: MalzemeYonetimFisleriListesiProps) {
  const [data, setData] = useState<FisRow[]>([])
  const [yeniFisTipi, setYeniFisTipi] = useState('10')
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const { modal, message } = App.useApp()

  const handleNew = () => onNew?.(yeniFisTipi)

  const handleSil = () => {
    const r = data.find((d) => d.key === selectedRow)
    if (!r) return
    modal.confirm({
      title: 'Fişi Sil',
      content: `${fisTipiMap[r.irsaliyeTipi] || r.irsaliyeTipi} - ${r.irsaliyeNo} fişini silmek istediğinize emin misiniz?`,
      okText: 'Evet, sil',
      okButtonProps: { danger: true },
      cancelText: 'Vazgeç',
      onOk: async () => {
        try {
          await malzemeYonetimFisleriApi.remove(r.id)
          message.success('Fiş silindi')
          load()
        } catch (err: any) {
          message.error('Fiş silinirken hata: ' + (err?.message || err))
        }
      },
    })
  }

  const load = () => {
    malzemeYonetimFisleriApi
      .list()
      .then((res) => setData(res.map(mapFis)))
      .catch(() => setData([]))
  }

  useEffect(() => {
    load()
  }, [])

  const contextMenuItems: MenuProps['items'] = [
    { key: 'yeni', label: 'Yeni', icon: <PlusOutlined />, onClick: handleNew },
    { key: 'duzenle', label: 'Düzenle', disabled: !selectedRow, onClick: () => { const r = data.find((d) => d.key === selectedRow); if (r) onSelect?.(r) } },
    { type: 'divider' },
    { key: 'sil', label: 'Sil', danger: true, disabled: !selectedRow, onClick: handleSil },
  ]

  const columns = useMemo<ColDef<FisRow>[]>(() => [
    {
      headerName: 'Fiş Tipi', field: 'irsaliyeTipi', width: 150, resizable: true,
      valueFormatter: (p) => fisTipiMap[p.value as string] || p.value,
    },
    {
      headerName: 'Fiş No', field: 'irsaliyeNo', width: 90, resizable: true,
      cellClass: '!text-[#f57c00] !font-medium',
    },
    {
      headerName: 'Fiş Tarihi', field: 'irsaliyeTarih', width: 100, resizable: true,
    },
    {
      headerName: 'Cari Hesap', field: 'cariHesap', flex: 1, minWidth: 120, resizable: true,
      valueFormatter: (p) => p.value || '-',
    },
    {
      headerName: 'Açıklama', field: 'aciklama', width: 150, resizable: true,
    },
    {
      headerName: 'Depo', field: 'depo', width: 100, resizable: true,
      valueFormatter: (p) => p.value || '-',
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
            Malzeme Yönetim Fişleri
          </div>
          <div className="!flex !items-center !gap-1.5">
            <Input
              size="small"
              placeholder="Ara..."
              allowClear
              prefix={<SearchOutlined style={{ fontSize: 12, color: '#9ca3af' }} />}
              className="!w-52 !text-[12px]"
            />
            <Button size="small" className="!text-[12px] !h-7">Filtre</Button>
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
                exportFileName="malzeme-yonetim-fisleri"
                storageKey="malzemeYonetimFisleri"
                rowSelection="single"
                onCellDoubleClicked={(e: CellDoubleClickedEvent<FisRow>) => {
                  const row = e.data as FisRow | undefined
                  if (row?.id != null) onSelect?.(row)
                }}
                onCellContextMenu={(e: CellContextMenuEvent<FisRow>) => {
                  const row = e.data as FisRow | undefined
                  if (row?.key) {
                    e.node?.setSelected(true)
                    setSelectedRow(row.key)
                  }
                }}
                onSelectionChanged={(e: SelectionChangedEvent<FisRow>) => {
                  const sel = e.api.getSelectedRows()
                  setSelectedRow(sel[0]?.key ?? null)
                }}
              />
            </div>

            <div className="!border-t !border-gray-200 !px-3 !py-2 !flex !items-center !justify-between !bg-[#fafafa] !flex-shrink-0">
              <div className="!flex !items-center !gap-2">
                <span className="!text-[11px] !text-[#9ca3af]">Yeni Fiş Türü:</span>
                <Select
                  size="small"
                  value={yeniFisTipi}
                  onChange={setYeniFisTipi}
                  className="!w-44 !text-[12px]"
                  options={fisTipiOptions}
                />
              </div>
              <span className="!text-[11px] !text-[#9ca3af] !tabular-nums">{data.length} kayıt</span>
            </div>
          </div>
        </div>
      </div>
    </Dropdown>
  )
}
