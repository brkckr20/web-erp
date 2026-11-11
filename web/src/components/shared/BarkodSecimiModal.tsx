'use client'

import { useEffect, useRef, useState } from 'react'
import { Modal, Button, Spin, message } from 'antd'
import { AgGridReact } from 'ag-grid-react'
import type { GridApi } from 'ag-grid-community'
import { antGridTheme } from '@/lib/ag-grid-theme'
import { depoBarkodApi, DepoBarkodSatir } from '@/lib/depo-bazli-stok-api'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (rows: DepoBarkodSatir[]) => void
  depoKod: string
}

export default function BarkodSecimiModal({ open, onClose, onSelect, depoKod }: Props) {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<DepoBarkodSatir[]>([])
  const gridApiRef = useRef<GridApi | null>(null)

  useEffect(() => {
    if (open && depoKod) {
      setLoading(true)
      depoBarkodApi.list(depoKod)
        .then(setRows)
        .catch(() => message.error('Barkod verisi alınamadı'))
        .finally(() => setLoading(false))
    }
  }, [open, depoKod])

  const columnDefs = [
    { headerName: '', field: 'select', width: 50, checkboxSelection: true, headerCheckboxSelection: true, suppressSizeToFit: true },
    { headerName: 'Malzeme', field: 'malzemeKod', width: 120 },
    { headerName: 'Ad', field: 'malzemeAd', flex: 1, minWidth: 180 },
    { headerName: 'Renk', field: 'renkKod', width: 100 },
    { headerName: 'Parti', field: 'partiNo', width: 100 },
    { headerName: 'Barkod', field: 'barkod', width: 150 },
    { headerName: 'Top No', field: 'topNo', width: 80 },
    { headerName: 'Mt', field: 'mt', width: 90, type: 'rightAligned' },
    { headerName: 'Kg', field: 'kg', width: 90, type: 'rightAligned' },
    { headerName: 'Adet', field: 'adet', width: 80, type: 'rightAligned' },
    { headerName: 'Toplam', field: 'toplam', width: 100, type: 'rightAligned',
      valueFormatter: (p: any) => `${p.value ?? 0} ${p.data?.birim ?? ''}`.trim() },
    { headerName: 'Kalan', field: 'kalan', width: 100, type: 'rightAligned',
      valueFormatter: (p: any) => `${p.value ?? 0} ${p.data?.birim ?? ''}`.trim() },
    { headerName: 'KK Fiş', field: 'fisNo', width: 100 },
  ]

  const handleEkle = () => {
    const api = gridApiRef.current
    if (!api) return
    const selected = api.getSelectedRows() as DepoBarkodSatir[]
    if (!selected.length) {
      message.warning('Lütfen en az bir satır seçin')
      return
    }
    onSelect(selected)
    onClose()
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={`Barkod Seçimi - ${depoKod}`}
      width={1200}
      footer={[
        <Button key="cancel" onClick={onClose}>İptal</Button>,
        <Button key="add" type="primary" onClick={handleEkle}>Aktar</Button>,
      ]}
      destroyOnHidden
    >
      <div style={{ height: 560 }}>
        {loading ? (
          <div className="h-full flex items-center justify-center"><Spin /></div>
        ) : (
          <AgGridReact
            theme={antGridTheme}
            rowData={rows}
            columnDefs={columnDefs}
            rowSelection={{ mode: 'multiRow' }}
            rowHeight={32}
            headerHeight={36}
            defaultColDef={{ sortable: true, filter: true, resizable: true }}
            onGridReady={(e) => { gridApiRef.current = e.api }}
          />
        )}
      </div>
    </Modal>
  )
}
