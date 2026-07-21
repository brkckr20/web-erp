'use client'

import { useEffect, useMemo, useState } from 'react'
import { Modal, Input, App } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community'
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import { isEmriApi, type IsEmri } from '@/lib/is-emri-api'
import { agGridLocaleTR } from '@/lib/ag-grid-locale'

ModuleRegistry.registerModules([AllCommunityModule])

const theme = themeQuartz.withParams({
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

interface IsEmriSecimiKalem {
  key: string
  isEmriNo: string
  isEmriId: number
  malzemeId: number | null
  malzemeKod: string
  malzemeAd: string
  kg: number
  mt: number
  adet: number
  kullanilanKg: number
  kullanilanMt: number
}

interface IsEmriSecimiModalProps {
  open: boolean
  onClose: () => void
  onSelect: (secimler: IsEmriSecimiKalem[], isEmriNo: string) => void
}

export default function IsEmriSecimiModal({ open, onClose, onSelect }: IsEmriSecimiModalProps) {
  const { message } = App.useApp()
  const [workOrders, setWorkOrders] = useState<IsEmri[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [gridApi, setGridApi] = useState<GridApi | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    isEmriApi
      .list()
      .then((list) => setWorkOrders(list))
      .catch(() => {
        message.error('İş emirleri yüklenemedi')
        setWorkOrders([])
      })
      .finally(() => setLoading(false))
  }, [open])

  useEffect(() => {
    if (!open) {
      setSearch('')
      setGridApi(null)
    }
  }, [open])

  const allKalemler = useMemo(() => {
    const result: IsEmriSecimiKalem[] = []
    for (const wo of workOrders) {
      for (const k of wo.kalemler) {
        if (!k.malzemeKod) continue
        result.push({
          key: `${wo.id}-${k.id ?? Math.random()}`,
          isEmriNo: wo.isEmriNo,
          isEmriId: wo.id,
          malzemeId: k.malzemeId ?? null,
          malzemeKod: k.malzemeKod ?? '',
          malzemeAd: k.malzemeAd ?? '',
          kg: k.kg ?? 0,
          mt: k.mt ?? 0,
          adet: k.adet ?? 0,
          kullanilanKg: k.kullanilanKg ?? 0,
          kullanilanMt: k.kullanilanMt ?? 0,
        })
      }
    }
    return result
  }, [workOrders])

  const visibleKalemler = useMemo(() => {
    return allKalemler.filter((row) => {
      const kalanKg = row.kg - row.kullanilanKg
      const kalanMt = row.mt - row.kullanilanMt
      return kalanKg > 0 || kalanMt > 0
    })
  }, [allKalemler])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return visibleKalemler
    return visibleKalemler.filter(
      (r) =>
        r.isEmriNo.toLowerCase().includes(q) ||
        r.malzemeKod.toLowerCase().includes(q) ||
        r.malzemeAd.toLowerCase().includes(q),
    )
  }, [visibleKalemler, search])

  const columns = useMemo<ColDef<IsEmriSecimiKalem>[]>(
    () => [
      {
        headerName: 'İş Emri No', field: 'isEmriNo', width: 130,
        cellClass: '!font-medium !text-[#f57c00]',
      },
      { headerName: 'Malzeme Kodu', field: 'malzemeKod', width: 140 },
      { headerName: 'Malzeme Adı', field: 'malzemeAd', flex: 1 },
      { headerName: 'Kg', field: 'kg', width: 100, type: 'rightAligned',
        valueFormatter: (p) => (p.value ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
      { headerName: 'Mt', field: 'mt', width: 100, type: 'rightAligned',
        valueFormatter: (p) => (p.value ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
      { headerName: 'Adet', field: 'adet', width: 100, type: 'rightAligned',
        valueFormatter: (p) => (p.value ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) },
      {
        headerName: 'Kalan Miktar', width: 120, type: 'rightAligned',
        cellClassRules: {
          '!text-red-500 !font-semibold': (p) => (p.value ?? 0) <= 0,
          '!text-green-600 !font-semibold': (p) => (p.value ?? 0) > 0,
        },
        valueGetter: (p) => {
          const row = p.data!
          if (row.kg > 0) return row.kg - row.kullanilanKg
          if (row.mt > 0) return row.mt - row.kullanilanMt
          return 0
        },
        valueFormatter: (p) => (p.value ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      },
    ],
    [],
  )

  const handleEkle = () => {
    const secilen = gridApi?.getSelectedRows() as IsEmriSecimiKalem[] | undefined
    if (!secilen || secilen.length === 0) {
      message.warning('Lütfen en az bir kalem seçin')
      return
    }
    const isEmriNo = secilen[0].isEmriNo
    onSelect(secilen, isEmriNo)
    onClose()
  }

  const onGridReady = (e: GridReadyEvent<IsEmriSecimiKalem>) => {
    setGridApi(e.api)
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={<span className="!text-[13px] !font-semibold">İş Emirleri - Kalem Seçimi</span>}
      width="100vw"
      style={{ top: 0, paddingBottom: 0, maxWidth: '100vw', margin: 0 }}
      rootClassName="is-emri-secimi-modal"
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
          placeholder="İş emri no, malzeme kodu veya adı ile ara..."
          prefix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />}
          className="!w-96 !text-[12px]"
        />
        <span className="!text-[11px] !text-[#9ca3af]">{filtered.length} kayıt</span>
      </div>
      <div style={{ height: 'calc(100vh - 170px)', width: '100%' }}>
        <AgGridReact
          rowData={filtered}
          columnDefs={columns}
          theme={theme}
          loading={loading}
          localeText={agGridLocaleTR}
          headerHeight={32}
          rowHeight={30}
          rowSelection="multiple"
          defaultColDef={{ resizable: true, sortable: true, filter: true }}
          onRowDoubleClicked={(e) => {
            if (e.data) {
              onSelect([e.data], e.data.isEmriNo)
              onClose()
            }
          }}
          onGridReady={onGridReady}
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
