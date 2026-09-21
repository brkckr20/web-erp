'use client'

import { DatePicker, Button, Spin } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect, useMemo, useCallback } from 'react'
import type { ColDef } from 'ag-grid-community'
import dayjs from 'dayjs'
import DataGrid from '@/components/shared/DataGrid'
import { dovizApi, type DovizKuruSatir } from '@/lib/doviz-api'

interface KurRow {
  key: string
  dovizKodu: string
  dovizAd: string
  alisKuru: number | null
  satisKuru: number | null
  efektifAlis: number | null
  efektifSatis: number | null
}

const formatKur = (v: number | null) => {
  if (v == null) return '-'
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(v)
}

export default function DovizKurlari() {
  const [tarih, setTarih] = useState<string>(dayjs().format('YYYY-MM-DD'))
  const [data, setData] = useState<KurRow[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (t: string) => {
    setLoading(true)
    try {
      const list = await dovizApi.getKurlar(t)
      setData(
        list.map((r: DovizKuruSatir) => ({
          key: r.dovizKodu,
          dovizKodu: r.dovizKodu,
          dovizAd: r.dovizAd,
          alisKuru: r.alisKuru,
          satisKuru: r.satisKuru,
          efektifAlis: r.efektifAlis,
          efektifSatis: r.efektifSatis,
        })),
      )
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(tarih)
  }, [tarih, load])

  const columns = useMemo<ColDef<KurRow>[]>(
    () => [
      {
        headerName: 'Döviz Kodu',
        field: 'dovizKodu',
        width: 110,
        cellStyle: { color: '#f57c00', fontWeight: 500 },
      },
      { headerName: 'Döviz', field: 'dovizAd', flex: 1, minWidth: 150 },
      { headerName: 'Alış', field: 'alisKuru', width: 110, type: 'rightAligned', valueFormatter: (p) => formatKur(p.value) },
      { headerName: 'Satış', field: 'satisKuru', width: 110, type: 'rightAligned', valueFormatter: (p) => formatKur(p.value) },
      { headerName: 'Efektif Alış', field: 'efektifAlis', width: 120, type: 'rightAligned', valueFormatter: (p) => formatKur(p.value) },
      { headerName: 'Efektif Satış', field: 'efektifSatis', width: 120, type: 'rightAligned', valueFormatter: (p) => formatKur(p.value) },
    ],
    [],
  )

  return (
    <div className="!p-3 !h-full !flex !flex-col">
      <div className="!flex !items-center !justify-between !mb-3 !flex-shrink-0">
        <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
          Döviz Kurları
        </div>
        <div className="!flex !items-center !gap-1.5">
          <DatePicker
            size="small"
            value={dayjs(tarih)}
            onChange={(d) => {
              if (d) setTarih(d.format('YYYY-MM-DD'))
            }}
            className="!text-[11px]"
          />
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => load(tarih)}
            className="!text-[11px] !h-7"
          />
        </div>
      </div>

      <div className="!bg-white !rounded-sm !flex-1 !min-h-0" style={{ minHeight: 300 }}>
        <Spin spinning={loading} classNames={{ root: '!h-full [&_.ant-spin-container]:!h-full' }}>
          <DataGrid
            rowData={data}
            columnDefs={columns}
            domLayout="normal"
            exportFileName="doviz-kurlari"
          />
        </Spin>
      </div>
    </div>
  )
}