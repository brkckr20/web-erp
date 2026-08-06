'use client'

import { Button, Dropdown, Tag, message } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useState, useCallback } from 'react'
import type { ColDef, CellDoubleClickedEvent, CellContextMenuEvent, SelectionChangedEvent } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { ornekFormlar } from './form-tasarimi/mock'
import type { FormTasarimDraft } from './form-tasarimi/types'
import { formSabloniApi, type FormSabloniOzet } from '@/lib/form-sabloni-api'

interface FormRow {
  key: string
  id: string
  ad: string
  ekranTuru: string
  sorguSayisi: number
  bandSayisi: number
}

const ekranTuruEtiket = (v: string) =>
  v.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

interface FormListesiProps {
  onSelect?: (form: FormTasarimDraft) => void
  onNew?: () => void
}

const mockRows = (): FormRow[] =>
  ornekFormlar.map((f) => ({
    key: f.id,
    id: f.id,
    ad: f.ad,
    ekranTuru: f.ekranTuru,
    sorguSayisi: f.sorgular.length,
    bandSayisi: f.layout.length,
  }))

export default function FormListesi({ onSelect, onNew }: FormListesiProps) {
  const [rows, setRows] = useState<FormRow[]>(mockRows)
  const [apiKaynak, setApiKaynak] = useState(false)
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)

  const yukle = useCallback(async (loader = false) => {
    if (loader) setYukleniyor(true)
    try {
      const list = await formSabloniApi.list()
      setRows(list.map((f: FormSabloniOzet) => ({
        key: String(f.id),
        id: String(f.id),
        ad: f.ad,
        ekranTuru: f.ekranTuru,
        sorguSayisi: f.sorguSayisi,
        bandSayisi: f.bandSayisi,
      })))
      setApiKaynak(true)
    } catch {
      setRows(mockRows())
      setApiKaynak(false)
    } finally {
      setYukleniyor(false)
    }
  }, [])

  useEffect(() => {
    yukle()
  }, [yukle])

  const handleDuzenle = (id?: string) => {
    const rowId = id ?? selectedRow
    if (!rowId) return
    if (!apiKaynak) {
      const form = ornekFormlar.find((f) => f.id === rowId)
      if (form) onSelect?.(form)
      return
    }
    const numId = Number(rowId)
    if (Number.isNaN(numId)) return
    formSabloniApi
      .getById(numId)
      .then((d) => {
        onSelect?.({
          id: String(d.id),
          ad: d.ad,
          ekranTuru: d.ekranTuru,
          sorgular: (d.sorgular as FormTasarimDraft['sorgular']) ?? [],
          layout: (d.layout as FormTasarimDraft['layout']) ?? [],
          sayfa: (d.sayfa as FormTasarimDraft['sayfa']) ?? { boyut: 'A4', yon: 'dikey', kenarUst: 10, kenarAlt: 10, kenarSol: 10, kenarSag: 10 },
          sablonId: d.id,
          kod: d.kod,
        })
      })
      .catch(() => message.error('Form şablonu yüklenemedi'))
  }

  const contextMenuItems: MenuProps['items'] = [
    { key: 'yeni', label: 'Yeni', icon: <PlusOutlined />, onClick: () => onNew?.() },
    { key: 'duzenle', label: 'Düzenle', disabled: !selectedRow, onClick: () => handleDuzenle() },
  ]

  const columns = useMemo<ColDef<FormRow>[]>(() => [
    {
      headerName: 'Form Adı', field: 'ad', flex: 1, minWidth: 160, resizable: true,
      cellClass: '!text-[#f57c00] !font-medium',
    },
    {
      headerName: 'Ekran Türü', field: 'ekranTuru', width: 200, resizable: true,
      cellRenderer: (p: { value: string }) => <Tag color="blue" className="!text-[11px]">{ekranTuruEtiket(p.value)}</Tag>,
    },
    {
      headerName: 'Sorgu Sayısı', field: 'sorguSayisi', width: 110, resizable: true,
      type: 'rightAligned',
    },
    {
      headerName: 'Band Sayısı', field: 'bandSayisi', width: 100, resizable: true,
      type: 'rightAligned',
    },
  ], [])

  return (
    <Dropdown menu={{ items: contextMenuItems }} trigger={['contextMenu']}>
      <div className="!p-3 !flex !flex-col !h-full">
        <div className="!flex !items-center !justify-between !mb-3">
          <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
            Form Tasarımları
          </div>
          <div className="!flex !items-center !gap-1.5">
            <Button
              size="small"
              icon={<ReloadOutlined />}
              loading={yukleniyor}
              onClick={() => yukle(true)}
              className="!text-[12px] !h-7"
            />
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={onNew}
              className="!text-[12px] !h-7"
            >
              Yeni
            </Button>
          </div>
        </div>

        <div className="!flex-1 !min-h-0" style={{ minHeight: 300 }}>
          <div className="!bg-white !rounded-sm !h-full !flex !flex-col">
            <div className="!flex-1 !min-h-0" style={{ minHeight: 250 }}>
              <DataGrid
                rowData={rows}
                columnDefs={columns}
                domLayout="normal"
                exportFileName="form-tasarimlari"
                storageKey="formTasarim"
                rowSelection="single"
                onCellDoubleClicked={(e: CellDoubleClickedEvent<FormRow>) => {
                  const row = e.data as FormRow | undefined
                  if (row) {
                    setSelectedRow(row.key)
                    handleDuzenle(row.key)
                  }
                }}
                onCellContextMenu={(e: CellContextMenuEvent<FormRow>) => {
                  const row = e.data as FormRow | undefined
                  if (row?.key) {
                    e.node?.setSelected(true)
                    setSelectedRow(row.key)
                  }
                }}
                onSelectionChanged={(e: SelectionChangedEvent<FormRow>) => {
                  const sel = e.api.getSelectedRows()
                  setSelectedRow(sel[0]?.key ?? null)
                }}
              />
            </div>

            <div className="!border-t !border-gray-200 !px-3 !py-2 !flex !items-center !justify-between !bg-[#fafafa] !flex-shrink-0">
              <span className="!text-[10px] !text-[#d97706] !tabular-nums">
                {apiKaynak ? 'Backend' : 'Demo'}
              </span>
              <span className="!text-[11px] !text-[#9ca3af] !tabular-nums">{rows.length} kayıt</span>
            </div>
          </div>
        </div>
      </div>
    </Dropdown>
  )
}
