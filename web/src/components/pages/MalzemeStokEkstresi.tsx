'use client'

import { Button, App, Select } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect, useMemo } from 'react'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { stokEkstresiApi, type StokEkstresiSatir } from '@/lib/stok-ekstresi-api'

interface MalzemeStokEkstresiProps {
  malzemeKod: string
  depoKod?: string | null
}

const formatTarih = (d: string | null) => {
  if (!d) return '-'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '-'
  return dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const irsaliyeTipiMap: Record<string, string> = {
  '1': '1-Mal Alım İrsaliyesi',
  '2': '2-Perakende Satış İade İrsaliyesi',
  '3': '3-Toptan Satış İade İrsaliyesi',
  '4': '4-Konsinye Çıkış İade İrsaliyesi',
  '5': '5-Konsinye Giriş İrsaliyesi',
  '6': '6-Fasona Giriş İrsaliyesi',
  '7': '7-Alınan Fiyat Farkı İrsaliyesi',
  '8': '8-Konsinye Satır İrsaliyesi',
  '9': '9-Müstahsil İrsaliyesi',
  '11': '11-Fasondan Giriş İrsaliyesi',
  '12': '12-Fason Çıkış İade İrsaliyesi',
  '22': '22-Alınan Hizmet İrsaliyesi',
  '23': '23-Verilen Hizmet İadesi',
  '92': '92-Serbest Meslek Makbuzu',
  '120': '120-Toptan Satış İrsaliyesi',
  '121': '121-Perakende Satır İrsaliyesi',
  '122': '122-Mal Alım İade İrsaliyesi',
  '123': '123-Konsinye Çıkış İrsaliyesi',
  '124': '124-Konsinye Giriş İade İrsaliyesi',
  '125': '125-Fason Giriş İrsaliyesi',
  '126': '126-Verilen Fiyat Farkı İrsaliyesi',
  '133': '133-Fasona Giriş İade İrsaliyesi',
  '134': '134-Fasona Çıkış İrsaliyesi',
  '138': '138-Verilen Hizmet İrsaliyesi',
  '139': '139-Alınan Hizmet İadesi',
  '192': '192-Serbest Meslek Makbuzu',
  '201': '201-Satın Alma Siparişi',
}

export default function MalzemeStokEkstresi({ malzemeKod, depoKod }: MalzemeStokEkstresiProps) {
  const [data, setData] = useState<StokEkstresiSatir[]>([])
  const [loading, setLoading] = useState(false)
  const [seciliDepo, setSeciliDepo] = useState<string>('')
  const { message } = App.useApp()

  const load = async () => {
    setLoading(true)
    try {
      const list = await stokEkstresiApi.list(malzemeKod)
      setData(list)
      if (!seciliDepo && depoKod) setSeciliDepo(depoKod)
    } catch {
      message.error('Stok ekstresi yüklenemedi')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [malzemeKod])

  useEffect(() => {
    if (depoKod !== undefined && depoKod !== seciliDepo) setSeciliDepo(depoKod ?? '')
  }, [depoKod])

  const depoSecenekleri = useMemo(() => {
    const depolar = new Map<string, string>()
    for (const d of data) if (d.depoKod) depolar.set(d.depoKod, d.depoAd ?? d.depoKod)
    return [{ value: '', label: 'Tüm Depolar' }, ...[...depolar.entries()].map(([v, a]) => ({ value: v, label: `${v} ${a}` }))]
  }, [data])

  const filtreliData = useMemo(() => (seciliDepo ? data.filter((d) => d.depoKod === seciliDepo) : data), [data, seciliDepo])

  const toplamGiris = useMemo(() => filtreliData.filter((d) => d.yon === 'Giriş').reduce((s, d) => s + d.miktar, 0), [filtreliData])
  const toplamCikis = useMemo(() => filtreliData.filter((d) => d.yon === 'Çıkış').reduce((s, d) => s + d.miktar, 0), [filtreliData])

  const columns = useMemo<ColDef<StokEkstresiSatir>[]>(
    () => [
      {
        headerName: 'Tarih',
        field: 'tarih',
        width: 100,
        valueFormatter: (p) => formatTarih(p.value),
      },
      {
        headerName: 'İşlem Tipi',
        field: 'irsaliyeTipi',
        width: 180,
        valueFormatter: (p) => irsaliyeTipiMap[p.value] || p.value,
      },
      { headerName: 'İrsaliye No', field: 'irsaliyeNo', width: 120 },
      { headerName: 'Depo', field: 'depoKod', width: 80, valueFormatter: (p) => p.value ?? '-' },
      {
        headerName: 'Yön',
        field: 'yon',
        width: 80,
        cellStyle: (p) => (p.value === 'Giriş' ? { color: '#16a34a', fontWeight: 600 } : { color: '#dc2626', fontWeight: 600 }),
      },
      {
        headerName: 'Brüt KG',
        field: 'brutKg',
        width: 90,
        type: 'rightAligned',
        valueFormatter: (p) => (p.value as number) ? (p.value as number).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',
      },
      {
        headerName: 'Net KG',
        field: 'kg',
        width: 90,
        type: 'rightAligned',
        valueFormatter: (p) => (p.value as number) ? (p.value as number).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',
      },
      {
        headerName: 'Brüt MT',
        field: 'brutMt',
        width: 90,
        type: 'rightAligned',
        valueFormatter: (p) => (p.value as number) ? (p.value as number).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',
      },
      {
        headerName: 'Net MT',
        field: 'mt',
        width: 90,
        type: 'rightAligned',
        valueFormatter: (p) => (p.value as number) ? (p.value as number).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',
      },
      {
        headerName: 'Adet',
        field: 'adet',
        width: 70,
        type: 'rightAligned',
        valueFormatter: (p) => (p.value as number) ? String(p.value) : '-',
      },
      {
        headerName: 'Birim Fiyat',
        field: 'birimFiyat',
        width: 100,
        type: 'rightAligned',
        valueFormatter: (p) => (p.value as number).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      },
      {
        headerName: 'Tutar',
        field: 'satirTutari',
        width: 110,
        type: 'rightAligned',
        valueFormatter: (p) => (p.value as number).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      },
      { headerName: 'Cari', field: 'cariAd', width: 150, valueFormatter: (p) => p.value ?? '-' },
      { headerName: 'Açıklama', field: 'aciklama', flex: 1, minWidth: 120, valueFormatter: (p) => p.value ?? '-' },
    ],
    [],
  )

  return (
    <div className="!p-3 !h-full !flex !flex-col">
      <div className="!flex !items-center !justify-between !mb-3 !flex-shrink-0">
        <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
          Ekstre — {malzemeKod}{seciliDepo ? ` (${seciliDepo})` : ''}
        </div>
        <div className="!flex !items-center !gap-1.5">
          <span className="!text-[11px] !text-[#16a34a] !font-medium">
            Toplam Giriş: {toplamGiris.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </span>
          <span className="!text-[11px] !text-[#dc2626] !font-medium !ml-2">
            Toplam Çıkış: {toplamCikis.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </span>
          <Select
            value={seciliDepo}
            onChange={setSeciliDepo}
            options={depoSecenekleri}
            className="!w-56 !text-[11px]"
            placeholder="Tüm Depolar"
          />
          <Button size="small" icon={<ReloadOutlined />} onClick={load} className="!text-[11px] !h-7 !ml-2" />
        </div>
      </div>

      <div className="!bg-white !rounded-sm !flex-1 !min-h-0" style={{ minHeight: 300 }}>
          <DataGrid
            loading={loading}
            rowData={filtreliData}
            columnDefs={columns}
            domLayout="normal"
            exportFileName={`stok-ekstresi-${malzemeKod}`}
            storageKey={`stokEkstresi-${malzemeKod}`}
          />
      </div>
    </div>
  )
}
