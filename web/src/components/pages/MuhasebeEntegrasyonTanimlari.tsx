'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { App, Button, Input, Select, Spin, Switch } from 'antd'
import { DeleteOutlined, PlusOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { muhasebeEntegrasyonApi, type MuhasebeEntegrasyonTanimi } from '@/lib/muhasebe-entegrasyon-api'
import { depoApi, type Depo } from '@/lib/depo-api'
import { muhasebeHesapApi, type MuhasebeHesap } from '@/lib/muhasebe-hesap-api'
import { fasonTipiApi } from '@/lib/fason-tipi-api'

const HESAP_TIPLERI = [
  { value: 'CARI_BORC', label: 'Cari Borç (Alıcılar 120)' },
  { value: 'CARI_ALACAK', label: 'Cari Alacak (Satıcılar 320)' },
  { value: 'SATIS_GELIR', label: 'Satış Geliri' },
  { value: 'ALIS_GIDER', label: 'Alış Gider/Stok' },
  { value: 'SATIS_IADE', label: 'Satış İade' },
  { value: 'ALIS_IADE', label: 'Alış İade' },
  { value: 'HESAPLANAN_KDV', label: 'Hesaplanan KDV' },
  { value: 'INDIRILECEK_KDV', label: 'İndirilecek KDV' },
]
const FATURA_TIPLERI = [
  { value: '', label: '(Hepsi)' },
  { value: '120', label: '120 Toptan Satış' }, { value: '121', label: '121 Perakende Satış' }, { value: '138', label: '138 Verilen Hizmet' },
  { value: '2', label: '2 Perakende Satış İade' }, { value: '3', label: '3 Toptan Satış İade' },
  { value: '1', label: '1 Mal Alım' }, { value: '11', label: '11 Fasondan Giriş' }, { value: '22', label: '22 Alınan Hizmet' },
  { value: '122', label: '122 Mal Alım İade' }, { value: '139', label: '139 Alınan Hizmet İade' },
]

interface Row extends MuhasebeEntegrasyonTanimi { key: string }
let sayac = 0
const yeniKey = () => `met-${Date.now()}-${++sayac}`

export default function MuhasebeEntegrasyonTanimlari() {
  const { message } = App.useApp()
  const [rows, setRows] = useState<Row[]>([])
  const [depolar, setDepolar] = useState<Depo[]>([])
  const [hesaplar, setHesaplar] = useState<MuhasebeHesap[]>([])
  const [fasonTipleri, setFasonTipleri] = useState<{ id: number; ad: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [list, depoList, hesapList, fasonList] = await Promise.all([muhasebeEntegrasyonApi.list(), depoApi.list(), muhasebeHesapApi.list(), fasonTipiApi.list()])
      setDepolar(depoList)
      setHesaplar(hesapList)
      setFasonTipleri(fasonList.filter((f) => f.kullanimda).map((f) => ({ id: f.id, ad: f.ad })))
      setRows(list.map((r) => ({ ...r, key: String(r.id ?? yeniKey()), kdvOrani: r.kdvOrani == null ? '' : String(r.kdvOrani) })))
    } catch (e: any) { message.error(e?.message || 'Yüklenemedi') }
    finally { setLoading(false) }
  }, [message])

  useEffect(() => { load() }, [load])

  const updateRow = useCallback((key: string, patch: Partial<Row>) => setRows(prev => prev.map(r => r.key === key ? { ...r, ...patch } : r)), [])
  const addRow = () => setRows(prev => [...prev, { key: yeniKey(), hesapTipi: 'SATIS_GELIR', faturaTipi: '', depoId: null, fasonTipiId: null, kdvOrani: '', muhasebeHesapId: null, hesapKodu: '', sira: prev.length, aktif: true }])
  const delRow = (key: string) => setRows(prev => prev.filter(r => r.key !== key))

  const kaydet = async () => {
    setSaving(true)
    try {
      const payload = rows.map((r, idx) => ({ ...r, faturaTipi: r.faturaTipi || null, kdvOrani: r.kdvOrani === '' || r.kdvOrani == null ? null : Number(r.kdvOrani), sira: idx }))
      const saved = await muhasebeEntegrasyonApi.replaceAll(payload as any)
      setRows(saved.map((r) => ({ ...r, key: String(r.id ?? yeniKey()), kdvOrani: r.kdvOrani == null ? '' : String(r.kdvOrani) })))
      message.success('Kaydedildi')
    } catch (e: any) { message.error(e?.message || 'Kaydedilemedi') }
    finally { setSaving(false) }
  }

  const depoOptions = useMemo(() => [{ value: 0, label: '(Hepsi)' }, ...depolar.map(d => ({ value: d.id, label: `${d.kod} - ${d.ad}` }))], [depolar])
  const fasonOptions = useMemo(() => [{ value: 0, label: '(Hepsi)' }, ...fasonTipleri.map(f => ({ value: f.id, label: f.ad }))], [fasonTipleri])
  const hesapOptions = useMemo(() => hesaplar.map(h => ({ value: h.kod, label: `${h.kod} - ${h.ad}` })), [hesaplar])

  const columns = useMemo<ColDef<Row>[]>(() => [
    { headerName: 'Hesap Tipi', field: 'hesapTipi', width: 200, cellClass: '!p-0', cellRenderer: (p: any) => <Select size="small" variant="borderless" value={p.data.hesapTipi} onChange={v => updateRow(p.data.key, { hesapTipi: v })} options={HESAP_TIPLERI} className="!w-full" /> },
    { headerName: 'Fatura Tipi', field: 'faturaTipi', width: 170, cellClass: '!p-0', cellRenderer: (p: any) => <Select size="small" variant="borderless" value={p.data.faturaTipi ?? ''} onChange={v => updateRow(p.data.key, { faturaTipi: v || null })} options={FATURA_TIPLERI} className="!w-full" /> },
    { headerName: 'Fiş Alt Tipi', field: 'fasonTipiId', width: 180, cellClass: '!p-0', cellRenderer: (p: any) => <Select size="small" variant="borderless" showSearch optionFilterProp="label" value={p.data.fasonTipiId ?? 0} onChange={v => updateRow(p.data.key, { fasonTipiId: v === 0 ? null : v })} options={fasonOptions} className="!w-full" /> },
    { headerName: 'Depo', field: 'depoId', width: 220, cellClass: '!p-0', cellRenderer: (p: any) => <Select size="small" variant="borderless" showSearch optionFilterProp="label" value={p.data.depoId ?? 0} onChange={v => updateRow(p.data.key, { depoId: v === 0 ? null : v })} options={depoOptions} className="!w-full" /> },
    { headerName: 'KDV %', field: 'kdvOrani', width: 90, cellClass: '!p-0', cellRenderer: (p: any) => <Input size="small" variant="borderless" value={p.data.kdvOrani ?? ''} onChange={e => updateRow(p.data.key, { kdvOrani: e.target.value })} className="!w-full !text-right" /> },
    { headerName: 'Hesap Kodu', field: 'hesapKodu', width: 240, cellClass: '!p-0', cellRenderer: (p: any) => <Select size="small" variant="borderless" showSearch optionFilterProp="label" value={p.data.hesapKodu || undefined} onChange={v => updateRow(p.data.key, { hesapKodu: v })} options={hesapOptions} className="!w-full" placeholder="Hesap seç..." /> },
    { headerName: 'Aktif', field: 'aktif', width: 70, cellRenderer: (p: any) => <Switch size="small" checked={p.data.aktif !== false} onChange={v => updateRow(p.data.key, { aktif: v })} /> },
    { headerName: '', width: 44, cellClass: '!p-0 !flex !items-center !justify-center', cellRenderer: (p: any) => <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => delRow(p.data.key)} /> },
  ], [depoOptions, fasonOptions, hesapOptions, updateRow])

  return (
    <div className="!p-3 !h-full !flex !flex-col">
      <div className="!flex !items-center !justify-between !mb-3">
        <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">Muhasebe Entegrasyon Tanımları</div>
        <div className="!flex !gap-1.5">
          <Button size="small" icon={<ReloadOutlined />} onClick={load}>Yenile</Button>
          <Button size="small" icon={<PlusOutlined />} onClick={addRow}>Satır Ekle</Button>
          <Button size="small" type="primary" icon={<SaveOutlined />} loading={saving} onClick={kaydet}>Kaydet</Button>
        </div>
      </div>
      <div className="!text-[11px] !text-[#6b7280] !mb-2">Boş koşul = tümü/geçerli. En spesifik kural (fatura tipi &gt; fiş alt tipi &gt; depo &gt; KDV) önceliklidir. Fatura muhasebeleşmesi bu tablodaki hesap kodlarını kullanır.</div>
      <div className="!flex-1 !min-h-[300px]">
        <Spin spinning={loading} classNames={{ root: '!h-full [&_.ant-spin-container]:!h-full' }}>
          <DataGrid rowData={rows} columnDefs={columns} domLayout="normal" getRowId={p => p.data.key} rowSelection="single" enableColumnChooser={false} exportFileName="muhasebe-entegrasyon-tanimlari" suppressCellFocus={false} />
        </Spin>
      </div>
    </div>
  )
}
