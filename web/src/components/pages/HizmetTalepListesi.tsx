'use client'

import { useState, useEffect, useMemo } from 'react'
import { Input, Button, Tag, App } from 'antd'
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColDef, CellDoubleClickedEvent } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { hizmetTalepApi, type HizmetTalep } from '@/lib/hizmet-talep-api'
import { kullaniciApi, type Kullanici } from '@/lib/kullanici-api'

interface HizmetTalepRow {
  key: string
  id: number
  tarih: string
  kullanici: string
  baslik: string
  aciklama: string
  durum: string
  oncelik: string
  gorusmeKisi: string
  kapanis: string
  notSayisi: number
}

const formatKapanis = (d: string | null) => {
  if (!d) return 'Kapanmadı'
  const dt = new Date(d)
  if (isNaN(dt.getTime()) || dt.getFullYear() <= 1900) return 'Kapanmadı'
  return dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatTarih = (d: string | null) => {
  if (!d) return '-'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '-'
  return dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const durumRenk: Record<string, string> = {
  'Açık': 'blue',
  'Devam Ediyor': 'orange',
  'Tamamlandı': 'green',
  'İptal': 'red',
}

const oncelikRenk: Record<string, string> = {
  'Acil': 'red',
  'Normal': 'blue',
  'Düşük': 'default',
}

interface Props {
  onOpen: (id?: number) => void
}

export default function HizmetTalepListesi({ onOpen }: Props) {
  const { message } = App.useApp()
  const [list, setList] = useState<HizmetTalep[]>([])
  const [loading, setLoading] = useState(true)
  const [arama, setArama] = useState('')
  const [kullanicilar, setKullanicilar] = useState<Kullanici[]>([])

  const yukle = async () => {
    setLoading(true)
    try {
      const [data, kData] = await Promise.all([hizmetTalepApi.list(), kullaniciApi.list()])
      setList(data)
      setKullanicilar(kData)
    } catch {
      message.error('Liste yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { yukle() }, [])

  const kullaniciAdMap = useMemo(() => {
    const map: Record<string, string> = {}
    kullanicilar.forEach((k) => { map[k.kod] = k.ad })
    return map
  }, [kullanicilar])

  const rows = useMemo<HizmetTalepRow[]>(() => {
    return list
      .filter((t) => {
        if (!arama) return true
        const a = arama.toLowerCase()
        return (
          t.baslik.toLowerCase().includes(a) ||
          (t.gorusmeKisi ?? '').toLowerCase().includes(a) ||
          (t.aciklama ?? '').toLowerCase().includes(a)
        )
      })
      .map((t) => ({
        key: String(t.id),
        id: t.id,
        tarih: formatTarih(t.tarih),
        kullanici: kullaniciAdMap[t.kullanici ?? ''] ?? t.kullanici ?? '-',
        baslik: t.baslik,
        aciklama: t.aciklama ?? '-',
        durum: t.durum,
        oncelik: t.oncelik,
        gorusmeKisi: t.gorusmeKisi ?? '-',
        kapanis: formatKapanis(t.kapanisTarihi ?? null),
        notSayisi: (t.notlar ?? []).length,
      }))
  }, [list, arama])

  const columns = useMemo<ColDef<HizmetTalepRow>[]>(
    () => [
      { headerName: 'Tarih', field: 'tarih', width: 100 },
      { headerName: 'Kullanıcı', field: 'kullanici', width: 120 },
      { headerName: 'Başlık', field: 'baslik', flex: 2, minWidth: 150 },
      { headerName: 'Açıklama', field: 'aciklama', flex: 1, minWidth: 150 },
      {
        headerName: 'Durum',
        field: 'durum',
        width: 120,
        cellRenderer: (p: any) => <Tag color={durumRenk[p.value] ?? 'default'}>{p.value}</Tag>,
      },
      {
        headerName: 'Öncelik',
        field: 'oncelik',
        width: 100,
        cellRenderer: (p: any) => <Tag color={oncelikRenk[p.value] ?? 'default'}>{p.value}</Tag>,
      },
      { headerName: 'İletişim Kişisi', field: 'gorusmeKisi', width: 130 },
      { headerName: 'Kapanış', field: 'kapanis', width: 100 },
      { headerName: 'Not Sayısı', field: 'notSayisi', width: 90, type: 'rightAligned' },
    ],
    [],
  )

  const onDoubleClicked = (e: CellDoubleClickedEvent<HizmetTalepRow>) => {
    if (e.data) onOpen(e.data.id)
  }

  return (
    <div className="!p-3 !h-full !flex !flex-col">
      <div className="!flex !items-center !justify-between !mb-3 !flex-shrink-0">
        <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
          Hizmet Talepleri
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
          storageKey="hizmetTalepListesi"
          onCellDoubleClicked={onDoubleClicked}
          rowSelection="single"
        />
      </div>
    </div>
  )
}
