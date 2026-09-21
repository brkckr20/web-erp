'use client'

import { Dropdown, Button } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect, useMemo, useCallback } from 'react'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { malzemeApi, type Malzeme } from '@/lib/malzeme-api'
import { parametreApi } from '@/lib/parametre-api'
import { useAuth } from '@/context/AuthContext'

interface ModelRow {
  key: string
  id: number
  kod: string
  ad: string
  kategori: string | null
  sezon: string | null
  marka: string | null
  model: string | null
  cariKodu: string | null
  cariAdi: string | null
  musteriTemsilcisi: string | null
  kayitZamani: Date | null
  kullanimda: boolean
}

interface ModelListesiProps {
  onSelect?: (kod: string) => void
  onNew?: () => void
}

export default function ModelListesi({ onSelect, onNew }: ModelListesiProps) {
  const { kullanici } = useAuth()
  const [data, setData] = useState<ModelRow[]>([])
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [list, kendiParam] = await Promise.all([
        malzemeApi.list(5),
        parametreApi.get('siparis', 'kendiModelKartlari').then((p) => p.deger === 'true').catch(() => false),
      ])
      const kayitYapan = kullanici ? `${kullanici.kod} - ${kullanici.ad}` : null
      let rows = list.map((m: Malzeme) => ({
        key: String(m.id),
        id: m.id,
        kod: m.kod,
        ad: m.ad,
        kategori: m.kategori ?? null,
        sezon: m.sezon ?? null,
        marka: m.marka ?? null,
        model: m.model ?? null,
        cariKodu: m.ureticiFirmaKodu ?? null,
        cariAdi: m.cariAdi ?? null,
        musteriTemsilcisi: m.musteriTemsilcisi ?? null,
        kayitZamani: m.createdAt ? new Date(m.createdAt) : null,
        kullanimda: m.kullanimda,
      }))
      if (kendiParam && kayitYapan) {
        rows = rows.filter((r) => r.musteriTemsilcisi === kayitYapan)
      }
      setData(rows)
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [kullanici])

  useEffect(() => {
    load()
  }, [load])

  const contextMenuItems: MenuProps['items'] = [
    { key: 'yeni', label: 'Yeni', icon: <PlusOutlined />, onClick: () => onNew?.() },
    { key: 'duzenle', label: 'Düzenle', disabled: !selectedRow, onClick: () => selectedRow && onSelect?.(selectedRow) },
    { type: 'divider' },
    { key: 'pasif', label: 'Pasif Yap', disabled: !selectedRow },
  ]

  const columns = useMemo<ColDef<ModelRow>[]>(
    () => [
      {
        headerName: 'Kodu',
        field: 'kod',
        width: 110,
        cellStyle: { color: '#f57c00', fontWeight: 500 },
      },
      { headerName: 'Adı', field: 'ad', flex: 1, minWidth: 150 },
      { headerName: 'Kategori', field: 'kategori', width: 120 },
      { headerName: 'Sezon', field: 'sezon', width: 100 },
      { headerName: 'Marka', field: 'marka', width: 120 },
      { headerName: 'Model', field: 'model', width: 120 },
      { headerName: 'Cari Kodu', field: 'cariKodu', width: 100 },
      { headerName: 'Cari Adı', field: 'cariAdi', width: 140 },
      { headerName: 'Müşteri Temsilcisi', field: 'musteriTemsilcisi', width: 150 },
      {
        headerName: 'Kayıt Zamanı',
        field: 'kayitZamani',
        width: 130,
        valueFormatter: (p) => {
          if (!p.value) return '-'
          const d = new Date(p.value)
          return isNaN(d.getTime())
            ? '-'
            : d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
                ' ' +
                d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        },
      },
      {
        headerName: 'Durum',
        field: 'kullanimda',
        width: 80,
        valueFormatter: (p) => (p.value ? 'Aktif' : 'Pasif'),
        cellStyle: (p) => (p.value ? { color: '#16a34a' } : { color: '#9ca3af' }),
      },
    ],
    [],
  )

  return (
    <Dropdown menu={{ items: contextMenuItems }} trigger={['contextMenu']}>
      <div className="!p-3 !h-full !flex !flex-col">
        <div className="!flex !items-center !justify-between !mb-3 !flex-shrink-0">
          <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
            Model Kartları Listesi
          </div>
          <div className="!flex !items-center !gap-1.5">
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={load}
              className="!text-[11px] !h-7"
            />
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={onNew}
              className="!text-[11px] !h-7"
            >
              Yeni
            </Button>
          </div>
        </div>

        <div className="!bg-white !rounded-sm !flex-1 !min-h-0" style={{ minHeight: 300 }}>
          <DataGrid
            loading={loading}
            rowData={data}
            columnDefs={columns}
            domLayout="normal"
            exportFileName="model-kartlari"
            rowSelection="single"
            onSelectionChanged={(e) => {
              const sel = e.api.getSelectedRows()
              setSelectedRow(sel[0]?.kod ?? null)
            }}
            onRowDoubleClicked={(e) => e.data && onSelect?.(e.data.kod)}
          />
        </div>
      </div>
    </Dropdown>
  )
}
