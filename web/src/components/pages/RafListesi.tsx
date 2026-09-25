'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dropdown, Button, Spin, Select, Input, App } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { depoRafApi, type DepoRaf } from '@/lib/depo-raf-api'
import { depoApi, type Depo } from '@/lib/depo-api'

interface RafRow {
  key: string
  id: number
  depoId: number
  depoKodu: string
  depoAdi: string
  kod: string
  ad: string
  kat: number | null
  rafTipi: string | null
  kapasite: number | null
  kapasiteBirimi: string | null
  aktif: boolean
  sira: number
}

interface RafListesiProps {
  onSelect?: (id: number) => void
  onNew?: () => void
}

export default function RafListesi({ onSelect, onNew }: RafListesiProps) {
  const { message } = App.useApp()
  const [data, setData] = useState<RafRow[]>([])
  const [depolar, setDepolar] = useState<Depo[]>([])
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [depoFiltre, setDepoFiltre] = useState<number | undefined>(undefined)
  const [aktifFiltre, setAktifFiltre] = useState<string | undefined>(undefined)
  const [arama, setArama] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const list = await depoRafApi.list({ depoId: depoFiltre, aktif: aktifFiltre })
      setData(
        list.map((r: DepoRaf) => ({
          key: String(r.id),
          id: r.id,
          depoId: r.depoId,
          depoKodu: r.depo.kod,
          depoAdi: r.depo.ad,
          kod: r.kod,
          ad: r.ad,
          kat: r.kat,
          rafTipi: r.rafTipi,
          kapasite: r.kapasite,
          kapasiteBirimi: r.kapasiteBirimi,
          aktif: r.aktif,
          sira: r.sira,
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
  }, [depoFiltre, aktifFiltre])

  useEffect(() => {
    const yukle = async () => {
      try {
        setDepolar(await depoApi.list())
      } catch {
        message.warning('Depo listesi yüklenemedi')
      }
    }
    yukle()
  }, [message])

  const filtreli = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase('tr-TR')
    if (!q) return data
    return data.filter((r) =>
      [r.kod, r.ad, r.depoKodu, r.depoAdi, r.rafTipi].filter(Boolean).some((alan) =>
        String(alan).toLocaleLowerCase('tr-TR').includes(q),
      ),
    )
  }, [data, arama])

  const columns = useMemo<ColDef<RafRow>[]>(
    () => [
      { headerName: 'Depo Kodu', field: 'depoKodu', width: 110, cellStyle: { color: '#f57c00', fontWeight: 500 } },
      { headerName: 'Depo Adı', field: 'depoAdi', width: 160 },
      { headerName: 'Raf Kodu', field: 'kod', width: 120, cellStyle: { color: '#f57c00', fontWeight: 500 } },
      { headerName: 'Raf Adı', field: 'ad', flex: 1, minWidth: 160 },
      { headerName: 'Kat', field: 'kat', width: 80, valueFormatter: (p) => p.value ?? '-' },
      { headerName: 'Raf Tipi', field: 'rafTipi', width: 120, valueFormatter: (p) => p.value ?? '-' },
      {
        headerName: 'Kapasite',
        field: 'kapasite',
        width: 120,
        valueFormatter: (p) => (p.value == null ? '-' : `${p.value} ${p.data?.kapasiteBirimi ?? ''}`.trim()),
      },
      { headerName: 'Sıra', field: 'sira', width: 80 },
      {
        headerName: 'Durum',
        field: 'aktif',
        width: 100,
        valueFormatter: (p) => (p.value ? 'Aktif' : 'Pasif'),
        cellStyle: (p) => (p.value ? { color: '#16a34a' } : { color: '#9ca3af' }),
      },
    ],
    [],
  )

  const contextMenuItems: MenuProps['items'] = [
    { key: 'yeni', label: 'Yeni', icon: <PlusOutlined />, onClick: () => onNew?.() },
    {
      key: 'duzenle',
      label: 'Düzenle',
      disabled: !selectedRow,
      onClick: () => selectedRow && onSelect?.(selectedRow),
    },
  ]

  return (
    <Dropdown menu={{ items: contextMenuItems }} trigger={['contextMenu']}>
      <div className="!p-3 !h-full !flex !flex-col">
        <div className="!flex !items-center !justify-between !mb-3 !flex-shrink-0">
          <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">Raf Tanımları Listesi</div>
          <div className="!flex !items-center !gap-1.5">
            <Select
              size="small"
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Depo"
              value={depoFiltre}
              onChange={(v) => setDepoFiltre(v)}
              className="!w-44 !text-[11px]"
              options={depolar.map((d) => ({ value: d.id, label: `${d.kod} - ${d.ad}` }))}
            />
            <Select
              size="small"
              allowClear
              placeholder="Durum"
              value={aktifFiltre}
              onChange={(v) => setAktifFiltre(v)}
              className="!w-24 !text-[11px]"
              options={[
                { value: 'true', label: 'Aktif' },
                { value: 'false', label: 'Pasif' },
              ]}
            />
            <Input.Search
              size="small"
              allowClear
              placeholder="Ara"
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              className="!w-40"
            />
            <Button size="small" icon={<ReloadOutlined />} onClick={load} className="!text-[11px] !h-7" />
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={onNew} className="!text-[11px] !h-7">
              Yeni
            </Button>
          </div>
        </div>

        <div className="!bg-white !rounded-sm !flex-1 !min-h-0" style={{ minHeight: 300 }}>
          <Spin spinning={loading} classNames={{ root: "!h-full [&_.ant-spin-container]:!h-full" }}>
            <DataGrid
              rowData={filtreli}
              columnDefs={columns}
              domLayout="normal"
              exportFileName="raf-tanimlari"
              storageKey="raf-tanimlari"
              rowSelection="single"
              onSelectionChanged={(e) => {
                const sel = e.api.getSelectedRows()
                setSelectedRow(sel[0]?.id ?? null)
              }}
              onRowDoubleClicked={(e) => e.data && onSelect?.(e.data.id)}
            />
          </Spin>
        </div>
      </div>
    </Dropdown>
  )
}
