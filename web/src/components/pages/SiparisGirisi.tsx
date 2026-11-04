'use client'

import { Dropdown, Button, App } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect, useMemo } from 'react'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { siparisApi, type Siparis } from '@/lib/siparis-api'

interface SiparisRow {
  key: string
  id: number
  siparisNo: string
  tarih: string
  cariKod: string
  cariAd: string
  musteriOrderNo: string
  toplamMiktar: number
  toplamTutarDoviz: string
  toplamTutarTL: number
  durum: string
  aciklama: string
  kayitTarihi: string
  kayitYapan: string
}

interface SiparisGirisiProps {
  onSelect?: (id: number, siparisNo: string) => void
  onNew?: () => void
  onTedarik?: (tip: 'kumas' | 'iplik' | 'aksesuar', id: number, siparisNo: string) => void
}

export default function SiparisGirisi({ onSelect, onNew, onTedarik }: SiparisGirisiProps) {
  const { message, modal } = App.useApp()
  const [data, setData] = useState<SiparisRow[]>([])
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const formatTarih = (t: string | null | undefined) => {
    if (!t) return ''
    const d = new Date(t)
    if (isNaN(d.getTime())) return ''
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
  }

  const toRow = (s: Siparis): SiparisRow => {
    const kalemler = s.kalemler ?? []
    const genel = s.aciklamalar?.find((a) => a.tip === 'genel')?.metin ?? ''
    const hasToplamTutar = s.toplamTutar != null
    const dovizMap = new Map<string, number>()
    let tlToplam = 0

    for (const k of kalemler) {
      const dovizCinsi = k.dovizCinsi
      const dovizFiyat = Number(k.dovizFiyati) || 0
      const miktar = Number(k.miktar) || 0
      const kur = Number(k.dovizKuru) || 0
      let tutar = dovizFiyat > 0 && miktar > 0 ? dovizFiyat * miktar : 0
      if (tutar <= 0) {
        const tl = Number(k.tutar) || 0
        if (tl > 0 && kur > 0) tutar = tl / kur
      }
      if (!hasToplamTutar && (!dovizCinsi || dovizCinsi === 'TL' || dovizCinsi === 'TRY')) {
        tlToplam += tutar
      } else if (dovizCinsi && dovizCinsi !== 'TL' && dovizCinsi !== 'TRY' && tutar > 0) {
        dovizMap.set(dovizCinsi, (dovizMap.get(dovizCinsi) ?? 0) + tutar)
      }
    }

    const dovizGosterim = Array.from(dovizMap.entries())
      .map(([kod, tutar]) => `${tutar.toFixed(2)} ${kod}`)
      .join(' | ')

    return {
      key: String(s.id),
      id: s.id,
      siparisNo: s.siparisNo,
      tarih: formatTarih(s.tarih),
      cariKod: s.cariHesap?.kod ?? '',
      cariAd: s.cariHesap?.ad ?? '',
      musteriOrderNo: s.musteriOrderNo ?? '',
      toplamMiktar: kalemler.reduce((a, k) => a + (Number(k.miktar) || 0), 0),
      toplamTutarDoviz: dovizGosterim,
      toplamTutarTL: hasToplamTutar ? Number(s.toplamTutar) || 0 : tlToplam,
      durum: s.durum ?? '',
      aciklama: genel,
      kayitTarihi: formatTarih(s.kayitTarihi),
      kayitYapan: s.kayitYapan ?? '',
    }
  }

  const load = async () => {
    setLoading(true)
    try {
      const list = await siparisApi.list()
      setData(list.map(toRow))
    } catch {
      setData([])
      message.warning('Sipariş listesi yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const contextMenuItems: MenuProps['items'] = [
    { key: 'yeni', label: 'Yeni', icon: <PlusOutlined /> },
    { key: 'duzenle', label: 'Düzenle', disabled: !selectedRow },
    { type: 'divider' },
    {
      key: 'tedarik',
      label: 'Tedarik İşlemleri',
      disabled: !selectedRow,
      children: [
        { key: 'tedarik-kumas', label: 'Kumaş Tedarik' },
        { key: 'tedarik-iplik', label: 'İplik Tedarik' },
        { key: 'tedarik-aksesuar', label: 'Aksesuar Tedarik' },
      ],
    },
    { type: 'divider' },
    { key: 'sil', label: 'Sil', danger: true, disabled: !selectedRow },
  ]

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'yeni') return onNew?.()
    if (key === 'duzenle') {
      if (selectedRow) {
        const row = data.find((d) => d.id === selectedRow)
        if (row) onSelect?.(selectedRow, row.siparisNo)
      }
      return
    }
    if (key.startsWith('tedarik-')) {
      const tip = key.replace('tedarik-', '') as 'kumas' | 'iplik' | 'aksesuar'
      const row = data.find((d) => d.id === selectedRow)
      if (selectedRow && row) onTedarik?.(tip, selectedRow, row.siparisNo)
      return
    }
    if (key === 'sil') {
      if (!selectedRow) return
      const row = data.find((d) => d.id === selectedRow)
      modal.confirm({
        title: 'Sipariş Sil',
        content: `"${row?.siparisNo ?? ''}" numaralı siparişi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
        okText: 'Evet, Sil',
        cancelText: 'İptal',
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await siparisApi.remove(selectedRow)
            message.success('Sipariş silindi')
            setSelectedRow(null)
            await load()
          } catch (err: unknown) {
            message.error('Silinirken hata: ' + ((err as Error)?.message ?? String(err)))
          }
        },
      })
    }
  }

  const columns = useMemo<ColDef<SiparisRow>[]>(
    () => [
      { headerName: 'Sipariş No', field: 'siparisNo', width: 120, cellClass: 'siparis-no-cell', cellStyle: { color: '#f57c00', fontWeight: 500 } },
      { headerName: 'Tarih', field: 'tarih', width: 100 },
      { headerName: 'Cari Kod', field: 'cariKod', width: 100 },
      { headerName: 'Cari Adı', field: 'cariAd', flex: 1, minWidth: 150 },
      { headerName: 'Müşteri Order No', field: 'musteriOrderNo', width: 130 },
      { headerName: 'Toplam Miktar', field: 'toplamMiktar', width: 110 },
      { headerName: 'Toplam Tutar (Döviz)', field: 'toplamTutarDoviz', flex: 1, minWidth: 150 },
      { headerName: 'Toplam Tutar (TL)', field: 'toplamTutarTL', width: 120, valueFormatter: (p) => `${Number(p.value ?? 0).toFixed(2)} TL` },
      { headerName: 'Durum', field: 'durum', width: 100 },
      { headerName: 'Açıklama', field: 'aciklama', flex: 1, minWidth: 120 },
      { headerName: 'Kayıt Tarihi', field: 'kayitTarihi', width: 110 },
      { headerName: 'Kayıt Eden', field: 'kayitYapan', width: 110 },
    ],
    [],
  )

  return (
    <Dropdown menu={{ items: contextMenuItems, onClick: handleMenuClick }} trigger={['contextMenu']}>
      <div className="!p-3 !h-full !flex !flex-col">
        <div className="!flex !items-center !justify-between !mb-3 !flex-shrink-0">
          <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
            Sipariş Listesi
          </div>
          <div className="!flex !items-center !gap-1.5">
            <Button size="small" icon={<ReloadOutlined />} onClick={load} className="!text-[11px] !h-7" />
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={onNew} className="!text-[11px] !h-7">
              Yeni
            </Button>
          </div>
        </div>

        <div className="!bg-white !rounded-sm !flex-1 !min-h-0" style={{ minHeight: 300 }}>
            <DataGrid
              loading={loading}
              rowData={data}
              columnDefs={columns}
              domLayout="normal"
              exportFileName="siparis-listesi"
              rowSelection="single"
              onSelectionChanged={(e) => {
                const sel = e.api.getSelectedRows()
                setSelectedRow(sel[0]?.id ?? null)
              }}
              onRowDoubleClicked={(e) => e.data && onSelect?.(e.data.id, e.data.siparisNo)}
              onCellContextMenu={(e) => {
                if (e.data) {
                  e.node?.setSelected(true)
                  setSelectedRow(e.data.id)
                }
              }}
            />
        </div>
      </div>
    </Dropdown>
  )
}
