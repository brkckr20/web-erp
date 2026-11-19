'use client'

import { Button, App, Select } from 'antd'
import { ReloadOutlined, FileTextOutlined } from '@ant-design/icons'
import { useState, useEffect, useMemo } from 'react'
import type { ColDef, CellContextMenuEvent } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import SagTikMenu from '@/components/shared/SagTikMenu'
import { stokEkstresiApi, type StokEkstresiSatir } from '@/lib/stok-ekstresi-api'

interface MalzemeStokEkstresiProps {
  malzemeKod: string
  depoKod?: string | null
  onFisAc?: (info: { id: number; irsaliyeTipi: string; irsaliyeNo: string }) => void
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
  '10': '10-Üretim Fişi',
  '11': '11-Fasondan Giriş İrsaliyesi',
  '12': '12-Fason Çıkış İade İrsaliyesi',
  '16': '16-Sayım Fişi',
  '17': '17-Depo Transfer Giriş',
  '18': '18-Özel Fiş (Giriş)',
  '20': '20-Karma Koli Üretim',
  '21': '21-Karma Koli Sarf Bozma',
  '22': '22-Alınan Hizmet İrsaliyesi',
  '23': '23-Verilen Hizmet İadesi',
  '40': '40-Üretimden İade',
  '92': '92-Serbest Meslek Makbuzu',
  '99': '99-Sayım Farkı Noksanı',
  '101': '101-Sayım Farkı Fazlası',
  '120': '120-Toptan Satış İrsaliyesi',
  '121': '121-Perakende Satır İrsaliyesi',
  '122': '122-Mal Alım İade İrsaliyesi',
  '123': '123-Konsinye Çıkış İrsaliyesi',
  '124': '124-Konsinye Giriş İade İrsaliyesi',
  '125': '125-Fason Giriş İrsaliyesi',
  '126': '126-Verilen Fiyat Farkı İrsaliyesi',
  '130': '130-Sarf Fişi',
  '131': '131-Fire Fişi',
  '132': '132-Özel Fiş (Çıkış)',
  '133': '133-Fasona Giriş İade İrsaliyesi',
  '134': '134-Fasona Çıkış İrsaliyesi',
  '135': '135-Transfer Çıkış',
  '136': '136-Karma Koli Sarf',
  '137': '137-Karma Koli Bozma',
  '138': '138-Verilen Hizmet İrsaliyesi',
  '139': '139-Alınan Hizmet İadesi',
  '140': '140-Üretime Çıkış Fişi',
  '192': '192-Serbest Meslek Makbuzu',
  '201': '201-Satın Alma Siparişi',
}

export default function MalzemeStokEkstresi({ malzemeKod, depoKod, onFisAc }: MalzemeStokEkstresiProps) {
  const [data, setData] = useState<StokEkstresiSatir[]>([])
  const [loading, setLoading] = useState(false)
  const [seciliDepo, setSeciliDepo] = useState<string>('')
  const [sagTik, setSagTik] = useState<{ x: number; y: number; satir: StokEkstresiSatir } | null>(null)
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
        headerName: 'Barkod',
        field: 'barkodSayisi',
        width: 80,
        type: 'rightAligned',
        valueFormatter: (p) => ((p.value as number) > 0 ? String(p.value) : '-'),
      },
      {
        headerName: 'Birim Fiyat',
        field: 'birimFiyat',
        width: 100,
        type: 'rightAligned',
        valueFormatter: (p) =>
          p.value == null
            ? '-'
            : (p.value as number).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
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

      <div
        className="!bg-white !rounded-sm !flex-1 !min-h-0"
        style={{ minHeight: 300 }}
        onContextMenu={(e) => e.preventDefault()}
      >
          <DataGrid
            loading={loading}
            rowData={filtreliData}
            columnDefs={columns}
            domLayout="normal"
            exportFileName={`stok-ekstresi-${malzemeKod}`}
            storageKey={`stokEkstresi-${malzemeKod}`}
            onCellContextMenu={(e: CellContextMenuEvent<StokEkstresiSatir>) => {
              const ev = e.event as MouseEvent | undefined
              if (!e.data) return
              setSagTik({ x: ev?.clientX ?? 0, y: ev?.clientY ?? 0, satir: e.data })
            }}
          />
      </div>

      {sagTik && (
        <SagTikMenu
          position={sagTik}
          items={[
            {
              key: 'fis-goruntule',
              label: 'Fişi Görüntüle',
              icon: <FileTextOutlined />,
              onClick: () => {
                onFisAc?.({ id: sagTik.satir.irsaliyeId, irsaliyeTipi: sagTik.satir.irsaliyeTipi, irsaliyeNo: sagTik.satir.irsaliyeNo })
                setSagTik(null)
              },
            },
          ]}
          onClose={() => setSagTik(null)}
        />
      )}
    </div>
  )
}
