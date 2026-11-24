'use client'

import { Button, Spin } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect, useMemo } from 'react'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import YeniButonu from '@/components/shared/YeniButonu'
import { muhasebeHesapApi, type MuhasebeHesap } from '@/lib/muhasebe-hesap-api'

const HESAP_TIPI_LABEL: Record<string, string> = {
  PARASAL: 'Parasal',
  PARASAL_OLMAYAN_BORC: 'Parasal Olmayan Borç',
  PARASAL_OLMAYAN_ALACAK: 'Parasal Olmayan Alacak',
}
const HESAP_TURU_LABEL: Record<string, string> = {
  BORC_ALACAK: 'Borç + Alacak',
  BORC: 'Borç',
  ALACAK: 'Alacak',
}

interface Row { key: string; id: number; kod: string; ad: string; erisimKodu: string | null; ozelKod: string | null; hesapTipi: string; hesapTuru: string; aciklama: string | null }
interface Props { onSelect?: (id: number) => void; onNew?: () => void }

export default function HesapPlaniListesi({ onSelect, onNew }: Props) {
  const [data, setData] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const list = await muhasebeHesapApi.list()
      setData(list.map((m: MuhasebeHesap) => ({
        key: String(m.id), id: m.id, kod: m.kod, ad: m.ad,
        erisimKodu: m.erisimKodu, ozelKod: m.ozelKod,
        hesapTipi: HESAP_TIPI_LABEL[m.hesapTipi] ?? m.hesapTipi,
        hesapTuru: HESAP_TURU_LABEL[m.hesapTuru] ?? m.hesapTuru,
        aciklama: m.aciklama,
      })))
    } catch { setData([]) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const columns = useMemo<ColDef<Row>[]>(() => [
    { headerName: 'Kodu', field: 'kod', width: 130, cellStyle: { color: '#f57c00', fontWeight: 500 } },
    { headerName: 'Adı', field: 'ad', flex: 1, minWidth: 180 },
    { headerName: 'Hesap Tipi', field: 'hesapTipi', width: 170 },
    { headerName: 'Hesap Türü', field: 'hesapTuru', width: 130 },
    { headerName: 'Erişim Kodu', field: 'erisimKodu', width: 120 },
    { headerName: 'Özel Kod', field: 'ozelKod', width: 120 },
    { headerName: 'Açıklama', field: 'aciklama', flex: 1, minWidth: 160 },
  ], [])

  return (
    <div className="!p-3 !h-full !flex !flex-col">
      <div className="!flex !items-center !justify-between !mb-3 !flex-shrink-0">
        <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">Hesap Planı</div>
        <div className="!flex !items-center !gap-1.5">
          <Button size="small" icon={<ReloadOutlined />} onClick={load} className="!text-[11px] !h-7" />
          <YeniButonu onClick={onNew} className="!text-[11px] !h-7" />
        </div>
      </div>
      <div className="!bg-white !rounded-sm !flex-1 !min-h-0" style={{ minHeight: 300 }}>
        <Spin spinning={loading} classNames={{ root: '!h-full [&_.ant-spin-container]:!h-full' }}>
          <DataGrid rowData={data} columnDefs={columns} domLayout="normal" exportFileName="hesap-plani"
            rowSelection="single" onRowDoubleClicked={(e) => e.data && onSelect?.(e.data.id)} />
        </Spin>
      </div>
    </div>
  )
}
