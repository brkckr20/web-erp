'use client'

import { useEffect, useMemo, useState } from 'react'
import { Modal, Input, App, Button, Space } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community'
import type { ColDef, GridApi, ICellRendererParams } from 'ag-grid-community'
import { kaliteKontrolApi } from '@/lib/kalite-kontrol-api'
import { agGridLocaleTR } from '@/lib/ag-grid-locale'

ModuleRegistry.registerModules([AllCommunityModule])

const kkTheme = themeQuartz.withParams({
  fontFamily: 'inherit',
  fontSize: 12,
  foregroundColor: '#333',
  headerFontSize: 12,
  headerFontWeight: 600,
  headerTextColor: '#6b7280',
  headerBackgroundColor: '#f9fafb',
  borderColor: '#f0f0f0',
  rowBorder: { style: 'solid', width: 1, color: '#f0f0f0' },
  rowHoverColor: '#fafafa',
  selectedRowBackgroundColor: '#FF9933',
  oddRowBackgroundColor: '#ffffff',
  backgroundColor: '#ffffff',
  cellHorizontalPadding: 10,
})

interface KKSelectRow {
  kkFisId: number
  kkFisNo: string
  kkKalemId: number
  malzemeKod: string
  malzemeAd: string
  kg: number
  mt: number
  adet: number
  barkod: string
  isEmriNo: string | null
}

interface KKSecimModalProps {
  open: boolean
  onClose: () => void
  onSelect: (secimler: KKSelectRow[]) => void
}

export type { KKSelectRow }

export default function KKSecimModal({ open, onClose, onSelect }: KKSecimModalProps) {
  const { message } = App.useApp()
  const [rows, setRows] = useState<KKSelectRow[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [gridApi, setGridApi] = useState<GridApi | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    kaliteKontrolApi
      .stogaAlinmamis()
      .then((list: any[]) => {
        const flat: KKSelectRow[] = []
        for (const fis of list) {
          for (const k of fis.kalemler || []) {
            flat.push({
              kkFisId: fis.id,
              kkFisNo: fis.fisNo,
              kkKalemId: k.id,
              malzemeKod: k.malzeme?.kod ?? '',
              malzemeAd: k.malzeme?.ad ?? '',
              kg: Number(k.netAgirlik) || 0,
              mt: Number(k.netMetre) || 0,
              adet: k.adet || 0,
              barkod: k.barkod ?? '',
              isEmriNo: k.isEmriNo ?? fis.isEmriNo ?? null,
            })
          }
        }
        setRows(flat)
      })
      .catch(() => {
        message.error('KK verileri yüklenemedi')
        setRows([])
      })
      .finally(() => setLoading(false))
  }, [open])

  useEffect(() => {
    if (!open) {
      setSearch('')
      setGridApi(null)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.malzemeKod.toLowerCase().includes(q) ||
        r.malzemeAd.toLowerCase().includes(q) ||
        r.kkFisNo.toLowerCase().includes(q) ||
        r.barkod.toLowerCase().includes(q),
    )
  }, [rows, search])

  const columns = useMemo<ColDef<KKSelectRow>[]>(
    () => [
      {
        headerName: 'KK Fiş No', field: 'kkFisNo', width: 110,
        cellClass: '!text-[#f57c00] !font-medium',
      },
      { headerName: 'Malzeme Kodu', field: 'malzemeKod', width: 140 },
      { headerName: 'Malzeme Adı', field: 'malzemeAd', flex: 1 },
      {
        headerName: 'Kg', field: 'kg', width: 100, type: 'rightAligned',
        valueFormatter: (p) => (p.value ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      },
      {
        headerName: 'Mt', field: 'mt', width: 100, type: 'rightAligned',
        valueFormatter: (p) => (p.value ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      },
      { headerName: 'Adet', field: 'adet', width: 80, type: 'rightAligned' },
      { headerName: 'Barkod', field: 'barkod', width: 140 },
      { headerName: 'İş Emri', field: 'isEmriNo', width: 120 },
    ],
    [],
  )

  const handleAktar = () => {
    const secilen = gridApi?.getSelectedRows() as KKSelectRow[] | undefined
    if (!secilen || secilen.length === 0) {
      message.warning('Lütfen en az bir kalem seçin')
      return
    }
    onSelect(secilen)
    onClose()
  }

  const handleTumunuSec = () => {
    if (!gridApi) return
    gridApi.selectAll()
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={<span className="!text-[13px] !font-semibold">Kalite Kontrol Girişleri - Stoğa Aktar</span>}
      width="100vw"
      style={{ top: 0, paddingBottom: 0, maxWidth: '100vw', margin: 0 }}
      rootClassName="kk-secim-modal"
      styles={{ body: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: 12 } }}
      destroyOnHidden
    >
      <div className="!flex !items-center !gap-2 !mb-2 !flex-shrink-0">
        <Input
          size="small"
          allowClear
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Malzeme kodu / adı / KK fiş no / barkod ile ara..."
          prefix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />}
          className="!w-96 !text-[12px]"
        />
        <span className="!text-[11px] !text-[#9ca3af]">{filtered.length} kalem</span>
      </div>
      <div style={{ height: 'calc(100vh - 170px)', width: '100%' }}>
        <AgGridReact
          rowData={filtered}
          columnDefs={columns}
          theme={kkTheme}
          loading={loading}
          localeText={agGridLocaleTR}
          headerHeight={32}
          rowHeight={30}
          rowSelection="multiple"
          defaultColDef={{ resizable: true, sortable: true, filter: true }}
          onRowDoubleClicked={(e) => {
            if (e.data) {
              onSelect([e.data])
              onClose()
            }
          }}
          onGridReady={(e) => setGridApi(e.api)}
        />
      </div>
      <div className="!flex !justify-between !gap-2 !mt-2 !flex-shrink-0">
        <Button size="small" onClick={handleTumunuSec} className="!text-[12px]">
          Tümünü Seç
        </Button>
        <Space>
          <span className="!text-[11px] !text-[#9ca3af]">
            Birden fazla satır seçmek için Ctrl+Click
          </span>
          <button
            type="button"
            onClick={handleAktar}
            className="!text-[12px] !h-7 !px-4 !bg-[#FF9933] !text-white !rounded hover:!bg-[#e68a00] !flex !items-center !gap-1 !font-medium"
          >
            Seçilenleri Aktar
          </button>
        </Space>
      </div>
    </Modal>
  )
}
