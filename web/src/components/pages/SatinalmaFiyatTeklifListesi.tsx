'use client'

import { useState, useEffect, useMemo } from 'react'
import { Input, Button, App } from 'antd'
import { PlusOutlined, ReloadOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColDef, CellDoubleClickedEvent, RowClickedEvent } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { fiyatTeklifApi, type FiyatTeklif } from '@/lib/fiyat-teklif-api'

interface TeklifRow {
  key: string
  id: number
  teklifNo: string
  tarih: string
  cariKod: string
  cariAd: string
  gecerlilik: string
  kalemSayisi: number
  toplamTL: number
  dosyaSayisi: number
  aciklama: string
}

const formatTarih = (d: string | null) => {
  if (!d) return '-'
  const dt = new Date(d)
  if (isNaN(dt.getTime()) || dt.getFullYear() <= 1900) return '-'
  return dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const tutarTL = (miktar: unknown, fiyat: unknown, doviz: string, kur: unknown) => {
  const brut = (Number(miktar) || 0) * (Number(fiyat) || 0)
  if (doviz === 'TL') return brut
  return brut * (Number(kur) || 1)
}

const formatTutar = (n: number) =>
  n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface Props {
  onOpen: (id?: number) => void
}

export default function SatinalmaFiyatTeklifListesi({ onOpen }: Props) {
  const { message, modal } = App.useApp()
  const [list, setList] = useState<FiyatTeklif[]>([])
  const [loading, setLoading] = useState(true)
  const [arama, setArama] = useState('')
  const [secili, setSecili] = useState<TeklifRow | null>(null)

  const yukle = async () => {
    setLoading(true)
    try {
      const data = await fiyatTeklifApi.list()
      setList(data)
      setSecili(null)
    } catch {
      message.error('Fiyat teklifleri yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { yukle() }, [])

  const rows = useMemo<TeklifRow[]>(() => {
    return list
      .filter((t) => {
        if (!arama) return true
        const a = arama.toLowerCase()
        return (
          t.teklifNo.toLowerCase().includes(a) ||
          t.cariKod.toLowerCase().includes(a) ||
          (t.cariAd ?? '').toLowerCase().includes(a) ||
          (t.aciklama ?? '').toLowerCase().includes(a)
        )
      })
      .map((t) => ({
        key: String(t.id),
        id: t.id,
        teklifNo: t.teklifNo,
        tarih: formatTarih(t.tarih),
        cariKod: t.cariKod,
        cariAd: t.cariAd ?? '-',
        gecerlilik: formatTarih(t.gecerlilikTarihi),
        kalemSayisi: (t.kalemler ?? []).length,
        toplamTL: (t.kalemler ?? []).reduce(
          (acc, k) => acc + tutarTL(k.miktar, k.birimFiyat, k.dovizCinsi, k.dovizKuru),
          0,
        ),
        dosyaSayisi: (t.dosyalar ?? []).length,
        aciklama: t.aciklama ?? '-',
      }))
  }, [list, arama])

  const columns = useMemo<ColDef<TeklifRow>[]>(
    () => [
      { headerName: 'Teklif No', field: 'teklifNo', width: 130 },
      { headerName: 'Tarih', field: 'tarih', width: 100 },
      { headerName: 'Cari Kod', field: 'cariKod', width: 110 },
      { headerName: 'Cari Ad', field: 'cariAd', flex: 1, minWidth: 160 },
      { headerName: 'Geçerlilik', field: 'gecerlilik', width: 100 },
      { headerName: 'Kalem', field: 'kalemSayisi', width: 80, type: 'rightAligned' },
      {
        headerName: 'Toplam (TL)',
        field: 'toplamTL',
        width: 130,
        type: 'rightAligned',
        valueFormatter: (p) => formatTutar(Number(p.value) || 0),
      },
      { headerName: 'Ek', field: 'dosyaSayisi', width: 60, type: 'rightAligned' },
      { headerName: 'Açıklama', field: 'aciklama', flex: 1, minWidth: 150 },
    ],
    [],
  )

  const handleSil = () => {
    if (!secili) return
    modal.confirm({
      title: 'Fiyat Teklifini Sil',
      content: `${secili.teklifNo} numaralı fiyat teklifini silmek istediğinize emin misiniz?`,
      okText: 'Evet, sil',
      okButtonProps: { danger: true },
      cancelText: 'Vazgeç',
      onOk: async () => {
        try {
          await fiyatTeklifApi.remove(secili.id)
          message.success('Fiyat teklifi silindi')
          yukle()
        } catch {
          message.error('Silme hatası')
        }
      },
    })
  }

  return (
    <div className="!p-3 !h-full !flex !flex-col">
      <div className="!flex !items-center !justify-between !mb-3 !flex-shrink-0">
        <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
          Satın Alma Fiyat Teklifleri
        </div>
        <div className="!flex !items-center !gap-1.5">
          <Input
            size="small"
            prefix={<SearchOutlined className="!text-gray-400" />}
            placeholder="Ara..."
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            className="!w-48 !text-[11px] !h-7"
            allowClear
          />
          <Button size="small" icon={<ReloadOutlined />} onClick={yukle} className="!text-[11px] !h-7" />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={handleSil}
            disabled={!secili}
            className="!text-[11px] !h-7"
          >
            Sil
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => onOpen()}
            className="!text-[11px] !h-7"
          >
            Yeni
          </Button>
        </div>
      </div>

      <div className="!bg-white !rounded-sm !flex-1 !min-h-0" style={{ minHeight: 300 }}>
        <DataGrid
          columnDefs={columns}
          rowData={rows}
          loading={loading}
          storageKey="satinalmaFiyatTeklifListesi"
          rowSelection="single"
          onRowClicked={(e: RowClickedEvent<TeklifRow>) => setSecili(e.data ?? null)}
          onCellDoubleClicked={(e: CellDoubleClickedEvent<TeklifRow>) => {
            if (e.data) onOpen(e.data.id)
          }}
        />
      </div>
    </div>
  )
}
