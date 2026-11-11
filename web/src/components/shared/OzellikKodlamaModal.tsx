'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Input, Modal, Button, App } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { ozellikKodlamaApi, type OzellikKodlama } from '@/lib/ozellik-kodlama-api'

interface OzellikKodlamaModalProps {
  open: boolean
  kategori: string
  value?: number | null
  onChange?: (id: number | null, record?: OzellikKodlama) => void
  onClose?: () => void
}

export default function OzellikKodlamaModal({
  open,
  kategori,
  value,
  onChange,
  onClose,
}: OzellikKodlamaModalProps) {
  const { message } = App.useApp()
  const [data, setData] = useState<OzellikKodlama[]>([])
  const [loading, setLoading] = useState(false)
  const [newAd, setNewAd] = useState('')
  const [arama, setArama] = useState('')
  const [editRecord, setEditRecord] = useState<OzellikKodlama | null>(null)
  const [editAd, setEditAd] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await ozellikKodlamaApi.list(kategori)
      setData(result)
    } catch {
      message.error('Veriler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [kategori])

  useEffect(() => {
    if (open) {
      setArama('')
      loadData()
    }
  }, [open, loadData])

  const filtered = useMemo(() => {
    const q = arama.trim().toLowerCase()
    const list = q ? data.filter((d) => d.ad.toLowerCase().includes(q)) : data
    return [...list].sort((a, b) => a.ad.localeCompare(b.ad, 'tr'))
  }, [data, arama])

  const handleAdd = async () => {
    const trimmed = newAd.trim()
    if (!trimmed) {
      message.warning('Ad alanı zorunludur')
      return
    }
    try {
      const created = await ozellikKodlamaApi.create({ ad: trimmed, kategori })
      setData((prev) => [...prev, created])
      setNewAd('')
      message.success('Eklendi')
    } catch {
      message.error('Eklenemedi')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await ozellikKodlamaApi.delete(id)
      setData((prev) => prev.filter((item) => item.id !== id))
      if (value === id) {
        onChange?.(null)
      }
      message.success('Silindi')
    } catch {
      message.error('Silinemedi')
    }
  }

  const handleEditStart = (record: OzellikKodlama) => {
    setEditRecord(record)
    setEditAd(record.ad)
  }

  const handleEditSave = async () => {
    if (!editRecord) return
    const trimmed = editAd.trim()
    if (!trimmed) {
      message.warning('Ad alanı zorunludur')
      return
    }
    if (trimmed === editRecord.ad) {
      setEditRecord(null)
      return
    }
    setEditSaving(true)
    try {
      const updated = await ozellikKodlamaApi.update(editRecord.id, { ad: trimmed })
      setData((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      if (value === updated.id) onChange?.(updated.id, updated)
      setEditRecord(null)
      message.success('Güncellendi')
    } catch {
      message.error('Güncellenemedi')
    } finally {
      setEditSaving(false)
    }
  }

  const handleSelect = (record: OzellikKodlama) => {
    onChange?.(record.id, record)
    onClose?.()
  }

  const columns = useMemo<ColDef<OzellikKodlama>[]>(
    () => [
      { headerName: 'Ad', field: 'ad', flex: 1, minWidth: 160, filter: 'agTextColumnFilter' },
      {
        headerName: '',
        colId: 'islem',
        width: 76,
        sortable: false,
        filter: false,
        resizable: false,
        cellRenderer: (p: { data?: OzellikKodlama }) =>
          p.data ? (
            <div className="!flex !items-center !gap-2">
              <EditOutlined
                style={{ fontSize: 12, color: '#6b7280', cursor: 'pointer' }}
                title="Düzenle"
                onClick={() => handleEditStart(p.data!)}
              />
              <DeleteOutlined
                style={{ fontSize: 12, color: '#ff4d4f', cursor: 'pointer' }}
                title="Sil"
                onClick={() => handleDelete(p.data!.id)}
              />
            </div>
          ) : null,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value],
  )

  return (
    <Modal
      title={`${kategori} Özellik Kodlama`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <div className="!flex !gap-2 !mb-2">
        <Input
          size="small"
          placeholder="Ad"
          value={newAd}
          onChange={(e) => setNewAd(e.target.value)}
          onPressEnter={handleAdd}
          className="!flex-1 !text-[11px]"
        />
        <Button
          size="small"
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          className="!text-[11px] !h-7"
        >
          Ekle
        </Button>
      </div>
      <div className="!mb-2">
        <Input
          size="small"
          allowClear
          placeholder="Ara..."
          prefix={<SearchOutlined style={{ fontSize: 12, color: '#9ca3af' }} />}
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          className="!text-[11px]"
        />
      </div>
      <DataGrid
        rowData={filtered}
        columnDefs={columns}
        loading={loading}
        height={300}
        headerHeight={28}
        rowHeight={28}
        exportFileName={`ozellik-${kategori}`}
        enableExcelExport={false}
        enableColumnChooser={false}
        rowSelection="single"
        getRowId={(p) => String(p.data.id)}
        onRowDoubleClicked={(e) => {
          const target = e.event?.target as HTMLElement | null
          if (target?.closest('[col-id="islem"]')) return
          if (e.data) handleSelect(e.data)
        }}
      />
      <div className="!text-[10px] !text-gray-400 !mt-1">
        Çift tıklayarak seçin; kalem ikonuyla düzenleyin.
      </div>

      <Modal
        title={<span className="!text-[11px] !font-semibold">Özellik Düzenle</span>}
        open={!!editRecord}
        onCancel={() => setEditRecord(null)}
        onOk={handleEditSave}
        confirmLoading={editSaving}
        okText="Kaydet"
        cancelText="İptal"
        width={360}
        okButtonProps={{ size: 'small', className: '!text-[11px]' }}
        cancelButtonProps={{ size: 'small', className: '!text-[11px]' }}
      >
        <Input
          size="small"
          value={editAd}
          onChange={(e) => setEditAd(e.target.value)}
          onPressEnter={handleEditSave}
          className="!text-[11px]"
        />
      </Modal>
    </Modal>
  )
}
