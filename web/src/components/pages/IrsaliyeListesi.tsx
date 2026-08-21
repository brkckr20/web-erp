'use client'

import { Input, Select, Button, Tag, Dropdown, App } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons'
import { useState, useMemo, useEffect } from 'react'
import type { ColDef, CellDoubleClickedEvent, CellContextMenuEvent, SelectionChangedEvent } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { irsaliyeApi, type Irsaliye } from '@/lib/irsaliye-api'
import { fasonTipiApi, type FasonTipi } from '@/lib/fason-tipi-api'

interface IrsaliyeRow {
  key: string
  id: number
  irsaliyeTipi: string
  irsaliyeNo: string
  irsaliyeTarih: string
  cariHesap: string
  depo: string
  sevkNo: string
  aciklama: string
  irsaliyeToplam: number
  eIrsaliye: string
  kayitEden: string
}

const formatTarih = (d: string | null) => {
  if (!d) return '-'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '-'
  return dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const mapIrsaliye = (i: Irsaliye): IrsaliyeRow => {
  const irsaliyeToplam = (i.kalemler ?? []).reduce((acc, k) => acc + (Number(k.satirTutari) || 0), 0)
  return {
    key: String(i.id),
    id: i.id,
    irsaliyeTipi: i.irsaliyeTipi,
    irsaliyeNo: i.irsaliyeNo,
    irsaliyeTarih: formatTarih(i.irsaliyeTarihi),
    cariHesap: i.cariHesap?.ad ?? '',
    depo: i.depo?.kod ?? '',
    sevkNo: i.sevkNo ?? '',
    aciklama: i.aciklama ?? '',
    irsaliyeToplam,
    eIrsaliye: i.tamamlandi ? (i.irsaliyeTipi === '201' ? 'Teslim Alındı' : 'Tamamlandı') : i.onaylandi ? (i.irsaliyeTipi === '201' ? 'Kesinleşti' : 'Onaylandı') : 'Taslak',
    kayitEden: i.kayitYapan ?? '-',
  }
}

const satisIrsaliyeTipiMap: Record<string, string> = {
  '2': '2-Perakende Satış İade İrsaliyesi',
  '3': '3-Toptan Satış İade İrsaliyesi',
  '4': '4-Konsinye Çıkış İade İrsaliyesi',
  '8': '8-Konsinye Satır İrsaliyesi',
  '12': '12-Fason Çıkış İade İrsaliyesi',
  '23': '23-Verilen Hizmet İadesi',
  '120': '120-Toptan Satış İrsaliyesi',
  '121': '121-Perakende Satır İrsaliyesi',
  '123': '123-Konsinye Çıkış İrsaliyesi',
  '125': '125-Fason Giriş İrsaliyesi',
  '126': '126-Verilen Fiyat Farkı İrsaliyesi',
  '134': '134-Fasona Çıkış İrsaliyesi',
  '138': '138-Verilen Hizmet İrsaliyesi',
  '192': '192-Serbest Meslek Makbuzu',
}

const satinalmaIrsaliyeTipiMap: Record<string, string> = {
  '1': '1-Mal Alım İrsaliyesi',
  '5': '5-Konsinye Giriş İrsaliyesi',
  '6': '6-Fasona Giriş İrsaliyesi',
  '7': '7-Alınan Fiyat Farkı İrsaliyesi',
  '9': '9-Müstahsil İrsaliyesi',
  '11': '11-Fasondan Giriş İrsaliyesi',
  '22': '22-Alınan Hizmet İrsaliyesi',
  '92': '92-Serbest Meslek Makbuzu',
  '122': '122-Mal Alım İade İrsaliyesi',
  '124': '124-Konsinye Giriş İade İrsaliyesi',
  '133': '133-Fasona Giriş İade İrsaliyesi',
  '139': '139-Alınan Hizmet İadesi',
}

const satinalmaSiparisTipiMap: Record<string, string> = {
  '201': '201-Satın Alma Siparişi',
}

const irsaliyeTipiMap: Record<string, string> = { ...satisIrsaliyeTipiMap, ...satinalmaIrsaliyeTipiMap, ...satinalmaSiparisTipiMap }
const satisTipleri = Object.keys(satisIrsaliyeTipiMap)
const satinalmaTipleri = Object.keys(satinalmaIrsaliyeTipiMap)
const satinalmaSiparisTipleri = Object.keys(satinalmaSiparisTipiMap)

interface IrsaliyeListesiProps {
  mod?: 'satis' | 'satinalma' | 'satinalma-siparis'
  onNew?: (irsaliyeTipi: string, fasonTipiId?: number | null) => void
  onSelect?: (info: { id: number; irsaliyeTipi: string; irsaliyeNo: string }) => void
}

const fasonFisTipleri = {
  satis: ['12', '125', '134'],
  satinalma: ['6', '11', '133'],
  'satinalma-siparis': [] as string[],
}

export default function IrsaliyeListesi({ mod = 'satis', onNew, onSelect }: IrsaliyeListesiProps) {
  const gorselTipler = mod === 'satinalma' ? satinalmaTipleri : mod === 'satinalma-siparis' ? satinalmaSiparisTipleri : satisTipleri
  const irsaliyeTipiOptions = gorselTipler.map((value) => ({ value, label: irsaliyeTipiMap[value] }))
  const baslik = mod === 'satinalma' ? 'Satın Alma İrsaliyeleri' : mod === 'satinalma-siparis' ? 'Satın Alma Siparişleri' : 'Satış İrsaliyeleri'
  const [data, setData] = useState<IrsaliyeRow[]>([])
  const [yeniIrsaliyeTipi, setYeniIrsaliyeTipi] = useState(mod === 'satinalma' ? '1' : mod === 'satinalma-siparis' ? '201' : '120')
  const [yeniFasonTipiId, setYeniFasonTipiId] = useState<number | null>(null)
  const [fasonTipleri, setFasonTipleri] = useState<FasonTipi[]>([])
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const { modal, message } = App.useApp()

  const handleNew = () => onNew?.(yeniIrsaliyeTipi, fasonFisTipleri[mod].includes(yeniIrsaliyeTipi) ? yeniFasonTipiId : null)

  useEffect(() => {
    fasonTipiApi
      .list()
      .then((list) => setFasonTipleri(list.filter((f) => f.kullanimda)))
      .catch(() => setFasonTipleri([]))
  }, [])

  useEffect(() => {
    setYeniFasonTipiId(null)
  }, [yeniIrsaliyeTipi])

  const handleSil = () => {
    const r = data.find((d) => d.key === selectedRow)
    if (!r) return
    modal.confirm({
      title: 'İrsaliyeyi Sil',
      content: `${irsaliyeTipiMap[r.irsaliyeTipi] || r.irsaliyeTipi} - ${r.irsaliyeNo} irsaliyesini silmek istediğinize emin misiniz?`,
      okText: 'Evet, sil',
      okButtonProps: { danger: true },
      cancelText: 'Vazgeç',
      onOk: async () => {
        try {
          await irsaliyeApi.remove(r.id)
          message.success('İrsaliye silindi')
          load()
         } catch (err: unknown) {
           message.error('İrsaliye silinirken hata: ' + ((err as Error)?.message ?? String(err)))
        }
      },
    })
  }

  const load = () => {
    const tipler = new Set(mod === 'satinalma' ? satinalmaTipleri : mod === 'satinalma-siparis' ? satinalmaSiparisTipleri : satisTipleri)
    irsaliyeApi
      .list()
      .then((res) => setData(res.filter((i) => tipler.has(String(i.irsaliyeTipi))).map(mapIrsaliye)))
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

  const columns = useMemo<ColDef<IrsaliyeRow>[]>(() => [
    {
      headerName: 'İrsaliye Tipi', field: 'irsaliyeTipi', width: 150, resizable: true,
      valueFormatter: (p) => irsaliyeTipiMap[p.value as string] || p.value,
    },
    {
      headerName: 'İrsaliye No', field: 'irsaliyeNo', width: 90, resizable: true,
      cellClass: '!text-[#f57c00] !font-medium',
    },
    {
      headerName: 'İrsaliye Tarihi', field: 'irsaliyeTarih', width: 100, resizable: true,
    },
    {
      headerName: 'Cari Hesap', field: 'cariHesap', flex: 1, minWidth: 120, resizable: true,
      valueFormatter: (p) => p.value || '-',
    },
    {
      headerName: 'Depo', field: 'depo', width: 100, resizable: true,
      valueFormatter: (p) => p.value || '-',
    },
    {
      headerName: 'Sevk No', field: 'sevkNo', width: 100, resizable: true,
      valueFormatter: (p) => p.value || '-',
    },
    {
      headerName: 'Açıklama', field: 'aciklama', width: 150, resizable: true,
    },
    {
      headerName: 'İrsaliye Toplamı', field: 'irsaliyeToplam', width: 120, resizable: true,
      type: 'rightAligned',
      valueFormatter: (p) =>
        `${(p.value as number).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`,
    },
    {
      headerName: 'Durum', field: 'eIrsaliye', width: 110, resizable: true,
      cellRenderer: (p: { value: string }) => (
        <Tag color={p.value === 'Tamamlandı' || p.value === 'Teslim Alındı' ? 'green' : p.value === 'Onaylandı' || p.value === 'Kesinleşti' ? 'blue' : 'default'} className="!text-[11px]">
          {p.value}
        </Tag>
      ),
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
            {baslik}
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
                exportFileName={mod === 'satinalma' ? 'satinalma-irsaliyeleri' : mod === 'satinalma-siparis' ? 'satinalma-siparisleri' : 'irsaliyeleri'}
                storageKey={mod === 'satinalma' ? 'satinalmaIrsaliye' : mod === 'satinalma-siparis' ? 'satinalmaSiparis' : 'irsaliye'}
                rowSelection="single"
                onCellDoubleClicked={(e: CellDoubleClickedEvent<IrsaliyeRow>) => {
                  const row = e.data as IrsaliyeRow | undefined
                  if (row?.id != null) onSelect?.(row)
                }}
                onCellContextMenu={(e: CellContextMenuEvent<IrsaliyeRow>) => {
                  const row = e.data as IrsaliyeRow | undefined
                  if (row?.key) {
                    e.node?.setSelected(true)
                    setSelectedRow(row.key)
                  }
                }}
                onSelectionChanged={(e: SelectionChangedEvent<IrsaliyeRow>) => {
                  const sel = e.api.getSelectedRows()
                  setSelectedRow(sel[0]?.key ?? null)
                }}
              />
            </div>

            <div className="!border-t !border-gray-200 !px-3 !py-2 !flex !items-center !justify-between !bg-[#fafafa] !flex-shrink-0">
              <div className="!flex !items-center !gap-2 !flex-wrap">
                {mod !== 'satinalma-siparis' && (
                  <div className="!flex !items-center !gap-2">
                    <span className="!text-[11px] !text-[#9ca3af]">Yeni İrsaliye Türü:</span>
                    <Select
                      size="small"
                      value={yeniIrsaliyeTipi}
                      onChange={setYeniIrsaliyeTipi}
                      className="!w-56 !text-[12px]"
                      options={irsaliyeTipiOptions}
                    />
                  </div>
                )}
                {fasonFisTipleri[mod].includes(yeniIrsaliyeTipi) && (
                  <div className="!flex !items-center !gap-2">
                    <span className="!text-[11px] !text-[#9ca3af]">Fiş Alt Tipi:</span>
                    <Select
                      size="small"
                      value={yeniFasonTipiId ?? undefined}
                      onChange={(v) => setYeniFasonTipiId(v ?? null)}
                      placeholder="Seçiniz..."
                      className="!w-52 !text-[12px]"
                      options={fasonTipleri.map((f) => ({ value: f.id, label: f.ad }))}
                      notFoundContent="Fason tanımı bulunamadı"
                    />
                  </div>
                )}
              </div>
              <span className="!text-[11px] !text-[#9ca3af] !tabular-nums">{data.length} kayıt</span>
            </div>
          </div>
        </div>
      </div>
    </Dropdown>
  )
}
