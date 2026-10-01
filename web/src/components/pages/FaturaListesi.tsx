'use client'

import { Input, Select, Button, Tag, Dropdown, App } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons'
import { useState, useMemo, useEffect } from 'react'
import type { ColDef, CellDoubleClickedEvent, CellContextMenuEvent, SelectionChangedEvent } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { faturaApi, type Fatura } from '@/lib/fatura-api'
import { fasonTipiApi, type FasonTipi } from '@/lib/fason-tipi-api'

interface FaturaRow {
  key: string
  id: number
  faturaTipi: string
  faturaNo: string
  faturaTarih: string
  cariHesap: string
  depo: string
  aciklama: string
  faturaToplam: number
  kayitEden: string
}

const formatTarih = (d: string | null) => {
  if (!d) return '-'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '-'
  return dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const mapFatura = (f: Fatura): FaturaRow => {
  const faturaToplam = (f.kalemler ?? []).reduce((acc, k) => acc + (Number(k.satirTutari) || 0), 0)
  return {
    key: String(f.id),
    id: f.id,
    faturaTipi: f.faturaTipi,
    faturaNo: f.faturaNo,
    faturaTarih: formatTarih(f.faturaTarihi),
    cariHesap: f.cariHesap?.ad ?? '',
    depo: f.depo?.kod ?? '',
    aciklama: f.aciklama ?? '',
    faturaToplam,
    kayitEden: f.kayitYapan ?? '-',
  }
}

// Fatura tipleri irsaliye tip setiyle aynıdır (otomatik irsaliye aynı tipte açılır).
const satisFaturaTipiMap: Record<string, string> = {
  '2': '2-Perakende Satış İade Faturası',
  '3': '3-Toptan Satış İade Faturası',
  '4': '4-Konsinye Çıkış İade Faturası',
  '8': '8-Konsinye Satış Faturası',
  '12': '12-Fason Çıkış İade Faturası',
  '23': '23-Verilen Hizmet İade Faturası',
  '120': '120-Toptan Satış Faturası',
  '121': '121-Perakende Satış Faturası',
  '123': '123-Konsinye Çıkış Faturası',
  '125': '125-Fason Giriş Faturası',
  '126': '126-Verilen Fiyat Farkı Faturası',
  '134': '134-Fasona Çıkış Faturası',
  '138': '138-Verilen Hizmet Faturası',
  '192': '192-Serbest Meslek Makbuzu',
}

const satinalmaFaturaTipiMap: Record<string, string> = {
  '1': '1-Mal Alım Faturası',
  '5': '5-Konsinye Giriş Faturası',
  '6': '6-Fasona Giriş Faturası',
  '7': '7-Alınan Fiyat Farkı Faturası',
  '9': '9-Müstahsil Faturası',
  '11': '11-Fasondan Giriş Faturası',
  '22': '22-Alınan Hizmet Faturası',
  '92': '92-Serbest Meslek Makbuzu',
  '122': '122-Mal Alım İade Faturası',
  '124': '124-Konsinye Giriş İade Faturası',
  '133': '133-Fasona Giriş İade Faturası',
  '139': '139-Alınan Hizmet İade Faturası',
}

const faturaTipiMap: Record<string, string> = { ...satisFaturaTipiMap, ...satinalmaFaturaTipiMap }
const satisTipleri = Object.keys(satisFaturaTipiMap)
const satinalmaTipleri = Object.keys(satinalmaFaturaTipiMap)

// Malzeme tip kodları: 2 kumaş, 3 iplik, 4 aksesuar.
const kategoriMalzemeTip: Record<string, number> = { kumas: 2, iplik: 3, aksesuar: 4 }
const kategoriBaslik: Record<string, string> = { kumas: 'Kumaş', iplik: 'İplik', aksesuar: 'Aksesuar' }

export const faturaTipiLabelMap: Record<string, string> = faturaTipiMap

interface FaturaListesiProps {
  mod?: 'satis' | 'satinalma'
  kategori?: 'kumas' | 'iplik' | 'aksesuar' | 'genel'
  onNew?: (faturaTipi: string, fasonTipiId?: number | null) => void
  onSelect?: (info: { id: number; faturaTipi: string; faturaNo: string; ekranAdi?: string }) => void
}

const fasonFisTipleri = ['6', '11', '12', '125', '133', '134']

export default function FaturaListesi({ mod = 'satis', kategori = 'genel', onNew, onSelect }: FaturaListesiProps) {
  const gorselTipler = mod === 'satinalma' ? satinalmaTipleri : satisTipleri
  const faturaTipiOptions = gorselTipler.map((value) => ({ value, label: faturaTipiMap[value] }))
  const katAd = kategoriBaslik[kategori] ? `${kategoriBaslik[kategori]} ` : ''
  const baslik = mod === 'satinalma' ? `Satın Alma ${katAd}Faturaları` : `Satış ${katAd}Faturaları`
  const ekranAdi = mod === 'satinalma' ? `satinalma-${kategori}-faturalari` : `satis-${kategori}-faturalari`
  const [data, setData] = useState<FaturaRow[]>([])
  const [loading, setLoading] = useState(false)
  const [yeniFaturaTipi, setYeniFaturaTipi] = useState(mod === 'satinalma' ? '1' : '120')
  const [yeniFasonTipiId, setYeniFasonTipiId] = useState<number | null>(null)
  const [fasonTipleri, setFasonTipleri] = useState<FasonTipi[]>([])
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const { modal, message } = App.useApp()

  const handleNew = () => onNew?.(yeniFaturaTipi, fasonFisTipleri.includes(yeniFaturaTipi) ? yeniFasonTipiId : null)

  useEffect(() => {
    fasonTipiApi
      .list()
      .then((list) => setFasonTipleri(list.filter((f) => f.kullanimda)))
      .catch(() => setFasonTipleri([]))
  }, [])

  useEffect(() => {
    setYeniFasonTipiId(null)
  }, [yeniFaturaTipi])

  const handleSil = () => {
    const r = data.find((d) => d.key === selectedRow)
    if (!r) return
    modal.confirm({
      title: 'Faturayı Sil',
      content: `${faturaTipiMap[r.faturaTipi] || r.faturaTipi} - ${r.faturaNo} faturasını silmek istediğinize emin misiniz?`,
      okText: 'Evet, sil',
      okButtonProps: { danger: true },
      cancelText: 'Vazgeç',
      onOk: async () => {
        try {
          await faturaApi.remove(r.id)
          message.success('Fatura silindi')
          load()
        } catch (err: unknown) {
          message.error('Fatura silinirken hata: ' + ((err as Error)?.message ?? String(err)))
        }
      },
    })
  }

  const load = () => {
    setLoading(true)
    const tipler = new Set(mod === 'satinalma' ? satinalmaTipleri : satisTipleri)
    faturaApi
      .list()
      .then((res) => {
        let rows = res.filter((f) => tipler.has(String(f.faturaTipi)))
        const malzemeTip = kategoriMalzemeTip[kategori]
        if (malzemeTip != null) {
          rows = rows.filter((f) => (f.kalemler ?? []).some((k) => k.malzeme?.tip === malzemeTip))
        }
        setData(rows.map(mapFatura))
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const contextMenuItems: MenuProps['items'] = [
    { key: 'yeni', label: 'Yeni', icon: <PlusOutlined />, onClick: handleNew },
    { key: 'duzenle', label: 'Düzenle', disabled: !selectedRow, onClick: () => { const r = data.find((d) => d.key === selectedRow); if (r) onSelect?.({ ...r, ekranAdi }) } },
    { type: 'divider' },
    { key: 'sil', label: 'Sil', danger: true, disabled: !selectedRow, onClick: handleSil },
  ]

  const columns = useMemo<ColDef<FaturaRow>[]>(() => [
    {
      headerName: 'Fatura Tipi', field: 'faturaTipi', width: 150, resizable: true,
      valueFormatter: (p) => faturaTipiMap[p.value as string] || p.value,
    },
    {
      headerName: 'Fatura No', field: 'faturaNo', width: 90, resizable: true,
      cellClass: '!text-[#f57c00] !font-medium',
    },
    {
      headerName: 'Fatura Tarihi', field: 'faturaTarih', width: 100, resizable: true,
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
      headerName: 'Açıklama', field: 'aciklama', width: 150, resizable: true,
    },
    {
      headerName: 'Fatura Toplamı', field: 'faturaToplam', width: 120, resizable: true,
      type: 'rightAligned',
      valueFormatter: (p) =>
        `${(p.value as number).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`,
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
                loading={loading}
                rowData={data}
                columnDefs={columns}
                domLayout="normal"
                exportFileName={ekranAdi}
                storageKey={ekranAdi}
                rowSelection="single"
                onCellDoubleClicked={(e: CellDoubleClickedEvent<FaturaRow>) => {
                  const row = e.data as FaturaRow | undefined
                  if (row?.id != null) onSelect?.({ ...row, ekranAdi })
                }}
                onCellContextMenu={(e: CellContextMenuEvent<FaturaRow>) => {
                  const row = e.data as FaturaRow | undefined
                  if (row?.key) {
                    e.node?.setSelected(true)
                    setSelectedRow(row.key)
                  }
                }}
                onSelectionChanged={(e: SelectionChangedEvent<FaturaRow>) => {
                  const sel = e.api.getSelectedRows()
                  setSelectedRow(sel[0]?.key ?? null)
                }}
              />
            </div>

            <div className="!border-t !border-gray-200 !px-3 !py-2 !flex !items-center !justify-between !bg-[#fafafa] !flex-shrink-0">
              <div className="!flex !items-center !gap-2 !flex-wrap">
                <div className="!flex !items-center !gap-2">
                  <span className="!text-[11px] !text-[#9ca3af]">Yeni Fatura Türü:</span>
                  <Select
                    size="small"
                    value={yeniFaturaTipi}
                    onChange={setYeniFaturaTipi}
                    className="!w-56 !text-[12px]"
                    options={faturaTipiOptions}
                  />
                </div>
                {fasonFisTipleri.includes(yeniFaturaTipi) && (
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
