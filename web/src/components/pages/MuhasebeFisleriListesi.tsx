'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, Select, Spin } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import YeniButonu from '@/components/shared/YeniButonu'
import { muhasebeFisApi, type MuhasebeFis } from '@/lib/muhasebe-fis-api'
import { MUHASEBE_FIS_TIPLERI, muhasebeFisTipiEtiketi } from '@/data/muhasebe-fis-tipleri'

interface Row { key: string; id: number; fisTipi: string; fisTipiAd: string; fisNo: string; fisTarihi: string; belgeNo: string; ozelKod: string; aciklama: string; fasonTipiAd: string }
interface Props { onSelect?: (id: number) => void; onNew?: (fisTipi: string) => void }

const fmtTarih = (d: string | null) => { if (!d) return '-'; const dt = new Date(d); return isNaN(dt.getTime()) ? '-' : dt.toLocaleDateString('tr-TR') }

export default function MuhasebeFisleriListesi({ onSelect, onNew }: Props) {
  const [data, setData] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [yeniTip, setYeniTip] = useState('1')

  const load = async () => {
    setLoading(true)
    try {
      const list = await muhasebeFisApi.list()
      setData(list.map((f: MuhasebeFis) => ({
        key: String(f.id), id: f.id, fisTipi: f.fisTipi, fisTipiAd: muhasebeFisTipiEtiketi(f.fisTipi),
        fisNo: String(f.fisNo).padStart(8, '0'), fisTarihi: fmtTarih(f.fisTarihi),
        belgeNo: f.belgeNo ?? '', ozelKod: f.ozelKod ?? '', aciklama: f.aciklama ?? '', fasonTipiAd: f.fasonTipi?.ad ?? '',
      })))
    } catch { setData([]) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const columns = useMemo<ColDef<Row>[]>(() => [
    { headerName: 'Fiş Tipi', field: 'fisTipiAd', width: 150 },
    { headerName: 'Fiş No', field: 'fisNo', width: 110, cellStyle: { color: '#f57c00', fontWeight: 500 } },
    { headerName: 'Fiş Tarihi', field: 'fisTarihi', width: 110 },
    { headerName: 'Belge No', field: 'belgeNo', width: 130 },
    { headerName: 'Özel Kod', field: 'ozelKod', width: 120 },
    { headerName: 'Fiş Alt Tipi', field: 'fasonTipiAd', width: 140 },
    { headerName: 'Açıklama', field: 'aciklama', flex: 1, minWidth: 180 },
  ], [])

  return (
    <div className="!p-3 !h-full !flex !flex-col">
      <div className="!flex !items-center !justify-between !mb-3 !flex-shrink-0">
        <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">Muhasebe Fişleri</div>
        <div className="!flex !items-center !gap-1.5">
          <Button size="small" icon={<ReloadOutlined />} onClick={load} className="!text-[11px] !h-7" />
          <YeniButonu onClick={() => onNew?.(yeniTip)} className="!text-[11px] !h-7" />
        </div>
      </div>
      <div className="!bg-white !rounded-sm !flex-1 !min-h-0 !flex !flex-col" style={{ minHeight: 300 }}>
        <div className="!flex-1 !min-h-0">
          <Spin spinning={loading} classNames={{ root: '!h-full [&_.ant-spin-container]:!h-full' }}>
            <DataGrid rowData={data} columnDefs={columns} domLayout="normal" exportFileName="muhasebe-fisleri"
              rowSelection="single" onRowDoubleClicked={(e) => e.data && onSelect?.(e.data.id)} />
          </Spin>
        </div>
        <div className="!border-t !border-gray-200 !px-3 !py-2 !flex !items-center !justify-between !bg-[#fafafa] !flex-shrink-0">
          <div className="!flex !items-center !gap-2">
            <span className="!text-[11px] !text-[#9ca3af]">Yeni Fiş Türü:</span>
            <Select
              size="small"
              value={yeniTip}
              onChange={setYeniTip}
              className="!w-56 !text-[12px]"
              options={MUHASEBE_FIS_TIPLERI.map(t => ({ value: t.deger, label: `${t.deger}-${t.ad}` }))}
            />
          </div>
          <span className="!text-[11px] !text-[#9ca3af] !tabular-nums">{data.length} kayıt</span>
        </div>
      </div>
    </div>
  )
}
