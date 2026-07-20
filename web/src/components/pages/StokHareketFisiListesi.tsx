'use client'

import { Input, Select, Button, Tag, Dropdown, App, Modal } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons'
import { useState, useMemo, useEffect } from 'react'
import type { ColDef, CellDoubleClickedEvent, CellContextMenuEvent, SelectionChangedEvent } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { stokHareketFisiApi, type StokHareketFisi } from '@/lib/stok-hareket-fisi-api'

interface FisRow {
  key: string
  id: number
  fisTipi: string
  fisNo: string
  fisTarih: string
  cariHesap: string
  belgeAdi: string
  aciklama: string
  girisDepo: string
  cikisDepo: string
  fisToplam: number
  eIrsaliye: string
  faturaBelgeNo: string
  kayitEden: string
}

const formatTarih = (d: string | null) => {
  if (!d) return '-'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '-'
  return dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const mapFis = (f: StokHareketFisi): FisRow => {
  const fisToplam = (f.kalemler ?? []).reduce((acc, k) => acc + (Number(k.satirTutari) || 0), 0)
  return {
    key: String(f.id),
    id: f.id,
    fisTipi: f.fisTipi,
    fisNo: f.fisNo,
    fisTarih: formatTarih(f.fisTarihi),
    cariHesap: f.cariHesap?.ad ?? '',
    belgeAdi: f.belgeAdi ?? '',
    aciklama: f.aciklama ?? '',
    girisDepo: f.depo?.kod ?? '',
    cikisDepo: '',
    fisToplam,
    eIrsaliye: '-',
    faturaBelgeNo: f.faturaNo ?? '',
    kayitEden: f.kayitYapan ?? '-',
  }
}

const fisTipiMap: Record<string, string> = {
  '10': '10-Üretim Fişi',
  '16': '16-Sayım Fişi',
  '17': '17-Depo Transfer Fişi',
  '18': '18-Özel Fiş (Giriş)',
  '20': '20-Karma Koli Üretim',
  '21': '21-Karma Koli Sarf Bozma',
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

interface StokHareketFisiListesiProps {
  onNew?: (fisTipi: string) => void
  onSelect?: (info: { id: number; fisTipi: string; fisNo: string }) => void
}

export default function StokHareketFisiListesi({ onNew, onSelect }: StokHareketFisiListesiProps) {
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
      content: `${fisTipiMap[r.fisTipi] || r.fisTipi} - ${r.fisNo} fişini silmek istediğinize emin misiniz?`,
      okText: 'Evet, sil',
      okButtonProps: { danger: true },
      cancelText: 'Vazgeç',
      onOk: async () => {
        try {
          await stokHareketFisiApi.remove(r.id)
          message.success('Fiş silindi')
          load()
        } catch (err: any) {
          message.error('Fiş silinirken hata: ' + (err?.message || err))
        }
      },
    })
  }

  const load = () => {
    stokHareketFisiApi
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
      headerName: 'Fiş Tipi', field: 'fisTipi', width: 150, resizable: true,
      valueFormatter: (p) => fisTipiMap[p.value as string] || p.value,
    },
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
      headerName: 'Giriş Depo', field: 'girisDepo', width: 100, resizable: true,
      valueFormatter: (p) => p.value || '-',
    },
    {
      headerName: 'Çıkış Depo', field: 'cikisDepo', width: 100, resizable: true,
      valueFormatter: (p) => p.value || '-',
    },
    {
      headerName: 'Fiş Toplamı', field: 'fisToplam', width: 120, resizable: true,
      type: 'rightAligned',
      valueFormatter: (p) =>
        `${(p.value as number).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`,
    },
    {
      headerName: 'e-İrsaliye', field: 'eIrsaliye', width: 110, resizable: true,
      cellRenderer: (p: { value: string }) => (
        <Tag color={p.value === 'Düzenlendi' ? 'green' : p.value === 'İletildi' ? 'blue' : 'default'} className="!text-[11px]">
          {p.value}
        </Tag>
      ),
    },
    {
      headerName: 'Fatura Belge No', field: 'faturaBelgeNo', width: 120, resizable: true,
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
            Stok Hareket Fişleri
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
                exportFileName="stok-hareket-fisleri"
                storageKey="stokHareketFisi"
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
