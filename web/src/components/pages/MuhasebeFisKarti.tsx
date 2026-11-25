'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { App, Button, DatePicker, Input, Popconfirm, Select, Spin } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import type { ColDef } from 'ag-grid-community'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import DataGrid from '@/components/shared/DataGrid'
import { useKirli } from '@/lib/kirli'
import { muhasebeFisApi, type MuhasebeFis, type MuhasebeFisFormData } from '@/lib/muhasebe-fis-api'
import { muhasebeFisTipiEtiketi } from '@/data/muhasebe-fis-tipleri'
import { api } from '@/lib/api'

const { TextArea } = Input
const formatTR = (v: number) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0)
const parseTR = (s: string) => parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0

function TurkishNumberInput({
  value,
  onChange,
  className,
  suffix,
}: {
  value: number
  onChange: (v: number) => void
  className?: string
  suffix?: string
}) {
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState('')
  const display = focused ? draft : formatTR(value)
  const commit = () => {
    const v = parseTR(draft)
    if (v !== value) onChange(v)
    setFocused(false)
  }

  return (
    <Input
      size="small"
      variant="borderless"
      suffix={suffix ? <span className="!text-[10px] !text-[#9ca3af]">{suffix}</span> : undefined}
      value={display}
      onFocus={() => {
        setFocused(true)
        setDraft(value === 0 ? '' : String(value).replace('.', ','))
      }}
      onBlur={commit}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          commit()
        }
      }}
      className={className}
    />
  )
}

let sayac = 0
const yeniKey = () => `mfs-${Date.now()}-${++sayac}`

interface Satir {
  key: string; hesapKodu: string; hesapAdi: string; cariHesapId: number | null; ozelKod: string; aciklama: string;
  vadeTarihi: Dayjs | null; miktar: number; belgeNo: string; doviz: string; dovizKuru: number; dovizTutari: number; borc: number; alacak: number;
}
const bosSatir = (): Satir => ({ key: yeniKey(), hesapKodu: '', hesapAdi: '', cariHesapId: null, ozelKod: '', aciklama: '', vadeTarihi: null, miktar: 0, belgeNo: '', doviz: 'TRY', dovizKuru: 1, dovizTutari: 0, borc: 0, alacak: 0 })

interface Props { id?: number; fisTipi?: string; onKirliChange?: (k: boolean) => void }

export default function MuhasebeFisKarti({ id: propId, fisTipi: propFisTipi, onKirliChange }: Props) {
  const { message, modal } = App.useApp()
  const [id, setId] = useState<number | null>(propId ?? null)
  const [fisTipi, setFisTipi] = useState(propFisTipi ?? '1')
  const [fisNo, setFisNo] = useState<number | null>(null)
  const [fisTarihi, setFisTarihi] = useState<Dayjs>(dayjs())
  const [belgeNo, setBelgeNo] = useState('')
  const [k, setK] = useState('0')
  const [ozelKod, setOzelKod] = useState('')
  const [erisimKodu, setErisimKodu] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [kaynakTuru, setKaynakTuru] = useState<string | null>(null)
  const [kaynakId, setKaynakId] = useState<number | null>(null)
  const [fasonTipiId, setFasonTipiId] = useState<number | null>(null)
  const [fasonTipleri, setFasonTipleri] = useState<{ id: number; ad: string }[]>([])
  const [masrafYeri, setMasrafYeri] = useState('')
  const [satirlar, setSatirlar] = useState<Satir[]>([bosSatir()])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const kaynakli = kaynakTuru === 'FATURA'
  const { kirli, temizle } = useKirli([fisTipi, fisTarihi, belgeNo, k, ozelKod, erisimKodu, aciklama, fasonTipiId, masrafYeri, satirlar])
  useEffect(() => { onKirliChange?.(kirli) }, [kirli, onKirliChange])
  useEffect(() => { api.get<{ id: number; ad: string }[]>('/fason-tipi').then(setFasonTipleri).catch(() => {}) }, [])

  const doldur = useCallback((f: MuhasebeFis) => {
    setId(f.id); setFisTipi(f.fisTipi); setFisNo(f.fisNo); setFisTarihi(dayjs(f.fisTarihi))
    setBelgeNo(f.belgeNo ?? ''); setK(f.k ?? '0'); setOzelKod(f.ozelKod ?? ''); setErisimKodu(f.erisimKodu ?? ''); setAciklama(f.aciklama ?? '')
    setKaynakTuru(f.kaynakTuru ?? null); setKaynakId(f.kaynakId ?? null); setFasonTipiId(f.fasonTipiId ?? null); setMasrafYeri(f.masrafYeri ?? '')
    setSatirlar((f.satirlar ?? []).map(s => ({ key: String(s.id ?? yeniKey()), hesapKodu: s.hesapKodu ?? '', hesapAdi: s.hesapAdi ?? '', cariHesapId: s.cariHesapId ?? null, ozelKod: s.ozelKod ?? '', aciklama: s.aciklama ?? '', vadeTarihi: s.vadeTarihi ? dayjs(s.vadeTarihi) : null, miktar: Number(s.miktar) || 0, belgeNo: s.belgeNo ?? '', doviz: s.doviz ?? 'TRY', dovizKuru: Number(s.dovizKuru) || 1, dovizTutari: Number(s.dovizTutari) || 0, borc: Number(s.borc) || 0, alacak: Number(s.alacak) || 0 })))
    temizle()
  }, [temizle])

  const yeni = useCallback(() => {
    setId(null); setFisNo(null); setFisTarihi(dayjs()); setBelgeNo(''); setK('0'); setOzelKod(''); setErisimKodu(''); setAciklama(''); setKaynakTuru(null); setKaynakId(null); setFasonTipiId(null); setMasrafYeri(''); setSatirlar([bosSatir()]); temizle()
  }, [temizle])

  useEffect(() => {
    if (propId) { setLoading(true); muhasebeFisApi.getById(propId).then(doldur).catch(() => message.warning('Fiş yüklenemedi')).finally(() => setLoading(false)) }
    else yeni()
  }, [propId, doldur, yeni, message])

  const updateSatir = useCallback((key: string, patch: Partial<Satir>) => setSatirlar(prev => prev.map(s => s.key === key ? { ...s, ...patch } : s)), [])
  const satirEkle = () => setSatirlar(prev => [...prev, bosSatir()])
  const satirSil = (key: string) => setSatirlar(prev => prev.filter(s => s.key !== key))
  const toplam = useMemo(() => satirlar.reduce((a, s) => ({ borc: a.borc + s.borc, alacak: a.alacak + s.alacak }), { borc: 0, alacak: 0 }), [satirlar])

  const handleKaydet = async () => {
    const gecerli = satirlar.filter(s => s.hesapKodu.trim())
    if (!gecerli.length) return message.warning('En az bir satır girilmelidir')
    if (Math.abs(toplam.borc - toplam.alacak) > 0.01) return message.warning('Borç ve alacak toplamı eşit olmalıdır')
    setSaving(true)
    try {
      const payload: MuhasebeFisFormData = {
        fisTipi, fisTarihi: fisTarihi.format('YYYY-MM-DDTHH:mm:ss'), belgeNo: belgeNo.trim() || null, k: k.trim() || null,
        ozelKod: ozelKod.trim() || null, erisimKodu: erisimKodu.trim() || null, aciklama: aciklama.trim() || null, kaynakTuru, kaynakId, fasonTipiId, masrafYeri: masrafYeri.trim() || null,
        satirlar: gecerli.map(s => ({ hesapKodu: s.hesapKodu.trim(), hesapAdi: s.hesapAdi.trim() || null, cariHesapId: s.cariHesapId, ozelKod: s.ozelKod.trim() || null, aciklama: s.aciklama.trim() || null, vadeTarihi: s.vadeTarihi ? s.vadeTarihi.format('YYYY-MM-DD') : null, miktar: s.miktar || null, belgeNo: s.belgeNo.trim() || null, doviz: s.doviz || null, dovizKuru: s.dovizKuru || null, dovizTutari: s.dovizTutari || null, borc: s.borc, alacak: s.alacak })),
      }
      if (id) { await muhasebeFisApi.update(id, payload); message.success('Kaydedildi') }
      else { const c = await muhasebeFisApi.create(payload); setId(c.id); setFisNo(c.fisNo); message.success(`Kaydedildi (Fiş No: ${String(c.fisNo).padStart(8, '0')})`) }
      temizle()
    } catch (e: any) { message.error(e?.message || 'Kayıt hatası') } finally { setSaving(false) }
  }

  const handleSil = () => {
    if (!id) return
    modal.confirm({ title: 'Fişi Sil', content: 'Bu muhasebe fişini silmek istiyor musunuz?', okText: 'Sil', okButtonProps: { danger: true }, cancelText: 'Vazgeç', onOk: async () => { await muhasebeFisApi.remove(id); message.success('Silindi'); yeni() } })
  }

  const columns = useMemo<ColDef<Satir>[]>(() => [
    { headerName: 'Hesap Kodu', field: 'hesapKodu', width: 140, cellClass: '!p-0', cellRenderer: (p: any) => <Input size="small" variant="borderless" value={p.data.hesapKodu} onChange={e => updateSatir(p.data.key, { hesapKodu: e.target.value })} className="!w-full !h-full !text-[12px]" /> },
    { headerName: 'Hesap Adı', field: 'hesapAdi', width: 250, cellClass: '!p-0', cellRenderer: (p: any) => <Input size="small" variant="borderless" title={p.data.hesapAdi} value={p.data.hesapAdi} onChange={e => updateSatir(p.data.key, { hesapAdi: e.target.value })} className="!w-full !h-full !text-[12px]" /> },
    { headerName: 'Özel Kod', field: 'ozelKod', width: 100, cellClass: '!p-0', cellRenderer: (p: any) => <Input size="small" variant="borderless" value={p.data.ozelKod} onChange={e => updateSatir(p.data.key, { ozelKod: e.target.value })} className="!w-full !h-full !text-[12px]" /> },
    { headerName: 'Açıklama', field: 'aciklama', flex: 1, minWidth: 160, cellClass: '!p-0', cellRenderer: (p: any) => <Input size="small" variant="borderless" value={p.data.aciklama} onChange={e => updateSatir(p.data.key, { aciklama: e.target.value })} className="!w-full !h-full !text-[12px]" /> },
    { headerName: 'Vade Tarihi', field: 'vadeTarihi', width: 120, cellClass: '!p-0', cellRenderer: (p: any) => <DatePicker size="small" variant="borderless" value={p.data.vadeTarihi} onChange={d => updateSatir(p.data.key, { vadeTarihi: d })} format="DD.MM.YYYY" className="!w-full" /> },
    { headerName: 'Belge No', field: 'belgeNo', width: 110, cellClass: '!p-0', cellRenderer: (p: any) => <Input size="small" variant="borderless" value={p.data.belgeNo} onChange={e => updateSatir(p.data.key, { belgeNo: e.target.value })} className="!w-full !h-full !text-[12px]" /> },
    { headerName: 'Borç', field: 'borc', width: 130, cellClass: '!p-0', cellRenderer: (p: any) => <TurkishNumberInput value={p.data.borc} onChange={v => updateSatir(p.data.key, { borc: v, alacak: 0 })} suffix="₺" className="!w-full !h-full !text-[12px] !text-right" /> },
    { headerName: 'Alacak', field: 'alacak', width: 130, cellClass: '!p-0', cellRenderer: (p: any) => <TurkishNumberInput value={p.data.alacak} onChange={v => updateSatir(p.data.key, { alacak: v, borc: 0 })} suffix="₺" className="!w-full !h-full !text-[12px] !text-right" /> },
    { headerName: '', width: 44, cellClass: '!p-0 !flex !items-center !justify-center', cellRenderer: (p: any) => <Popconfirm title="Satır silinsin mi?" okText="Sil" cancelText="Vazgeç" onConfirm={() => satirSil(p.data.key)}><Button type="text" danger size="small" icon={<DeleteOutlined />} /></Popconfirm> },
  ], [updateSatir])

  const toolbar = createToolbarButtons({ onNew: yeni, onSave: handleKaydet, onDelete: handleSil }, { save: { accent: kirli } })

  return (
    <div className="!h-full !flex !flex-col">
      <div className="!bg-white !border !border-gray-200 !rounded-sm !flex-1 !flex !flex-col !overflow-hidden">
        <CardToolbar buttons={toolbar} />
        <Spin spinning={loading || saving} classNames={{ root: '!flex-1 !min-h-0 [&_.ant-spin-container]:!h-full [&_.ant-spin-container]:!flex [&_.ant-spin-container]:!flex-col' }}>
          <div className="!px-3 !py-2 !border-b !border-gray-200 !flex-shrink-0 !grid !grid-cols-2 !gap-x-6 !gap-y-1.5">
            <div className="!flex !items-center !gap-2"><label className="!text-[11px] !w-24 !text-[#333]">Fiş Tipi</label><Input size="small" readOnly value={`${fisTipi}-${muhasebeFisTipiEtiketi(fisTipi)}`} className="!w-48" /></div>
            <div className="!flex !items-center !gap-2"><label className="!text-[11px] !w-24 !text-[#333]">K</label><Input size="small" value={k} onChange={e => setK(e.target.value)} className="!w-48" /></div>
            <div className="!flex !items-center !gap-2"><label className="!text-[11px] !w-24 !text-[#333]">Fiş No</label><Input size="small" readOnly value={fisNo != null ? String(fisNo).padStart(8, '0') : 'Otomatik'} className="!w-48" /></div>
            <div className="!flex !items-center !gap-2"><label className="!text-[11px] !w-24 !text-[#333]">Özel Kod</label><Input size="small" value={ozelKod} onChange={e => setOzelKod(e.target.value)} className="!w-48" /></div>
            <div className="!flex !items-center !gap-2"><label className="!text-[11px] !w-24 !text-[#333]">Fiş Tarihi</label><DatePicker size="small" value={fisTarihi} onChange={d => d && setFisTarihi(d)} format="DD.MM.YYYY" allowClear={false} disabled={kaynakli} className="!w-48" /></div>
            <div className="!flex !items-center !gap-2"><label className="!text-[11px] !w-24 !text-[#333]">Erişim Kodu</label><Input size="small" value={erisimKodu} onChange={e => setErisimKodu(e.target.value)} className="!w-48" /></div>
            <div className="!flex !items-center !gap-2"><label className="!text-[11px] !w-24 !text-[#333]">Belge No</label><Input size="small" value={belgeNo} onChange={e => setBelgeNo(e.target.value)} disabled={kaynakli} className="!w-48" /></div>
            <div className="!flex !items-center !gap-2"><label className="!text-[11px] !w-24 !text-[#333]">Fiş Alt Tipi</label><Select size="small" allowClear showSearch optionFilterProp="label" value={fasonTipiId ?? undefined} onChange={v => setFasonTipiId(v ?? null)} options={fasonTipleri.map(f => ({ value: f.id, label: f.ad }))} className="!w-48" /></div>
            <div className="!flex !items-center !gap-2"><label className="!text-[11px] !w-24 !text-[#333]">Masraf Yeri</label><Input size="small" value={masrafYeri} onChange={e => setMasrafYeri(e.target.value)} className="!w-48" /></div>
            <div className="!flex !items-start !gap-2"><label className="!text-[11px] !w-24 !text-[#333] !pt-1">Açıklama</label><TextArea size="small" value={aciklama} onChange={e => setAciklama(e.target.value)} autoSize={{ minRows: 1, maxRows: 2 }} disabled={kaynakli} className="!w-48" /></div>
            {kaynakli && <div className="!col-span-2 !text-[10px] !text-[#888]">Bu fiş faturadan oluşturuldu; başlık alanları fatura tarafından yönetilir.</div>}
          </div>
          <div className="!flex-1 !min-h-0 !flex !flex-col !p-3">
            <div className="!flex !items-center !justify-between !mb-1.5"><div className="!text-[10px] !font-bold !text-[#333] !uppercase">Fiş Satırları</div><Button size="small" type="dashed" icon={<PlusOutlined />} onClick={satirEkle}>Satır Ekle</Button></div>
            <div className="!flex-1 !min-h-[260px]">
              <DataGrid rowData={satirlar} columnDefs={columns} domLayout="normal" getRowId={p => p.data.key} rowSelection="single" enableColumnChooser={false} exportFileName={`muhasebe-fisi-${fisTipi}`} suppressCellFocus={false} />
            </div>
            <div className="!flex !justify-end !gap-6 !border-t !border-gray-200 !mt-2 !pt-2 !text-[11px] !tabular-nums">
              <span>Borç: <b>{formatTR(toplam.borc)}</b></span><span>Alacak: <b>{formatTR(toplam.alacak)}</b></span><span className={Math.abs(toplam.borc - toplam.alacak) < 0.01 ? '!text-green-600' : '!text-red-500'}>Fark: <b>{formatTR(toplam.borc - toplam.alacak)}</b></span>
            </div>
          </div>
        </Spin>
      </div>
    </div>
  )
}
