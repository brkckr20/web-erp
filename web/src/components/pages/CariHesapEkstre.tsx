'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { App, Button, DatePicker, Space } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import type { ColDef } from 'ag-grid-community'
import dayjs, { type Dayjs } from 'dayjs'
import DataGrid from '@/components/shared/DataGrid'
import SearchableCariSelect from '@/components/shared/SearchableCariSelect'
import { cariHesapApi, type CariHesapEkstre, type CariHesapEkstreSatir } from '@/lib/cari-hesap-api'
import { MUHASEBE_FIS_TIPLERI } from '@/data/muhasebe-fis-tipleri'

const fmtMoney = (v?: number | null) => {
  const n = Number(v ?? 0)
  if (!n) return ''
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const fmtDate = (v?: string | null) => {
  if (!v) return '-'
  const d = new Date(v)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('tr-TR')
}

const fisTipiLabel = (tip?: string) =>
  MUHASEBE_FIS_TIPLERI.find((t) => t.deger === String(tip))?.ad ?? tip ?? '-'

export default function CariHesapEkstre() {
  const { message } = App.useApp()
  const [cariKod, setCariKod] = useState('')
  const [cariId, setCariId] = useState<number | null>(null)
  const [cariAd, setCariAd] = useState('')
  const [baslangic, setBaslangic] = useState<Dayjs | null>(dayjs().startOf('year'))
  const [bitis, setBitis] = useState<Dayjs | null>(dayjs())
  const [data, setData] = useState<CariHesapEkstre | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!cariId) {
      setData(null)
      return
    }
    setLoading(true)
    try {
      setData(
        await cariHesapApi.ekstre(
          cariId,
          baslangic ? baslangic.format('YYYY-MM-DD') : undefined,
          bitis ? bitis.format('YYYY-MM-DD') : undefined,
        ),
      )
    } catch {
      message.error('Cari ekstre yüklenemedi')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [cariId, baslangic, bitis, message])

  useEffect(() => {
    load()
  }, [load])

  const satirlar = useMemo<CariHesapEkstreSatir[]>(() => data?.satirlar ?? [], [data])

  const columnDefs = useMemo<ColDef<CariHesapEkstreSatir>[]>(
    () => [
      {
        headerName: 'Tarih',
        field: 'tarih',
        width: 105,
        valueFormatter: (p) => fmtDate(p.value),
      },
      {
        headerName: 'Fiş Tipi',
        field: 'fisTipi',
        width: 130,
        valueFormatter: (p) => fisTipiLabel(p.value),
      },
      {
        headerName: 'Fiş No',
        field: 'fisNo',
        width: 110,
        valueFormatter: (p) => (p.value == null ? '-' : String(p.value).padStart(8, '0')),
      },
      { headerName: 'Belge No', field: 'belgeNo', width: 120 },
      {
        headerName: 'Açıklama',
        field: 'aciklama',
        flex: 1,
        minWidth: 220,
        valueFormatter: (p) => p.value ?? '',
      },
      { headerName: 'Hesap Kodu', field: 'hesapKodu', width: 150 },
      {
        headerName: 'Döviz',
        field: 'doviz',
        width: 75,
        valueFormatter: (p) => p.value ?? '',
      },
      {
        headerName: 'Döviz Tutarı',
        field: 'dovizTutari',
        width: 125,
        type: 'rightAligned',
        valueFormatter: (p) => fmtMoney(p.value),
      },
      {
        headerName: 'Döviz Kuru',
        field: 'dovizKuru',
        width: 105,
        type: 'rightAligned',
        valueFormatter: (p) => (p.value == null ? '' : Number(p.value).toFixed(6)),
      },
      {
        headerName: 'Borç',
        field: 'borc',
        width: 120,
        type: 'rightAligned',
        valueFormatter: (p) => fmtMoney(p.value),
      },
      {
        headerName: 'Alacak',
        field: 'alacak',
        width: 120,
        type: 'rightAligned',
        valueFormatter: (p) => fmtMoney(p.value),
      },
      {
        headerName: 'Bakiye',
        field: 'bakiye',
        width: 130,
        type: 'rightAligned',
        valueFormatter: (p) => fmtMoney(p.value),
      },
    ],
    [],
  )

  return (
    <div className="!flex !flex-col !h-full !gap-2">
      <div className="!flex !items-center !justify-between !gap-2 !flex-wrap">
        <Space wrap>
          <div className="!w-80">
            <SearchableCariSelect
              value={cariKod}
              onChange={(kod, rec) => {
                setCariKod(kod)
                setCariId(rec?.id ?? null)
                setCariAd(rec?.ad ?? '')
              }}
              placeholder="Cari hesap seçin"
              widthClass="!w-full"
            />
          </div>
          <DatePicker value={baslangic} onChange={setBaslangic} format="DD.MM.YYYY" placeholder="Başlangıç" />
          <DatePicker value={bitis} onChange={setBitis} format="DD.MM.YYYY" placeholder="Bitiş" />
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading} disabled={!cariId}>
            Yenile
          </Button>
        </Space>
        {cariId && (
          <div className="!text-xs !text-gray-600 !flex !gap-4">
            <span>Devir: <b>{fmtMoney(data?.devir.bakiye) || '0,00'}</b></span>
            <span>Borç: <b>{fmtMoney(data?.toplam.borc) || '0,00'}</b></span>
            <span>Alacak: <b>{fmtMoney(data?.toplam.alacak) || '0,00'}</b></span>
            <span>Bakiye: <b>{fmtMoney(data?.bakiye) || '0,00'}</b></span>
          </div>
        )}
      </div>

      {!cariId ? (
        <div className="!bg-white !rounded-sm !p-6 !text-center !text-xs !text-[#9ca3af]">
          Ekstresini görmek için cari hesap seçin.
        </div>
      ) : (
        <div className="!text-[11px] !text-[#6b7280]">
          {data?.cari.kod ?? cariKod} - {data?.cari.ad ?? cariAd}
        </div>
      )}

      <div className="!flex-1 !min-h-0">
        <DataGrid<CariHesapEkstreSatir>
          rowData={satirlar}
          columnDefs={columnDefs}
          exportFileName="cari-hesap-ekstresi"
          storageKey="cariHesapEkstresi"
        />
      </div>
    </div>
  )
}
