'use client'

import { Input, Select, Button, Dropdown, Spin, App } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { useState, useEffect, useMemo } from 'react'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import YeniButonu, { useYeniYetkisi } from '@/components/shared/YeniButonu'
import { cariHesapFisApi, type CariHesapFis } from '@/lib/cari-hesap-fis-api'
import { fisTipiEtiketi, fisTipiSecenekleri, DESTEKLENMEYEN_FIS_TIPLERI } from '@/data/cari-hesap-fis-tipleri'

const formatTarih = (d: string | null) => {
  if (!d) return '-'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '-'
  return dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

interface FisRow {
  key: string
  id: number
  fisTipi: string
  fisNo: number
  fisTarihi: string
  belgeNo: string
  kontrol: string
}

interface CariHesapFisleriListesiProps {
  onSelect?: (id: number) => void
  onNew?: (fisTipi: string) => void
}

export default function CariHesapFisleriListesi({ onSelect, onNew }: CariHesapFisleriListesiProps) {
  const yeniIzinli = useYeniYetkisi().izinli
  const { message } = App.useApp()
  const [arama, setArama] = useState('')
  const [yeniFisTipi, setYeniFisTipi] = useState('3')
  const [data, setData] = useState<FisRow[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRow, setSelectedRow] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    cariHesapFisApi
      .list()
      .then((list) =>
        setData(
          list.map((f: CariHesapFis) => ({
            key: String(f.id),
            id: f.id,
            fisTipi: f.fisTipi,
            fisNo: f.fisNo,
            fisTarihi: formatTarih(f.fisTarihi),
            belgeNo: f.belgeNo ?? '',
            kontrol: Array.from(
              new Set((f.hareketler ?? []).map((h) => h.kontrol).filter((v): v is string => !!v)),
            ).join(', '),
          })),
        ),
      )
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const yeni = () => {
    if (DESTEKLENMEYEN_FIS_TIPLERI.has(yeniFisTipi)) {
      message.warning('Bu fiş tipi henüz desteklenmiyor')
      return
    }
    onNew?.(yeniFisTipi)
  }

  const filtered = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase('tr-TR')
    if (!q) return data
    return data.filter(
      (r) =>
        String(r.fisNo).includes(q) ||
        r.belgeNo.toLocaleLowerCase('tr-TR').includes(q) ||
        r.kontrol.toLocaleLowerCase('tr-TR').includes(q) ||
        `${fisTipiEtiketi(r.fisTipi)} ${r.fisTipi}`.toLocaleLowerCase('tr-TR').includes(q),
    )
  }, [arama, data])

  const contextMenuItems: MenuProps['items'] = [
    { key: 'yeni', label: 'Yeni', icon: <PlusOutlined />, disabled: !yeniIzinli, onClick: yeni },
    {
      key: 'duzenle',
      label: 'Düzenle',
      disabled: !selectedRow,
      onClick: () => {
        const r = data.find((d) => d.key === selectedRow)
        if (r) onSelect?.(r.id)
      },
    },
  ]

  const columns = useMemo<ColDef<FisRow>[]>(
    () => [
      {
        headerName: 'Fiş Tipi',
        field: 'fisTipi',
        width: 200,
        valueFormatter: (p) => `${p.value}-${fisTipiEtiketi(p.value as string)}`,
      },
    {
      headerName: 'Fiş Numarası',
      field: 'fisNo',
      width: 130,
      cellClass: '!text-[#f57c00] !font-medium',
      valueFormatter: (p) => (p.value == null ? '-' : String(p.value).padStart(8, '0')),
    },
      { headerName: 'Fiş Tarihi', field: 'fisTarihi', width: 110 },
      { headerName: 'Belge No', field: 'belgeNo', flex: 1, minWidth: 140 },
      { headerName: 'Kontrol', field: 'kontrol', width: 160 },
    ],
    [],
  )

  return (
    <Dropdown menu={{ items: contextMenuItems }} trigger={['contextMenu']}>
      <div className="!p-3 !h-full !flex !flex-col">
        <div className="!flex !items-center !justify-between !mb-3 !flex-shrink-0">
          <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
            Cari Hesap Fişleri
          </div>
          <div className="!flex !items-center !gap-1.5">
            <Input
              size="small"
              placeholder="Ara..."
              allowClear
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              prefix={<SearchOutlined style={{ fontSize: 12, color: '#9ca3af' }} />}
              className="!w-52 !text-[12px]"
            />
            <Button size="small" icon={<ReloadOutlined />} onClick={load} className="!text-[12px] !h-7" />
            <YeniButonu onClick={yeni} className="!text-[12px] !h-7" />
          </div>
        </div>

        <div className="!flex-1 !min-h-0" style={{ minHeight: 300 }}>
          <div className="!bg-white !rounded-sm !h-full !flex !flex-col">
            <div className="!flex-1 !min-h-0" style={{ minHeight: 250 }}>
              <Spin spinning={loading} classNames={{ root: '!h-full [&_.ant-spin-container]:!h-full' }}>
                <DataGrid
                  rowData={filtered}
                  columnDefs={columns}
                  domLayout="normal"
                  exportFileName="cari-hesap-fisleri"
                  storageKey="cariHesapFisleri"
                  rowSelection="single"
                  onSelectionChanged={(e) => {
                    const sel = e.api.getSelectedRows()
                    setSelectedRow(sel[0]?.key ?? null)
                  }}
                  onRowDoubleClicked={(e) => e.data && onSelect?.(e.data.id)}
                />
              </Spin>
            </div>

            <div className="!border-t !border-gray-200 !px-3 !py-2 !flex !items-center !justify-between !bg-[#fafafa] !flex-shrink-0">
              <div className="!flex !items-center !gap-2">
                <span className="!text-[11px] !text-[#9ca3af]">Yeni Fiş Tipi:</span>
                <Select
                  size="small"
                  value={yeniFisTipi}
                  onChange={setYeniFisTipi}
                  className="!w-64 !text-[12px]"
                  options={fisTipiSecenekleri()}
                />
              </div>
              <span className="!text-[11px] !text-[#9ca3af] !tabular-nums">{filtered.length} kayıt</span>
            </div>
          </div>
        </div>
      </div>
    </Dropdown>
  )
}
