'use client'

import { useEffect, useMemo, useState } from 'react'
import { Modal, Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community'
import type { ColDef } from 'ag-grid-community'
import { malzemeApi, type Malzeme } from '@/lib/malzeme-api'
import { agGridLocaleTR } from '@/lib/ag-grid-locale'

ModuleRegistry.registerModules([AllCommunityModule])

const modalTheme = themeQuartz.withParams({
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

interface MalzemeSecModalProps {
  open: boolean
  onClose: () => void
  onSelect: (kod: string, record: Malzeme) => void
}

export default function MalzemeSecModal({ open, onClose, onSelect }: MalzemeSecModalProps) {
  const [rows, setRows] = useState<Malzeme[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open) return
    setLoading(true)
    malzemeApi
      .list()
      .then((list) => setRows(list))
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [open])

  useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        (r.kod ?? '').toLowerCase().includes(q) ||
        (r.ad ?? '').toLowerCase().includes(q),
    )
  }, [rows, search])

  const columns = useMemo<ColDef<Malzeme>[]>(
    () => [
      { headerName: 'Kodu', field: 'kod', width: 140, cellClass: '!text-[#f57c00] !font-medium' },
      { headerName: 'Adı', field: 'ad', flex: 1 },
      { headerName: 'Türü', field: 'malzemeTuru', width: 140, valueFormatter: (p) => p.value ?? '-' },
      { headerName: 'Kategori', field: 'kategori', width: 140, valueFormatter: (p) => p.value ?? '-' },
      {
        headerName: 'Durum', field: 'kullanimda', width: 90,
        valueFormatter: (p) => (p.value ? 'Aktif' : 'Pasif'),
      },
    ],
    [],
  )

  const handlePick = (rec?: Malzeme) => {
    if (!rec) return
    onSelect(rec.kod, rec)
    onClose()
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={<span className="!text-[13px] !font-semibold">Malzeme Seç</span>}
      width="100vw"
      style={{ top: 0, paddingBottom: 0, maxWidth: '100vw', margin: 0 }}
      rootClassName="malzeme-sec-modal"
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
          placeholder="Kod veya isim ile ara..."
          prefix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />}
          className="!w-80 !text-[12px]"
        />
        <span className="!text-[11px] !text-[#9ca3af]">{filtered.length} kayıt</span>
      </div>
      <div style={{ height: 'calc(100vh - 170px)', width: '100%' }}>
        <AgGridReact
          rowData={filtered}
          columnDefs={columns}
          theme={modalTheme}
          loading={loading}
          localeText={agGridLocaleTR}
          headerHeight={32}
          rowHeight={30}
          rowSelection="single"
          defaultColDef={{ resizable: true, sortable: true, filter: true }}
          onRowDoubleClicked={(e) => handlePick(e.data)}
        />
      </div>
      <div className="!flex !justify-end !gap-2 !mt-2 !flex-shrink-0">
        <span className="!text-[11px] !text-[#9ca3af] !self-center">Bir satıra çift tıklayarak seçin</span>
      </div>
    </Modal>
  )
}
