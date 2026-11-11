'use client'

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { Input, Switch, App, Spin, Tabs, Button, Row, Col } from 'antd'
import { SearchOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import SearchableMarkaSelect from '@/components/shared/SearchableMarkaSelect'
import OzellikKodlamaModal from '@/components/shared/OzellikKodlamaModal'
import type { Marka } from '@/lib/marka-api'
import type { OzellikKodlama } from '@/lib/ozellik-kodlama-api'
import { useKirli } from '@/lib/kirli'
import { aksesuarApi, type AksesuarFormData } from '@/lib/aksesuar-api'
import { aksesuarTipiApi, type AksesuarTipi } from '@/lib/aksesuar-tipi-api'
import { numaratorApi, type Numarator } from '@/lib/numarator-api'
import { malzemeEkApi, type MalzemeEk } from '@/lib/malzeme-ek-api'

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
  desenKodu: null,
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
  model: null,
}

const tabClass =
  '!px-3 !pt-2 !flex-1 !flex !flex-col !min-h-0 ' +
  '[&_.ant-tabs-body-holder]:!flex [&_.ant-tabs-body-holder]:!flex-col [&_.ant-tabs-body-holder]:!flex-1 [&_.ant-tabs-body-holder]:!min-h-0 ' +
  '[&_.ant-tabs-body]:!flex-1 [&_.ant-tabs-body]:!min-h-0 [&_.ant-tabs-tabpane]:!h-full ' +
  '[&_.ant-tabs-nav]:!mb-2 [&_.ant-tabs-nav]:!border-b [&_.ant-tabs-nav]:!border-gray-200 [&_.ant-tabs-nav]:!flex-shrink-0 ' +
  '[&_.ant-tabs-tab]:!text-[11px] [&_.ant-tabs-tab]:!px-2 [&_.ant-tabs-tab]:!py-1 [&_.ant-tabs-tab]:!bg-[#E0E0E0] [&_.ant-tabs-tab]:!border [&_.ant-tabs-tab]:!border-gray-200 [&_.ant-tabs-tab]:!text-[#333] ' +
  '[&_.ant-tabs-tab-active]:!bg-white [&_.ant-tabs-tab-active]:!border-t-2 [&_.ant-tabs-tab-active]:!border-t-[#FF9933] [&_.ant-tabs-tab-active]:!text-[#FF9933] ' +
  '[&_.ant-tabs-ink-bar]:!hidden'

interface AksesuarKartiProps {
  isNew?: boolean
  kod?: string
  selectedTipId?: number
  onKirliChange?: (kirli: boolean) => void
}

export default function AksesuarKarti({ isNew, kod, selectedTipId, onKirliChange }: AksesuarKartiProps) {
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

  const [dosyalar, setDosyalar] = useState<File[]>([])
  const [ekList, setEkList] = useState<MalzemeEk[]>([])
  const [selectedDosya, setSelectedDosya] = useState<{ type: 'pending'; file: File } | { type: 'existing'; ek: MalzemeEk } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDosyaSec = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const newFiles = Array.from(files)
      setDosyalar((prev) => [...prev, ...newFiles])
      setSelectedDosya({ type: 'pending', file: newFiles[0] })
    }
    e.target.value = ''
  }

  const removePendingDosya = (index: number) => {
    setDosyalar((prev) => prev.filter((_, i) => i !== index))
    setSelectedDosya((prev) => {
      if (prev?.type === 'pending') {
        const remaining = dosyalar.filter((_, i) => i !== index)
        return remaining.length > 0 ? { type: 'pending', file: remaining[0] } : null
      }
      return prev
    })
  }

  const removeExistingDosya = async (ekId: number) => {
    try {
      await malzemeEkApi.delete(ekId)
      setEkList((prev) => prev.filter((e) => e.id !== ekId))
      setSelectedDosya((prev) => {
        if (prev?.type === 'existing' && prev.ek.id === ekId) return null
        return prev
      })
    } catch {
      message.error('Dosya silinirken hata oluştu')
    }
  }

  const { kirli, temizle } = useKirli([form])
  useEffect(() => {
    onKirliChange?.(kirli)
  }, [kirli, onKirliChange])

  useEffect(() => {
    if (kod) {
      loadByKod(kod)
    } else {
      setForm({ ...emptyData })
      setId(null)
      setDosyalar([])
      setEkList([])
      setSelectedDosya(null)
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
    if (!id && (form.cinsi || form.renk || form.ebat || form.desenKodu || form.ureticiUrunKodu || markaAd || form.ozellik1 || form.ozellik2 || form.ozellik3 || form.ozellik4 || form.derece || form.enOlcu || form.boyOlcu || form.kapak || form.micron || form.model)) {
      const parts = [tipAd, form.cinsi, form.desenKodu, form.renk, form.ebat, form.ureticiUrunKodu, markaAd, form.ozellik1, form.ozellik2, form.ozellik3, form.ozellik4, form.derece, form.enOlcu, form.boyOlcu, form.kapak, form.micron, form.model].filter(Boolean)
      if (parts.length > 1) {
        set('ad', parts.join(' '))
      }
    }
  }, [form.cinsi, form.desenKodu, form.renk, form.ebat, form.ureticiUrunKodu, markaAd, form.ozellik1, form.ozellik2, form.ozellik3, form.ozellik4, form.derece, form.enOlcu, form.boyOlcu, form.kapak, form.micron, form.model])

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
          desenKodu: (data as any).desenKodu ?? null,
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
          model: (data as any).model ?? null,
        })
        temizle()
      let ekData: MalzemeEk[] = []
      try {
        ekData = await malzemeEkApi.list(data.id)
        setEkList(ekData)
      } catch {
        setEkList([])
      }
      setDosyalar([])
      setSelectedDosya(ekData.length > 0 ? { type: 'existing', ek: ekData[0] } : null)
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
    setDosyalar([])
    setEkList([])
    setSelectedDosya(null)
    temizle()
  }

  const handleKaydet = async () => {
    if (!form.ad.trim()) { message.warning('Ad alanı zorunludur'); return }
    setSaving(true)
    try {
      let currentId = id
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
        currentId = created.id
        message.success('Aksesuar oluşturuldu')
      }
      if (dosyalar.length > 0 && currentId) {
        const uploaded = await malzemeEkApi.upload(currentId, dosyalar)
        setEkList((prev) => [...uploaded, ...prev])
        setDosyalar([])
        setSelectedDosya(uploaded.length > 0 ? { type: 'existing', ek: uploaded[0] } : null)
      }
    } catch {
      message.error('Kayıt sırasında hata oluştu')
    } finally {
      setSaving(false)
      temizle()
    }
  }

  const handlePrevious = async () => {
    try {
      const list = await aksesuarApi.list()
      const idx = list.findIndex((d) => d.id === id)
      if (idx <= 0) { message.info('İlk kayıttasınız'); return }
      await loadByKod(list[idx - 1].kod)
      temizle()
    } catch { message.warning('Önceki kayıt yüklenemedi') }
  }

  const handleNext = async () => {
    try {
      const list = await aksesuarApi.list()
      const idx = list.findIndex((d) => d.id === id)
      if (idx < 0 || idx >= list.length - 1) { message.info('Son kayıttasınız'); return }
      await loadByKod(list[idx + 1].kod)
      temizle()
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
        temizle()
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
    'Dantel': ['cinsi', 'desenKodu', 'ebat'],
    'Ekstrafor': ['cinsi', 'renk', 'ozellik1', 'ebat'],
    'Fermuar': ['cinsi', 'renk', 'ebat', 'ureticiKodu', 'ozellik1', 'ozellik2', 'ozellik3'],
    'Genel': ['cinsi', 'ebat', 'renk', 'ozellik1'],
    'Grogren': ['cinsi', 'renk', 'ebat', 'ozellik1'],
    'Kordon': ['cinsi', 'ebat', 'renk', 'ozellik1', 'ozellik2', 'ozellik3'],
    'Kursör': ['cinsi', 'ebat', 'renk', 'ozellik1', 'ozellik2', 'ureticiKodu'],
    'Etiket': ['cinsi', 'renk', 'ebat', 'ureticiKodu', 'derece', 'ozellik1', 'ozellik2', 'ozellik3', 'ozellik4'],
    'Paket Kartı': ['cinsi', 'renk', 'ureticiKodu', 'ebat', 'ozellik1', 'ozellik2', 'ozellik3', 'ozellik4'],
    'Kapaklı Poşet': ['cinsi', 'enOlcu', 'boyOlcu', 'kapak', 'micron', 'ozellik1', 'ozellik2'],
    'Koli': ['ebat', 'ozellik1'],
    'Kutu': ['cinsi', 'ebat', 'renk', 'ozellik1', 'ozellik2', 'ozellik3', 'ozellik4'],
    'Lastik': ['cinsi', 'ebat', 'renk', 'ozellik1'],
    'Ponpon': ['cinsi', 'ebat'],
    'Poşet': ['cinsi', 'enOlcu', 'boyOlcu', 'renk', 'ozellik1', 'ozellik2', 'micron'],
    'Püskül': ['cinsi', 'ebat'],
    'Pvc Çanta': ['cinsi', 'ebat', 'renk', 'ozellik1', 'ozellik2', 'micron'],
    'Saçak': ['cinsi', 'ebat', 'model'],
    'Saten Kurdela': ['cinsi', 'ebat', 'renk', 'ozellik1'],
    'Sticker': ['cinsi', 'ebat', 'renk', 'marka', 'ozellik1', 'ozellik2', 'ozellik3'],
  }
  const fields = tipFields[tipAd] ?? ['cinsi', 'renk', 'ebat', 'ureticiKodu', 'marka', 'ozellik1']

  const alanSatirlari: Record<string, ReactNode> = {
    cinsi: (
      <div key="cinsi" className="!flex !items-center !gap-2">
        <label className="!text-[10px] !font-semibold !uppercase !w-20">Cinsi</label>
        <Input size="small" value={form.cinsi ?? ''} readOnly className="!text-[11px] !max-w-xs" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => setCinsiModalOpen(true)} />} onClick={() => setCinsiModalOpen(true)} />
      </div>
    ),
    renk: (
      <div key="renk" className="!flex !items-center !gap-2">
        <label className="!text-[10px] !font-semibold !uppercase !w-20">Renk</label>
        <Input size="small" value={form.renk ?? ''} readOnly className="!text-[11px] !max-w-xs" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => setRenkModalOpen(true)} />} onClick={() => setRenkModalOpen(true)} />
      </div>
    ),
    ebat: (
      <div key="ebat" className="!flex !items-center !gap-2">
        <label className="!text-[10px] !font-semibold !uppercase !w-20">Ebat</label>
        <Input size="small" value={form.ebat ?? ''} readOnly className="!text-[11px] !max-w-xs" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => setEbatModalOpen(true)} />} onClick={() => setEbatModalOpen(true)} />
      </div>
    ),
    desenKodu: (
      <div key="desenKodu" className="!flex !items-center !gap-2">
        <label className="!text-[10px] !font-semibold !uppercase !w-20">Desen Kodu</label>
        <Input size="small" value={form.desenKodu ?? ''} onChange={(e) => set('desenKodu', e.target.value || null)} className="!text-[11px] !max-w-xs" />
      </div>
    ),
    ureticiKodu: (
      <div key="ureticiKodu" className="!flex !items-center !gap-2">
        <label className="!text-[10px] !font-semibold !uppercase !w-20">Üretici Kodu</label>
        <Input size="small" value={form.ureticiUrunKodu ?? ''} onChange={(e) => set('ureticiUrunKodu', e.target.value || null)} className="!text-[11px] !max-w-xs" />
      </div>
    ),
    marka: (
      <div key="marka" className="!flex !items-center !gap-2">
        <label className="!text-[10px] !font-semibold !uppercase !w-20">Marka</label>
        <SearchableMarkaSelect value={form.markaId} onChange={handleMarkaChange} />
      </div>
    ),
    derece: (
      <div key="derece" className="!flex !items-center !gap-2">
        <label className="!text-[10px] !font-semibold !uppercase !w-20">Derece</label>
        <Input size="small" value={form.derece ?? ''} readOnly className="!text-[11px] !max-w-xs" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => setDereceModalOpen(true)} />} onClick={() => setDereceModalOpen(true)} />
      </div>
    ),
    enOlcu: (
      <div key="enOlcu" className="!flex !items-center !gap-2">
        <label className="!text-[10px] !font-semibold !uppercase !w-20">En</label>
        <Input size="small" value={form.enOlcu ?? ''} readOnly className="!text-[11px] !max-w-xs" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => setEnOlcuModalOpen(true)} />} onClick={() => setEnOlcuModalOpen(true)} />
      </div>
    ),
    boyOlcu: (
      <div key="boyOlcu" className="!flex !items-center !gap-2">
        <label className="!text-[10px] !font-semibold !uppercase !w-20">Boy</label>
        <Input size="small" value={form.boyOlcu ?? ''} readOnly className="!text-[11px] !max-w-xs" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => setBoyOlcuModalOpen(true)} />} onClick={() => setBoyOlcuModalOpen(true)} />
      </div>
    ),
    kapak: (
      <div key="kapak" className="!flex !items-center !gap-2">
        <label className="!text-[10px] !font-semibold !uppercase !w-20">Kapak</label>
        <Input size="small" value={form.kapak ?? ''} readOnly className="!text-[11px] !max-w-xs" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => setKapakModalOpen(true)} />} onClick={() => setKapakModalOpen(true)} />
      </div>
    ),
    micron: (
      <div key="micron" className="!flex !items-center !gap-2">
        <label className="!text-[10px] !font-semibold !uppercase !w-20">Micron</label>
        <Input size="small" value={form.micron ?? ''} readOnly className="!text-[11px] !max-w-xs" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => setMicronModalOpen(true)} />} onClick={() => setMicronModalOpen(true)} />
      </div>
    ),
    ozellik1: (
      <div key="ozellik1" className="!flex !items-center !gap-2">
        <label className="!text-[10px] !font-semibold !uppercase !w-20">Özellik 1</label>
        <Input size="small" value={form.ozellik1 ?? ''} readOnly className="!text-[11px] !max-w-xs" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => setOzellik1ModalOpen(true)} />} onClick={() => setOzellik1ModalOpen(true)} />
      </div>
    ),
    ozellik2: (
      <div key="ozellik2" className="!flex !items-center !gap-2">
        <label className="!text-[10px] !font-semibold !uppercase !w-20">Özellik 2</label>
        <Input size="small" value={form.ozellik2 ?? ''} readOnly className="!text-[11px] !max-w-xs" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => setOzellik2ModalOpen(true)} />} onClick={() => setOzellik2ModalOpen(true)} />
      </div>
    ),
    ozellik3: (
      <div key="ozellik3" className="!flex !items-center !gap-2">
        <label className="!text-[10px] !font-semibold !uppercase !w-20">Özellik 3</label>
        <Input size="small" value={form.ozellik3 ?? ''} readOnly className="!text-[11px] !max-w-xs" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => setOzellik3ModalOpen(true)} />} onClick={() => setOzellik3ModalOpen(true)} />
      </div>
    ),
    ozellik4: (
      <div key="ozellik4" className="!flex !items-center !gap-2">
        <label className="!text-[10px] !font-semibold !uppercase !w-20">Özellik 4</label>
        <Input size="small" value={form.ozellik4 ?? ''} readOnly className="!text-[11px] !max-w-xs" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => setOzellik4ModalOpen(true)} />} onClick={() => setOzellik4ModalOpen(true)} />
      </div>
    ),
    model: (
      <div key="model" className="!flex !items-center !gap-2">
        <label className="!text-[10px] !font-semibold !uppercase !w-20">Model</label>
        <Input size="small" value={form.model ?? ''} onChange={(e) => set('model', e.target.value || null)} className="!text-[11px] !max-w-xs" />
      </div>
    ),
  }

  const genelContent = (
    <div className="!border !border-gray-200 !rounded-sm !p-4 !w-fit">
      <div className="!flex !flex-col !gap-3 !max-w-xl">
        <div className="!flex !items-center !gap-4 !flex-wrap">
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
        {fields.map((f) => alanSatirlari[f]).filter(Boolean)}
      </div>
    </div>
  )

  const eklerContent = (
    <div className="!overflow-y-auto !overflow-x-hidden !h-full !max-h-[calc(100vh-140px)]">
      <Row gutter={16} className="!h-full">
        <Col span={6}>
          <div className="!border !border-gray-200 !rounded-sm !p-3 !h-full !flex !flex-col !gap-2">
            <Button size="small" type="primary" icon={<UploadOutlined />} onClick={handleDosyaSec} className="!text-[11px]">
              Döküman Seç
            </Button>
            <input ref={fileInputRef} type="file" multiple className="!hidden" onChange={handleFileChange} />
            <div className="!flex-1 !overflow-y-auto !space-y-1.5">
              {ekList.length === 0 && dosyalar.length === 0 ? (
                <span className="!text-[11px] !text-gray-400">Henüz dosya seçilmedi</span>
              ) : (
                <>
                  {ekList.map((ek) => (
                    <div key={`ek-${ek.id}`} className={`!flex !items-center !gap-2 !border !rounded !p-1.5 !cursor-pointer ${selectedDosya?.type === 'existing' && selectedDosya.ek.id === ek.id ? '!border-blue-400 !bg-blue-50' : '!border-gray-100 !bg-gray-50 hover:!bg-gray-100'}`} onClick={() => setSelectedDosya({ type: 'existing', ek })}>
                      {ek.mimetype.startsWith('image/') ? (
                        <img src={malzemeEkApi.getDosyaUrl(ek.id)} alt={ek.dosyaAdi} className="!w-12 !h-12 !object-cover !rounded !shrink-0" />
                      ) : (
                        <div className="!w-12 !h-12 !flex !items-center !justify-center !text-[26px] !text-gray-300 !shrink-0">📄</div>
                      )}
                      <div className="!flex-1 !min-w-0">
                        <span className="!text-[10px] !text-gray-600 !truncate !block">{ek.dosyaAdi}</span>
                        <span className="!text-[9px] !text-gray-400">{(ek.boyut / 1024).toFixed(1)} KB</span>
                      </div>
                      <DeleteOutlined className="!text-[11px] !text-red-400 !cursor-pointer !shrink-0" onClick={(e) => { e.stopPropagation(); removeExistingDosya(ek.id) }} />
                    </div>
                  ))}
                  {dosyalar.map((f, i) => (
                    <div key={`pending-${i}`} className={`!flex !items-center !gap-2 !border !rounded !p-1.5 !cursor-pointer ${selectedDosya?.type === 'pending' && selectedDosya.file === f ? '!border-blue-400 !bg-blue-50' : '!border-gray-100 !bg-gray-50 hover:!bg-gray-100'}`} onClick={() => setSelectedDosya({ type: 'pending', file: f })}>
                      {f.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(f)} alt={f.name} className="!w-12 !h-12 !object-cover !rounded !shrink-0" />
                      ) : (
                        <div className="!w-12 !h-12 !flex !items-center !justify-center !text-[26px] !text-gray-300 !shrink-0">📄</div>
                      )}
                      <div className="!flex-1 !min-w-0">
                        <span className="!text-[10px] !text-gray-600 !truncate !block">{f.name}</span>
                        <span className="!text-[9px] !text-orange-400">Kaydedilmedi</span>
                      </div>
                      <DeleteOutlined className="!text-[11px] !text-red-400 !cursor-pointer !shrink-0" onClick={(e) => { e.stopPropagation(); removePendingDosya(i) }} />
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </Col>
        <Col span={18}>
          <div className="!border !border-gray-200 !rounded-sm !p-3 !h-full !flex !items-center !justify-center !overflow-hidden !min-h-0">
            {selectedDosya ? (
              selectedDosya.type === 'pending' && selectedDosya.file.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(selectedDosya.file)} alt={selectedDosya.file.name} className="!max-w-full !max-h-full !object-contain" />
              ) : selectedDosya.type === 'existing' && selectedDosya.ek.mimetype.startsWith('image/') ? (
                <img src={malzemeEkApi.getDosyaUrl(selectedDosya.ek.id)} alt={selectedDosya.ek.dosyaAdi} className="!max-w-full !max-h-full !object-contain" />
              ) : (
                <span className="!text-[11px] !text-gray-400">
                  {selectedDosya.type === 'pending' ? selectedDosya.file.name : selectedDosya.ek.dosyaAdi}
                </span>
              )
            ) : (
              <span className="!text-[11px] !text-gray-400">Bir dosya seçin</span>
            )}
          </div>
        </Col>
      </Row>
    </div>
  )

  return (
    <div className="!h-full !flex !flex-col">
      <div className="!bg-white !border !border-gray-200 !rounded-sm !flex-1 !flex !flex-col !overflow-hidden">
        <CardToolbar buttons={toolbarButtons} />
        <Spin
          spinning={loading}
          className="!flex-1 !flex !flex-col !min-h-0 [&_.ant-spin-container]:!flex-1 [&_.ant-spin-container]:!flex [&_.ant-spin-container]:!flex-col [&_.ant-spin-container]:!min-h-0"
        >
          <Tabs
            defaultActiveKey="genel"
            size="small"
            tabBarGutter={2}
            className={tabClass}
            items={[
              { key: 'genel', label: 'Genel', children: genelContent },
              { key: 'ekler', label: 'Ekler', children: eklerContent },
            ]}
          />
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