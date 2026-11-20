'use client'

import { Dropdown, Button, Spin } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect, useMemo } from 'react'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { kasaBankaHesapApi, type KasaBankaHesap, type KasaBankaTipi } from '@/lib/kasa-banka-hesap-api'
import YeniButonu, { useYeniYetkisi } from '@/components/shared/YeniButonu'

interface HesapRow {
  key: string
  id: number
  kod: string
  ad: string
  dovizKodu: string | null
  acilisBakiye: number
  bankaAdi: string | null
  iban: string | null
  kullanimda: boolean
}

interface KasaBankaHesapListesiProps {
  tip: KasaBankaTipi
  onSelect?: (kod: string) => void
  onNew?: () => void
}

const bakiyeYaz = (v: number | string | null) => {
  const n = Number(v ?? 0)
  return isNaN(n)
    ? '-'
    : n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function KasaBankaHesapListesi({ tip, onSelect, onNew }: KasaBankaHesapListesiProps) {
  const yeniIzinli = useYeniYetkisi().izinli
  const [data, setData] = useState<HesapRow[]>([])
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const list = await kasaBankaHesapApi.list(tip)
      setData(
        list.map((d: KasaBankaHesap) => ({
          key: String(d.id),
          id: d.id,
          kod: d.kod,
          ad: d.ad,
          dovizKodu: d.dovizKodu,
          acilisBakiye: Number(d.acilisBakiye) || 0,
          bankaAdi: d.bankaAdi,
          iban: d.iban,
          kullanimda: d.kullanimda,
        })),
      )
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [tip])

  const contextMenuItems: MenuProps['items'] = [
    { key: 'yeni', label: 'Yeni', icon: <PlusOutlined />, disabled: !yeniIzinli, onClick: () => onNew?.() },
    { key: 'duzenle', label: 'Düzenle', disabled: !selectedRow, onClick: () => selectedRow && onSelect?.(selectedRow) },
  ]

  const columns = useMemo<ColDef<HesapRow>[]>(() => {
    const cols: ColDef<HesapRow>[] = [
      {
        headerName: 'Kodu',
        field: 'kod',
        width: 110,
        cellStyle: { color: '#f57c00', fontWeight: 500 },
      },
      { headerName: 'Adı', field: 'ad', flex: 1, minWidth: 160 },
      { headerName: 'Döviz', field: 'dovizKodu', width: 80, valueFormatter: (p) => p.value ?? '-' },
      {
        headerName: 'Açılış Bakiyesi',
        field: 'acilisBakiye',
        width: 140,
        cellStyle: { textAlign: 'right' },
        valueFormatter: (p) => bakiyeYaz(p.value),
      },
    ]
    if (tip === 'banka') {
      cols.push(
        { headerName: 'Banka', field: 'bankaAdi', flex: 1, minWidth: 140, valueFormatter: (p) => p.value ?? '-' },
        { headerName: 'IBAN', field: 'iban', width: 220, valueFormatter: (p) => p.value ?? '-' },
      )
    }
    cols.push({
      headerName: 'Durum',
      field: 'kullanimda',
      width: 100,
      valueFormatter: (p) => (p.value ? 'Aktif' : 'Pasif'),
      cellStyle: (p) => (p.value ? { color: '#16a34a' } : { color: '#9ca3af' }),
    })
    return cols
  }, [tip])

  const ekranAdi = tip === 'kasa' ? 'Kasa Hesapları Listesi' : 'Banka Hesapları Listesi'

  return (
    <Dropdown menu={{ items: contextMenuItems }} trigger={['contextMenu']}>
      <div className="!p-3 !h-full !flex !flex-col">
        <div className="!flex !items-center !justify-between !mb-3 !flex-shrink-0">
          <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
            {ekranAdi}
          </div>
          <div className="!flex !items-center !gap-1.5">
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={load}
              className="!text-[11px] !h-7"
            />
            <YeniButonu onClick={onNew} className="!text-[11px] !h-7" />
          </div>
        </div>

        <div className="!bg-white !rounded-sm !flex-1 !min-h-0" style={{ minHeight: 300 }}>
          <Spin spinning={loading} classNames={{ root: "!h-full [&_.ant-spin-container]:!h-full" }}>
            <DataGrid
              rowData={data}
              columnDefs={columns}
              domLayout="normal"
              exportFileName={tip === 'kasa' ? 'kasa-hesaplari' : 'banka-hesaplari'}
              rowSelection="single"
              onSelectionChanged={(e) => {
                const sel = e.api.getSelectedRows()
                setSelectedRow(sel[0]?.kod ?? null)
              }}
              onRowDoubleClicked={(e) => e.data && onSelect?.(e.data.kod)}
            />
          </Spin>
        </div>
      </div>
    </Dropdown>
  )
}
