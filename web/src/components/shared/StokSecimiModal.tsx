'use client'

import { useEffect, useMemo, useState } from 'react'
import { Modal, Input, App } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community'
import type { ColDef, GridApi } from 'ag-grid-community'
import { depoBazliStokApi, type DepoBazliStokSatir } from '@/lib/depo-bazli-stok-api'
import { agGridLocaleTR } from '@/lib/ag-grid-locale'

ModuleRegistry.registerModules([AllCommunityModule])

const stokTheme = themeQuartz.withParams({
  fontFamily: 'inherit',
  fontSize: 12,
  foregroundColor: '#333',
  headerFontSize: 12,
  headerFontWeight: 600,
  headerTextColor: '#6b7280',
  headerBackgroundColor: '#f9fafb',
  borderColor: '#f0f0f0',
  rowBorder: { style: 'solid', width: 1, color: '#f0f0f0' },
  columnBorder: false,
  rowHoverColor: '#fafafa',
  selectedRowBackgroundColor: '#FF9933',
  oddRowBackgroundColor: '#ffffff',
  backgroundColor: '#ffffff',
  cellHorizontalPadding: 10,
})

interface StokSecimiModalProps {
  open: boolean
  onClose: () => void
  onSelect: (secimler: DepoBazliStokSatir[]) => void
  depoKod: string
}

export default function StokSecimiModal({ open, onClose, onSelect, depoKod }: StokSecimiModalProps) {
  const { message } = App.useApp()
  const [rows, setRows] = useState<DepoBazliStokSatir[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [gridApi, setGridApi] = useState<GridApi | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    depoBazliStokApi
      .list()
      .then((list) => setRows(list.filter((r) => r.depoKod === depoKod)))
      .catch(() => {
        message.error('Stok verileri yüklenemedi')
        setRows([])
      })
      .finally(() => setLoading(false))
  }, [open, depoKod])

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
        r.malzemeAd.toLowerCase().includes(q),
    )
  }, [rows, search])

  const columns = useMemo<ColDef<DepoBazliStokSatir>[]>(
    () => [
      { headerName: 'Malzeme Kodu', field: 'malzemeKod', width: 140, cellClass: '!text-[#f57c00] !font-medium' },
      { headerName: 'Malzeme Adı', field: 'malzemeAd', flex: 1 },
      { headerName: 'Brüt Kg', field: 'brutKg', width: 110, type: 'rightAligned',
        valueFormatter: (p) => (p.value ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
      { headerName: 'Kg', field: 'kg', width: 110, type: 'rightAligned',
        valueFormatter: (p) => (p.value ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
      { headerName: 'Brüt Mt', field: 'brutMt', width: 110, type: 'rightAligned',
        valueFormatter: (p) => (p.value ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
      { headerName: 'Mt', field: 'mt', width: 110, type: 'rightAligned',
        valueFormatter: (p) => (p.value ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
      { headerName: 'Adet', field: 'adet', width: 110, type: 'rightAligned',
        valueFormatter: (p) => (p.value ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) },
    ],
    [],
  )

  const handleEkle = () => {
    const secilen = gridApi?.getSelectedRows() as DepoBazliStokSatir[] | undefined
    if (!secilen || secilen.length === 0) {
      message.warning('Lütfen en az bir malzeme seçin')
      return
    }
    onSelect(secilen)
    onClose()
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={<span className="!text-[13px] !font-semibold">Stok Seçimi - {depoKod}</span>}
      width="100vw"
      style={{ top: 0, paddingBottom: 0, maxWidth: '100vw', margin: 0 }}
      rootClassName="stok-secimi-modal"
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
          placeholder="Malzeme kodu veya adı ile ara..."
          prefix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />}
          className="!w-80 !text-[12px]"
        />
        <span className="!text-[11px] !text-[#9ca3af]">{filtered.length} kayıt</span>
      </div>
      <div style={{ height: 'calc(100vh - 170px)', width: '100%' }}>
        <AgGridReact
          rowData={filtered}
          columnDefs={columns}
          theme={stokTheme}
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
      <div className="!flex !justify-end !gap-2 !mt-2 !flex-shrink-0">
        <span className="!text-[11px] !text-[#9ca3af] !self-center">
          Birden fazla satır seçmek için Ctrl+Click, onay için &quot;Seçilenleri Ekle&quot; butonunu kullanın
        </span>
        <button
          type="button"
          onClick={handleEkle}
          className="!text-[12px] !h-7 !px-3 !bg-[#FF9933] !text-white !rounded hover:!bg-[#e68a00] !flex !items-center !gap-1 !font-medium"
        >
          Seçilenleri Ekle
        </button>
      </div>
    </Modal>
  )
}
