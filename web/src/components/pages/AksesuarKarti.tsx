'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input, Switch, App, Spin } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import SearchableMarkaSelect from '@/components/shared/SearchableMarkaSelect'
import OzellikKodlamaModal from '@/components/shared/OzellikKodlamaModal'
import type { Marka } from '@/lib/marka-api'
import type { OzellikKodlama } from '@/lib/ozellik-kodlama-api'
import { aksesuarApi, type AksesuarFormData } from '@/lib/aksesuar-api'
import { aksesuarTipiApi, type AksesuarTipi } from '@/lib/aksesuar-tipi-api'
import { numaratorApi, type Numarator } from '@/lib/numarator-api'

const emptyData: AksesuarFormData = {
  kod: '',
  ad: '',
  kullanimda: true,
  tip: 4,
  numaratorId: null,
  aksesuarTipiId: null,
  malzemeTuru: null,
  cinsi: null,
  renk: null,
  ebat: null,
  ureticiUrunKodu: null,
  markaId: null,
  ozellik1: null,
  ozellik2: null,
  ozellik3: null,
  ozellik4: null,
  derece: null,
  enOlcu: null,
  boyOlcu: null,
  kapak: null,
  micron: null,
}

interface AksesuarKartiProps {
  isNew?: boolean
  kod?: string
  selectedTipId?: number
}

export default function AksesuarKarti({ isNew, kod, selectedTipId }: AksesuarKartiProps) {
  const { message, modal } = App.useApp()
  const [form, setForm] = useState<AksesuarFormData>(emptyData)
  const [id, setId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tipList, setTipList] = useState<AksesuarTipi[]>([])
  const [numaratorlar, setNumaratorlar] = useState<Numarator[]>([])
  const [cinsiData, setCinsiData] = useState<OzellikKodlama | null>(null)
  const [renkData, setRenkData] = useState<OzellikKodlama | null>(null)
  const [ebatData, setEbatData] = useState<OzellikKodlama | null>(null)
  const [ozellik1Data, setOzellik1Data] = useState<OzellikKodlama | null>(null)
  const [ozellik2Data, setOzellik2Data] = useState<OzellikKodlama | null>(null)
  const [ozellik3Data, setOzellik3Data] = useState<OzellikKodlama | null>(null)
  const [ozellik4Data, setOzellik4Data] = useState<OzellikKodlama | null>(null)
  const [dereceData, setDereceData] = useState<OzellikKodlama | null>(null)
  const [markaAd, setMarkaAd] = useState('')
  const [cinsiModalOpen, setCinsiModalOpen] = useState(false)
  const [renkModalOpen, setRenkModalOpen] = useState(false)
  const [ebatModalOpen, setEbatModalOpen] = useState(false)
  const [ozellik1ModalOpen, setOzellik1ModalOpen] = useState(false)
  const [ozellik2ModalOpen, setOzellik2ModalOpen] = useState(false)
  const [ozellik3ModalOpen, setOzellik3ModalOpen] = useState(false)
  const [ozellik4ModalOpen, setOzellik4ModalOpen] = useState(false)
  const [dereceModalOpen, setDereceModalOpen] = useState(false)
  const [enOlcuData, setEnOlcuData] = useState<OzellikKodlama | null>(null)
  const [boyOlcuData, setBoyOlcuData] = useState<OzellikKodlama | null>(null)
  const [kapakData, setKapakData] = useState<OzellikKodlama | null>(null)
  const [micronData, setMicronData] = useState<OzellikKodlama | null>(null)
  const [enOlcuModalOpen, setEnOlcuModalOpen] = useState(false)
  const [boyOlcuModalOpen, setBoyOlcuModalOpen] = useState(false)
  const [kapakModalOpen, setKapakModalOpen] = useState(false)
  const [micronModalOpen, setMicronModalOpen] = useState(false)

  useEffect(() => {
    if (kod) {
      loadByKod(kod)
    } else {
      setForm({ ...emptyData })
      setId(null)
    }
  }, [kod])

  useEffect(() => {
    aksesuarTipiApi.list().then(setTipList).catch(() => {})
    numaratorApi.list('kumas').then(setNumaratorlar).catch(() => {})
  }, [])

  useEffect(() => {
    if (selectedTipId && tipList.length > 0 && numaratorlar.length > 0 && !id) {
      const tip = tipList.find((t) => t.id === selectedTipId)
      if (tip && tip.onEk) {
        set('aksesuarTipiId', selectedTipId)
        const n = numaratorlar.find((x) => x.onEk === tip.onEk && x.kullanimda)
        if (n) {
          set('numaratorId', n.id)
          set('kod', `${n.onEk}${String(n.sonNo + 1).padStart(3, '0')}`)
        } else {
          aksesuarApi.list().then((list) => {
            const last = list
              .filter((x: any) => x.kod?.startsWith(tip.onEk ?? ''))
              .sort((a: any, b: any) => (b.kod ?? '').localeCompare(a.kod ?? ''))[0]
            const nextNo = last ? parseInt((last.kod ?? '').replace(tip.onEk ?? '', ''), 10) + 1 : 1
            set('kod', `${tip.onEk}${String(nextNo).padStart(3, '0')}`)
          })
        }
      }
    }
  }, [selectedTipId, tipList, numaratorlar])

  useEffect(() => {
    if (!id && (form.cinsi || form.renk || form.ebat || form.ureticiUrunKodu || markaAd || form.ozellik1 || form.ozellik2 || form.ozellik3 || form.ozellik4 || form.derece || form.enOlcu || form.boyOlcu || form.kapak || form.micron)) {
      const parts = [tipAd, form.cinsi, form.renk, form.ebat, form.ureticiUrunKodu, markaAd, form.ozellik1, form.ozellik2, form.ozellik3, form.ozellik4, form.derece, form.enOlcu, form.boyOlcu, form.kapak, form.micron].filter(Boolean)
      if (parts.length > 1) {
        set('ad', parts.join(' '))
      }
    }
  }, [form.cinsi, form.renk, form.ebat, form.ureticiUrunKodu, markaAd, form.ozellik1, form.ozellik2, form.ozellik3, form.ozellik4, form.derece, form.enOlcu, form.boyOlcu, form.kapak, form.micron])

  const loadByKod = useCallback(async (k: string) => {
    setLoading(true)
    try {
      const data = await aksesuarApi.getByKod(k)
      setId(data.id)
      setForm({
        kod: data.kod,
        ad: data.ad,
        kullanimda: data.kullanimda,
        tip: 4,
        numaratorId: data.numaratorId ?? null,
        aksesuarTipiId: (data as any).aksesuarTipiId ?? null,
        malzemeTuru: data.malzemeTuru ?? null,
        cinsi: data.cinsi ?? null,
        renk: (data as any).renk ?? null,
        ebat: data.ebat ?? null,
        ureticiUrunKodu: data.ureticiUrunKodu ?? null,
        markaId: data.markaId ?? null,
        ozellik1: (data as any).ozellik1 ?? null,
        ozellik2: (data as any).ozellik2 ?? null,
        ozellik3: (data as any).ozellik3 ?? null,
        ozellik4: (data as any).ozellik4 ?? null,
        derece: (data as any).derece ?? null,
        enOlcu: (data as any).enOlcu ?? null,
        boyOlcu: (data as any).boyOlcu ?? null,
        kapak: (data as any).kapak ?? null,
        micron: (data as any).micron ?? null,
      })
    } catch {
      message.warning('Kod bulunamadı')
    } finally {
      setLoading(false)
    }
  }, [])

  const set = <K extends keyof AksesuarFormData>(key: K, value: AksesuarFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleCinsiChange = (id: number | null, record?: OzellikKodlama) => {
    setCinsiData(record ?? null)
    set('cinsi', record?.ad ?? null)
  }

  const handleRenkChange = (id: number | null, record?: OzellikKodlama) => {
    setRenkData(record ?? null)
    set('renk', record?.ad ?? null)
  }

  const handleEbatChange = (id: number | null, record?: OzellikKodlama) => {
    setEbatData(record ?? null)
    set('ebat', record?.ad ?? null)
  }

  const handleOzellik1Change = (id: number | null, record?: OzellikKodlama) => {
    setOzellik1Data(record ?? null)
    set('ozellik1', record?.ad ?? null)
  }

  const handleOzellik2Change = (id: number | null, record?: OzellikKodlama) => {
    setOzellik2Data(record ?? null)
    set('ozellik2', record?.ad ?? null)
  }

  const handleOzellik3Change = (id: number | null, record?: OzellikKodlama) => {
    setOzellik3Data(record ?? null)
    set('ozellik3', record?.ad ?? null)
  }

  const handleOzellik4Change = (id: number | null, record?: OzellikKodlama) => {
    setOzellik4Data(record ?? null)
    set('ozellik4', record?.ad ?? null)
  }

  const handleDereceChange = (id: number | null, record?: OzellikKodlama) => {
    setDereceData(record ?? null)
    set('derece', record?.ad ?? null)
  }

  const handleEnOlcuChange = (id: number | null, record?: OzellikKodlama) => {
    setEnOlcuData(record ?? null)
    set('enOlcu', record?.ad ?? null)
  }

  const handleBoyOlcuChange = (id: number | null, record?: OzellikKodlama) => {
    setBoyOlcuData(record ?? null)
    set('boyOlcu', record?.ad ?? null)
  }

  const handleKapakChange = (id: number | null, record?: OzellikKodlama) => {
    setKapakData(record ?? null)
    set('kapak', record?.ad ?? null)
  }

  const handleMicronChange = (id: number | null, record?: OzellikKodlama) => {
    setMicronData(record ?? null)
    set('micron', record?.ad ?? null)
  }

  const handleMarkaChange = (markaId: number | null, record?: Marka) => {
    set('markaId', markaId)
    setMarkaAd(record?.ad ?? '')
  }

  const handleYeni = () => {
    setId(null)
    setForm({ ...emptyData })
    setCinsiData(null)
    setRenkData(null)
    setEbatData(null)
    setOzellik1Data(null)
    setOzellik2Data(null)
    setOzellik3Data(null)
    setOzellik4Data(null)
    setDereceData(null)
    setEnOlcuData(null)
    setBoyOlcuData(null)
    setKapakData(null)
    setMicronData(null)
    setMarkaAd('')
  }

  const handleKaydet = async () => {
    if (!form.ad.trim()) { message.warning('Ad alanı zorunludur'); return }
    setSaving(true)
    try {
      if (id) {
        await aksesuarApi.update(id, form)
        message.success('Aksesuar güncellendi')
      } else {
        let payload = { ...form }
        if (form.numaratorId) {
          const res = await aksesuarApi.nextKod(form.numaratorId)
          payload.kod = res.kod
        }
        const created = await aksesuarApi.create(payload)
        setId(created.id)
        message.success('Aksesuar oluşturuldu')
      }
    } catch {
      message.error('Kayıt sırasında hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handlePrevious = async () => {
    try {
      const list = await aksesuarApi.list()
      const idx = list.findIndex((d) => d.id === id)
      if (idx <= 0) { message.info('İlk kayıttasınız'); return }
      await loadByKod(list[idx - 1].kod)
    } catch { message.warning('Önceki kayıt yüklenemedi') }
  }

  const handleNext = async () => {
    try {
      const list = await aksesuarApi.list()
      const idx = list.findIndex((d) => d.id === id)
      if (idx < 0 || idx >= list.length - 1) { message.info('Son kayıttasınız'); return }
      await loadByKod(list[idx + 1].kod)
    } catch { message.warning('Sonraki kayıt yüklenemedi') }
  }

  const handleSil = () => {
    if (!id) return
    modal.confirm({
      title: 'Aksesuar Sil',
      content: 'Bu aksesuarı silmek istediğinize emin misiniz?',
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSaving(true)
        try {
          await aksesuarApi.delete(id)
          message.success('Aksesuar silindi')
          handleYeni()
        } catch { message.error('Silme sırasında hata oluştu') }
        finally { setSaving(false) }
      },
    })
  }

  const toolbarButtons = createToolbarButtons({
    onNew: handleYeni,
    onSave: handleKaydet,
    onPrevious: handlePrevious,
    onNext: handleNext,
    onDelete: handleSil,
  })

  const tipAd = tipList.find((t) => t.id === (selectedTipId ?? form.aksesuarTipiId))?.ad ?? ''

  const tipFields: Record<string, string[]> = {
    'Ara Karton': ['cinsi', 'ebat', 'marka'],
    'Askı': ['cinsi', 'renk', 'ebat', 'ureticiKodu', 'marka', 'ozellik1'],
    'Çıt Çıt': ['cinsi', 'renk', 'ebat', 'ureticiKodu', 'ozellik1', 'ozellik2', 'marka'],
    'Etiket': ['cinsi', 'renk', 'ebat', 'ureticiKodu', 'derece', 'ozellik1', 'ozellik2', 'ozellik3', 'ozellik4'],
    'Paket Kartı': ['cinsi', 'renk', 'ureticiKodu', 'ebat', 'ozellik1', 'ozellik2', 'ozellik3', 'ozellik4'],
    'Kapaklı Poşet': ['cinsi', 'enOlcu', 'boyOlcu', 'kapak', 'micron', 'ozellik1', 'ozellik2'],
    'Koli': ['ebat', 'ozellik1'],
  }
  const fields = tipFields[tipAd] ?? ['cinsi', 'renk', 'ebat', 'ureticiKodu', 'marka', 'ozellik1']

  return (
    <div className="!h-full !flex !flex-col">
      <div className="!bg-white !border !border-gray-200 !rounded-sm !flex-1 !flex !flex-col !overflow-hidden">
        <CardToolbar buttons={toolbarButtons} />
        <Spin spinning={loading}>
          <div className="!p-4">
            <div className="!max-w-xl !space-y-3">
              <div className="!flex !items-center !gap-4">
                <div className="!flex !items-center !gap-2">
                  <label className="!text-[10px] !font-semibold !uppercase !whitespace-nowrap">Kod</label>
                  <Input size="small" value={form.kod} disabled className="!w-28 !text-[11px]" />
                </div>
                <div className="!flex !items-center !gap-2 !flex-1">
                  <label className="!text-[10px] !font-semibold !uppercase !whitespace-nowrap">Adı</label>
                  <Input size="small" value={form.ad} onChange={(e) => set('ad', e.target.value)} className="!text-[11px]" />
                </div>
                <div className="!flex !items-center !gap-2">
                  <label className="!text-[10px] !font-semibold !uppercase !whitespace-nowrap">Kullanımda</label>
                  <Switch checked={form.kullanimda} onChange={(v) => set('kullanimda', v)} />
                </div>
              </div>
              {fields.includes('cinsi') && (
              <div className="!flex !items-center !gap-2">
                <label className="!text-[10px] !font-semibold !uppercase !w-20">Cinsi</label>
                <Input size="small" value={form.cinsi ?? ''} readOnly className="!text-[11px] !max-w-xs" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => setCinsiModalOpen(true)} />} onClick={() => setCinsiModalOpen(true)} />
              </div>
              )}
              {fields.includes('enOlcu') && (
              <div className="!flex !items-center !gap-2">
                <label className="!text-[10px] !font-semibold !uppercase !w-20">En</label>
                <Input size="small" value={form.enOlcu ?? ''} readOnly className="!text-[11px] !max-w-xs" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => setEnOlcuModalOpen(true)} />} onClick={() => setEnOlcuModalOpen(true)} />
              </div>
              )}
              {fields.includes('boyOlcu') && (
              <div className="!flex !items-center !gap-2">
                <label className="!text-[10px] !font-semibold !uppercase !w-20">Boy</label>
                <Input size="small" value={form.boyOlcu ?? ''} readOnly className="!text-[11px] !max-w-xs" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => setBoyOlcuModalOpen(true)} />} onClick={() => setBoyOlcuModalOpen(true)} />
              </div>
              )}
              {fields.includes('kapak') && (
              <div className="!flex !items-center !gap-2">
                <label className="!text-[10px] !font-semibold !uppercase !w-20">Kapak</label>
                <Input size="small" value={form.kapak ?? ''} readOnly className="!text-[11px] !max-w-xs" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => setKapakModalOpen(true)} />} onClick={() => setKapakModalOpen(true)} />
              </div>
              )}
              {fields.includes('micron') && (
              <div className="!flex !items-center !gap-2">
                <label className="!text-[10px] !font-semibold !uppercase !w-20">Micron</label>
                <Input size="small" value={form.micron ?? ''} readOnly className="!text-[11px] !max-w-xs" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => setMicronModalOpen(true)} />} onClick={() => setMicronModalOpen(true)} />
              </div>
              )}
              {fields.includes('renk') && (
              <div className="!flex !items-center !gap-2">
                <label className="!text-[10px] !font-semibold !uppercase !w-20">Renk</label>
                <Input size="small" value={form.renk ?? ''} readOnly className="!text-[11px] !max-w-xs" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => setRenkModalOpen(true)} />} onClick={() => setRenkModalOpen(true)} />
              </div>
              )}
              {fields.includes('ebat') && (
              <div className="!flex !items-center !gap-2">
                <label className="!text-[10px] !font-semibold !uppercase !w-20">Ebat</label>
                <Input size="small" value={form.ebat ?? ''} readOnly className="!text-[11px] !max-w-xs" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => setEbatModalOpen(true)} />} onClick={() => setEbatModalOpen(true)} />
              </div>
              )}
              {fields.includes('ureticiKodu') && (
              <div className="!flex !items-center !gap-2">
                <label className="!text-[10px] !font-semibold !uppercase !w-20">Üretici Kodu</label>
                <Input size="small" value={form.ureticiUrunKodu ?? ''} onChange={(e) => set('ureticiUrunKodu', e.target.value || null)} className="!text-[11px] !max-w-xs" />
              </div>
              )}
              {fields.includes('marka') && (
              <div className="!flex !items-center !gap-2">
                <label className="!text-[10px] !font-semibold !uppercase !w-20">Marka</label>
                <SearchableMarkaSelect value={form.markaId} onChange={handleMarkaChange} />
              </div>
              )}
              {fields.includes('derece') && (
              <div className="!flex !items-center !gap-2">
                <label className="!text-[10px] !font-semibold !uppercase !w-20">Derece</label>
                <Input size="small" value={form.derece ?? ''} readOnly className="!text-[11px] !max-w-xs" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => setDereceModalOpen(true)} />} onClick={() => setDereceModalOpen(true)} />
              </div>
              )}
              {fields.includes('ozellik1') && (
              <div className="!flex !items-center !gap-2">
                <label className="!text-[10px] !font-semibold !uppercase !w-20">Özellik 1</label>
                <Input size="small" value={form.ozellik1 ?? ''} readOnly className="!text-[11px] !max-w-xs" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => setOzellik1ModalOpen(true)} />} onClick={() => setOzellik1ModalOpen(true)} />
              </div>
              )}
              {fields.includes('ozellik2') && (
              <div className="!flex !items-center !gap-2">
                <label className="!text-[10px] !font-semibold !uppercase !w-20">Özellik 2</label>
                <Input size="small" value={form.ozellik2 ?? ''} readOnly className="!text-[11px] !max-w-xs" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => setOzellik2ModalOpen(true)} />} onClick={() => setOzellik2ModalOpen(true)} />
              </div>
              )}
              {fields.includes('ozellik3') && (
              <div className="!flex !items-center !gap-2">
                <label className="!text-[10px] !font-semibold !uppercase !w-20">Özellik 3</label>
                <Input size="small" value={form.ozellik3 ?? ''} readOnly className="!text-[11px] !max-w-xs" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => setOzellik3ModalOpen(true)} />} onClick={() => setOzellik3ModalOpen(true)} />
              </div>
              )}
              {fields.includes('ozellik4') && (
              <div className="!flex !items-center !gap-2">
                <label className="!text-[10px] !font-semibold !uppercase !w-20">Özellik 4</label>
                <Input size="small" value={form.ozellik4 ?? ''} readOnly className="!text-[11px] !max-w-xs" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => setOzellik4ModalOpen(true)} />} onClick={() => setOzellik4ModalOpen(true)} />
              </div>
              )}
            </div>
          </div>
        </Spin>
      </div>

      <OzellikKodlamaModal open={cinsiModalOpen} kategori={`Cinsi_${tipAd}`} value={null} onChange={handleCinsiChange} onClose={() => setCinsiModalOpen(false)} />
      <OzellikKodlamaModal open={renkModalOpen} kategori={`Renk_${tipAd}`} value={null} onChange={handleRenkChange} onClose={() => setRenkModalOpen(false)} />
      <OzellikKodlamaModal open={ebatModalOpen} kategori={`Ebat_${tipAd}`} value={null} onChange={handleEbatChange} onClose={() => setEbatModalOpen(false)} />
      <OzellikKodlamaModal open={ozellik1ModalOpen} kategori={`Ozellik1_${tipAd}`} value={null} onChange={handleOzellik1Change} onClose={() => setOzellik1ModalOpen(false)} />
      <OzellikKodlamaModal open={ozellik2ModalOpen} kategori={`Ozellik2_${tipAd}`} value={null} onChange={handleOzellik2Change} onClose={() => setOzellik2ModalOpen(false)} />
      <OzellikKodlamaModal open={ozellik3ModalOpen} kategori={`Ozellik3_${tipAd}`} value={null} onChange={handleOzellik3Change} onClose={() => setOzellik3ModalOpen(false)} />
      <OzellikKodlamaModal open={ozellik4ModalOpen} kategori={`Ozellik4_${tipAd}`} value={null} onChange={handleOzellik4Change} onClose={() => setOzellik4ModalOpen(false)} />
      <OzellikKodlamaModal open={dereceModalOpen} kategori={`Derece_${tipAd}`} value={null} onChange={handleDereceChange} onClose={() => setDereceModalOpen(false)} />
      <OzellikKodlamaModal open={enOlcuModalOpen} kategori={`En_${tipAd}`} value={null} onChange={handleEnOlcuChange} onClose={() => setEnOlcuModalOpen(false)} />
      <OzellikKodlamaModal open={boyOlcuModalOpen} kategori={`Boy_${tipAd}`} value={null} onChange={handleBoyOlcuChange} onClose={() => setBoyOlcuModalOpen(false)} />
      <OzellikKodlamaModal open={kapakModalOpen} kategori={`Kapak_${tipAd}`} value={null} onChange={handleKapakChange} onClose={() => setKapakModalOpen(false)} />
      <OzellikKodlamaModal open={micronModalOpen} kategori={`Micron_${tipAd}`} value={null} onChange={handleMicronChange} onClose={() => setMicronModalOpen(false)} />
    </div>
  )
}