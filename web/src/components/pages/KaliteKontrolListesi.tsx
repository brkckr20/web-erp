'use client'

import { Button, Dropdown, App, Modal, Spin } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined, DeleteOutlined, InboxOutlined } from '@ant-design/icons'
import { useState, useMemo, useEffect, useCallback } from 'react'
import type { ColDef, CellDoubleClickedEvent, CellContextMenuEvent, SelectionChangedEvent } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { kaliteKontrolApi, type KaliteKontrol } from '@/lib/kalite-kontrol-api'
import { irsaliyeApi } from '@/lib/irsaliye-api'
import { kalemMiktari } from '@/lib/miktar'
import { incrementBarkod } from '@/lib/barkod'

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

const formatSayi = (v: number) =>
  v === 0 ? '-' : new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(v)

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

/** "Kalite Bekleyen" satırı: 11-Fasondan Giriş kalemi + KK'ya giren miktar. */
interface BekleyenRow {
  key: string
  irsaliyeKalemId: number
  fisNo: string
  tarih: string
  cariAd: string
  cariHesapId: number | null
  depoKod: string
  depoId: number | null
  malzemeId: number | null
  malzemeKod: string
  malzemeAd: string
  olcuBirimi: string
  miktar: number
  kkGiren: number
  bekleyen: number
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
    { key: 'neni', label: 'Yeni', icon: <PlusOutlined />, onClick: handleNew },
    {
      key: 'duzenle', label: 'Düzenle', disabled: !selectedRow,
      onClick: () => { const r = data.find((d) => d.key === selectedRow); if (r) onSelect?.(r.id) },
    },
    { type: 'divider' },
    { key: 'sil', label: 'Sil', danger: true, disabled: !selectedRow, onClick: handleSil },
  ]

  // ===== Kalite Bekleyen (11-Fasondan Giriş kalemleri) =====
  const [bekleyenOpen, setBekleyenOpen] = useState(false)
  const [bekleyenYukleniyor, setBekleyenYukleniyor] = useState(false)
  const [bekleyenRows, setBekleyenRows] = useState<BekleyenRow[]>([])
  const [bekleyenSecili, setBekleyenSecili] = useState<BekleyenRow[]>([])
  const [aktariliyor, setAktariliyor] = useState(false)

  const loadBekleyen = useCallback(async () => {
    setBekleyenYukleniyor(true)
    try {
      const [irsaliyeler, kkList] = await Promise.all([irsaliyeApi.list(), kaliteKontrolApi.list()])

      // KK'ya girmiş 11 kalemleri ve miktarları (kalem id → toplam).
      const kkGiren = new Map<number, number>()
      for (const f of kkList) {
        for (const k of f.kalemler ?? []) {
          if (k.irsaliyeKalemId == null) continue
          const onceki = kkGiren.get(k.irsaliyeKalemId) ?? 0
          // Birim 11 kalemine göre belirlenir; KK kaleminde hangi alan doluysa o.
          const m = Number(k.netAgirlik) > 0 ? Number(k.netAgirlik)
            : Number(k.netMetre) > 0 ? Number(k.netMetre)
            : k.adet || 0
          kkGiren.set(k.irsaliyeKalemId, onceki + m)
        }
      }

      const rows: BekleyenRow[] = []
      for (const i of irsaliyeler) {
        if (String(i.irsaliyeTipi) !== '11') continue
        if (!i.tamamlandi) continue
        for (const k of i.kalemler ?? []) {
          if (k.id == null) continue
          if (k.kaliteYapilmayacak) continue
          const miktar = kalemMiktari(
            k.olcuBirimi,
            Number(k.brutAgirlik) || 0,
            Number(k.netAgirlik) || 0,
            Number(k.brutMetre) || 0,
            Number(k.netMetre) || 0,
            Number(k.adet) || 0,
          )
          if (miktar <= 0) continue
          const giren = kkGiren.get(k.id) ?? 0
          const bekleyen = miktar - giren
          if (bekleyen <= 0) continue
          rows.push({
            key: `${i.id}-${k.id}`,
            irsaliyeKalemId: k.id,
            fisNo: i.irsaliyeNo,
            tarih: formatTarih(i.irsaliyeTarihi),
            cariAd: i.cariHesap?.ad ?? '',
            cariHesapId: i.cariHesapId ?? null,
            depoKod: i.depo?.kod ?? '',
            depoId: i.depoId ?? null,
            malzemeId: k.malzemeId ?? null,
            malzemeKod: k.malzeme?.kod ?? '',
            malzemeAd: k.malzeme?.ad ?? '',
            olcuBirimi: k.olcuBirimi ?? 'kg',
            miktar,
            kkGiren: giren,
            bekleyen,
          })
        }
      }
      setBekleyenRows(rows)
      setBekleyenSecili([])
    } catch {
      setBekleyenRows([])
    } finally {
      setBekleyenYukleniyor(false)
    }
  }, [])

  const handleBekleyenAc = useCallback(() => {
    setBekleyenOpen(true)
    loadBekleyen()
  }, [loadBekleyen])

  /** Seçilen bekleyen kalemlerle KK fişi oluşturur (her satır 1 top = 1 barkod). */
  const handleAktar = useCallback(async () => {
    if (bekleyenSecili.length === 0) {
      message.warning('KK fişine aktarılacak kalem seçiniz')
      return
    }
    const depoKod = bekleyenSecili[0].depoKod
    if (!depoKod) {
      message.error('İrsaliyenin deposu seçili değil — top barkodu üretilemez')
      return
    }
    setAktariliyor(true)
    try {
      const [{ fisNo }, { barkod: ilkBarkod }] = await Promise.all([
        kaliteKontrolApi.nextFisNo(),
        kaliteKontrolApi.nextBarkod(depoKod),
      ])
      let barkod = ilkBarkod
      const kalemler = bekleyenSecili.map((r) => {
        const birim = String(r.olcuBirimi ?? '').toLowerCase()
        const kalan = {
          barkod,
          irsaliyeKalemId: r.irsaliyeKalemId,
          malzemeId: r.malzemeId ?? undefined,
          netAgirlik: birim === 'kg' || birim === 'brutkg' ? r.bekleyen : undefined,
          netMetre: birim === 'mt' || birim === 'brutmt' ? r.bekleyen : undefined,
          adet: birim === 'adet' ? r.bekleyen : undefined,
        }
        barkod = incrementBarkod(barkod)
        return kalan
      })
      const created = await kaliteKontrolApi.create({
        fisNo,
        fisTarihi: new Date().toISOString().slice(0, 10),
        depoId: bekleyenSecili[0].depoId ?? null,
        cariHesapId: bekleyenSecili[0].cariHesapId ?? null,
        kalemler,
      })
      message.success(`${kalemler.length} kalem KK fişine aktarıldı (${fisNo})`)
      setBekleyenOpen(false)
      load()
      onSelect?.(created.id)
    } catch (err) {
      message.error('Aktarılırken hata: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setAktariliyor(false)
    }
  }, [bekleyenSecili, load, message, onSelect])

  const bekleyenColumns = useMemo<ColDef<BekleyenRow>[]>(() => [
    { headerName: 'Fiş No', field: 'fisNo', width: 100, cellClass: '!text-[#f57c00] !font-medium' },
    { headerName: 'Tarih', field: 'tarih', width: 100 },
    { headerName: 'Cari Hesap', field: 'cariAd', flex: 1, minWidth: 140, valueFormatter: (p) => p.value || '-' },
    { headerName: 'Depo', field: 'depoKod', width: 90, valueFormatter: (p) => p.value || '-' },
    { headerName: 'Malzeme Kodu', field: 'malzemeKod', width: 110, valueFormatter: (p) => p.value || '-' },
    { headerName: 'Malzeme Adı', field: 'malzemeAd', flex: 1, minWidth: 150, valueFormatter: (p) => p.value || '-' },
    { headerName: 'Birim', field: 'olcuBirimi', width: 80, valueFormatter: (p) => p.value || '-' },
    { headerName: 'Miktar', field: 'miktar', width: 100, type: 'rightAligned', valueFormatter: (p) => formatSayi(Number(p.value) || 0) },
    { headerName: 'KK\'dan Giren', field: 'kkGiren', width: 110, type: 'rightAligned', valueFormatter: (p) => formatSayi(Number(p.value) || 0) },
    { headerName: 'Bekleyen', field: 'bekleyen', width: 110, type: 'rightAligned', cellClass: '!font-semibold !text-[#f57c00]', valueFormatter: (p) => formatSayi(Number(p.value) || 0) },
  ], [])

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
    <>
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
                size="small"
                icon={<InboxOutlined />}
                onClick={handleBekleyenAc}
                className="!text-[12px] !h-7"
              >
                Kalite Bekleyen
              </Button>
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

      <Modal
        open={bekleyenOpen}
        onCancel={() => setBekleyenOpen(false)}
        width="90vw"
        title={<span className="!text-[13px] !font-semibold">Kalite Bekleyen — 11-Fasondan Giriş kalemleri</span>}
        footer={[
          <Button key="vazgec" onClick={() => setBekleyenOpen(false)} className="!text-[12px]">
            Vazgeç
          </Button>,
          <Button
            key="aktar"
            type="primary"
            loading={aktariliyor}
            onClick={handleAktar}
            className="!text-[12px]"
          >
            Seçilenleri KK Fişine Aktar
          </Button>,
        ]}
      >
        <Spin spinning={bekleyenYukleniyor}>
          <div className="!flex !flex-col !gap-2">
            <div className="!text-[11px] !text-[#9ca3af]">
              11-Fasondan Giriş fişlerinden gelen, kalite kontrol gerekmiyor işareti
              olmayan ve henüz kalite kontrol girişine girmemiş kalemler. Seçip KK fişi oluşturun;
              fişte satırı kopyalayarak bir kalemi birden çok topa bölebilirsiniz.
            </div>
            <div style={{ height: 400 }}>
              <DataGrid
                rowData={bekleyenRows}
                columnDefs={bekleyenColumns}
                domLayout="normal"
                exportFileName="kalite-bekleyen"
                storageKey="kaliteBekleyen"
                height={400}
                enableRowSelection
                rowSelection="multiple"
                onSelectionChanged={(e: SelectionChangedEvent<BekleyenRow>) => {
                  setBekleyenSecili(e.api.getSelectedRows())
                }}
              />
            </div>
          </div>
        </Spin>
      </Modal>
    </>
  )
}
