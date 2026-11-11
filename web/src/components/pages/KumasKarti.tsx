'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Input, Switch, Select, InputNumber, App, Spin, Tabs, Button, Row, Col } from 'antd'
import { SearchOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import OzellikKodlamaModal from '@/components/shared/OzellikKodlamaModal'
import { malzemeApi, type MalzemeFormData } from '@/lib/malzeme-api'
import { malzemeEkApi, type MalzemeEk } from '@/lib/malzeme-ek-api'
import { useKirli } from '@/lib/kirli'
import { numaratorApi, type Numarator } from '@/lib/numarator-api'
import { ozellikKodlamaApi, type OzellikKodlama } from '@/lib/ozellik-kodlama-api'

const emptyData: MalzemeFormData = {
  kod: '',
  ad: '',
  kullanimda: true,
  tip: 2,
  malzemeTuru: null,
  tipi: '',
  kategori: '',
  pluKodu: '',
  rafOmru: null,
  rafOmruBirim: null,
  sezon: '',
  markaId: null,
  model: '',
  kdvGenel: null,
  kdvPerakende: null,
  kdvToptan: null,
  kdvPSatisIade: null,
  kdvTSatisIade: null,
  ekVergiTanimi: '',
  tevkifatSatinAlmaPay: null,
  tevkifatSatinAlmaPayda: null,
  tevkifatSatisPay: null,
  tevkifatSatisPayda: null,
  kullanimYeri: '',
  takipSekli: '',
  ureticiFirmaKodu: '',
  ureticiUrunKodu: '',
  isoDokumanNo: '',
  gtipNo: '',
  webSayfasi: '',
  kampanyaGrubu: '',
  fiyatGrubu: '',
  operasyonKodu: '',
  grupId: null,
  kumasTuruId: null,
  numaratorId: null,
  cinsi: '',
  grm2: null,
  ebat: '',
  en: null,
  boy: null,
  iplikBoyali: false,
  organik: false,
  ormeTipi: '',
  kumasUretimTipi: '',
  hesapBirimi: '',
  barkod: '',
}

const tabClass =
  '!px-3 !pt-2 !flex-1 !flex !flex-col !min-h-0 ' +
  '[&_.ant-tabs-body-holder]:!flex [&_.ant-tabs-body-holder]:!flex-col [&_.ant-tabs-body-holder]:!flex-1 [&_.ant-tabs-body-holder]:!min-h-0 ' +
  '[&_.ant-tabs-body]:!flex-1 [&_.ant-tabs-body]:!min-h-0 [&_.ant-tabs-tabpane]:!h-full ' +
  '[&_.ant-tabs-nav]:!mb-2 [&_.ant-tabs-nav]:!border-b [&_.ant-tabs-nav]:!border-gray-200 [&_.ant-tabs-nav]:!flex-shrink-0 ' +
  '[&_.ant-tabs-tab]:!text-[11px] [&_.ant-tabs-tab]:!px-2 [&_.ant-tabs-tab]:!py-1 [&_.ant-tabs-tab]:!bg-[#E0E0E0] [&_.ant-tabs-tab]:!border [&_.ant-tabs-tab]:!border-gray-200 [&_.ant-tabs-tab]:!text-[#333] ' +
  '[&_.ant-tabs-tab-active]:!bg-white [&_.ant-tabs-tab-active]:!border-t-2 [&_.ant-tabs-tab-active]:!border-t-[#FF9933] [&_.ant-tabs-tab-active]:!text-[#FF9933] ' +
  '[&_.ant-tabs-ink-bar]:!hidden'

interface KumasKartiProps {
  isNew?: boolean
  kod?: string
  onKirliChange?: (kirli: boolean) => void
}

export default function KumasKarti({ isNew, kod, onKirliChange }: KumasKartiProps) {
  const { message, modal } = App.useApp()
  const [form, setForm] = useState<MalzemeFormData>(emptyData)
  const [id, setId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [numaratorlar, setNumaratorlar] = useState<Numarator[]>([])
  const [turModalOpen, setTurModalOpen] = useState(false)
  const [turData, setTurData] = useState<OzellikKodlama | null>(null)
  const { kirli, temizle } = useKirli([form])
  useEffect(() => { onKirliChange?.(kirli) }, [kirli, onKirliChange])
  const adManuelRef = useRef(false)

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

  const seciliNumarator = numaratorlar.find((x) => x.id === form.numaratorId)

  const kumasAdiUret = () => {
    const parts: string[] = []
    if (seciliNumarator?.ad?.trim()) parts.push(seciliNumarator.ad.trim())
    if (turData?.ad?.trim()) parts.push(turData.ad.trim())
    if (form.grm2 != null) parts.push(`${form.grm2} gr/m2`)
    if (form.ebat?.trim()) parts.push(form.ebat.trim())
    if (form.iplikBoyali) parts.push('İpliği Boyalı')
    if (form.organik) parts.push('Organik')
    return parts.join(' ').replace(/\s+/g, ' ').trim()
  }

  useEffect(() => {
    if (adManuelRef.current) return
    const yeni = kumasAdiUret()
    setForm((prev) => (prev.ad === yeni ? prev : { ...prev, ad: yeni }))
  }, [seciliNumarator?.ad, turData?.ad, form.grm2, form.ebat, form.iplikBoyali, form.organik])

  useEffect(() => {
    if (kod) {
      loadByKod(kod)
    } else {
      adManuelRef.current = false
      setForm({ ...emptyData })
      setId(null)
      setTurData(null)
      setDosyalar([])
      setEkList([])
      setSelectedDosya(null)
    }
  }, [kod])

  useEffect(() => {
    numaratorApi.list('kumas').then(setNumaratorlar).catch(() => {})
  }, [])

  const loadByKod = useCallback(async (k: string) => {
    setLoading(true)
    adManuelRef.current = true
    try {
      const data = await malzemeApi.getByKod(k)
      setId(data.id)
      setForm({
        kod: data.kod,
        ad: data.ad,
        kullanimda: data.kullanimda,
        tip: data.tip,
        malzemeTuru: data.malzemeTuru ?? null,
        tipi: data.tipi ?? '',
        kategori: data.kategori ?? '',
        pluKodu: data.pluKodu ?? '',
        rafOmru: data.rafOmru ?? null,
        rafOmruBirim: data.rafOmruBirim ?? null,
        sezon: data.sezon ?? '',
        markaId: data.markaId ?? null,
        model: data.model ?? '',
        kdvGenel: data.kdvGenel ?? null,
        kdvPerakende: data.kdvPerakende ?? null,
        kdvToptan: data.kdvToptan ?? null,
        kdvPSatisIade: data.kdvPSatisIade ?? null,
        kdvTSatisIade: data.kdvTSatisIade ?? null,
        ekVergiTanimi: data.ekVergiTanimi ?? '',
        tevkifatSatinAlmaPay: data.tevkifatSatinAlmaPay ?? null,
        tevkifatSatinAlmaPayda: data.tevkifatSatinAlmaPayda ?? null,
        tevkifatSatisPay: data.tevkifatSatisPay ?? null,
        tevkifatSatisPayda: data.tevkifatSatisPayda ?? null,
        kullanimYeri: data.kullanimYeri ?? '',
        takipSekli: data.takipSekli ?? '',
        ureticiFirmaKodu: data.ureticiFirmaKodu ?? '',
        ureticiUrunKodu: data.ureticiUrunKodu ?? '',
        isoDokumanNo: data.isoDokumanNo ?? '',
        gtipNo: data.gtipNo ?? '',
        webSayfasi: data.webSayfasi ?? '',
        kampanyaGrubu: data.kampanyaGrubu ?? '',
        fiyatGrubu: data.fiyatGrubu ?? '',
        operasyonKodu: data.operasyonKodu ?? '',
        grupId: data.grupId ?? null,
        kumasTuruId: data.kumasTuruId ?? null,
        numaratorId: data.numaratorId ?? null,
        cinsi: data.cinsi ?? '',
        grm2: data.grm2 ?? null,
        ebat: data.ebat ?? '',
        en: data.en ?? null,
        boy: data.boy ?? null,
        iplikBoyali: data.iplikBoyali ?? false,
        organik: data.organik ?? false,
        ormeTipi: data.ormeTipi ?? '',
        kumasUretimTipi: data.kumasUretimTipi ?? '',
        hesapBirimi: data.hesapBirimi ?? '',
        barkod: data.barkod ?? '',
      })
      if (data.kumasTuruId) {
        try {
          const tur = await ozellikKodlamaApi.get(data.kumasTuruId)
          setTurData(tur)
        } catch {
          setTurData(null)
        }
      } else {
        setTurData(null)
      }
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
      temizle()
    }
  }, [])

  const set = <K extends keyof MalzemeFormData>(key: K, value: MalzemeFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleTurChange = (id: number | null, record?: OzellikKodlama) => {
    set('kumasTuruId', id)
    setTurData(record ?? null)
  }

  const handleNumaratorChange = (val: number | null) => {
    set('numaratorId', val)
    if (val) {
      const n = numaratorlar.find((x) => x.id === val)
      if (n && !id) {
        const nextKod = `${n.onEk}${String(n.sonNo + 1).padStart(3, '0')}`
        set('kod', nextKod)
      }
    } else {
      set('kod', '')
    }
  }

  const handleYeni = () => {
    setId(null)
    adManuelRef.current = false
    setForm({ ...emptyData })
    setTurData(null)
    setDosyalar([])
    setEkList([])
    setSelectedDosya(null)
  }

  const handleAdiYenidenUret = () => {
    adManuelRef.current = false
    set('ad', kumasAdiUret())
  }

  const checkDuplicate = async () => {
    const list = await malzemeApi.list(2)
    const ayni = list.filter((m) => {
      if (m.tip !== 2) return false
      if (id && m.id === id) return false // güncellemede kendisini hariç tut
      return (
        m.cinsi === form.cinsi &&
        (m.grm2 ?? null) === (form.grm2 ?? null) &&
        m.ebat === form.ebat &&
        m.iplikBoyali === form.iplikBoyali &&
        (m.kumasTuruId ?? null) === (form.kumasTuruId ?? null) &&
        m.ormeTipi === form.ormeTipi &&
        m.kumasUretimTipi === form.kumasUretimTipi
      )
    })
    return ayni[0]
  }

  const handleKaydet = async () => {
    if (!form.ad.trim()) { message.warning('Ad alanı zorunludur'); return }
    const mevcut = await checkDuplicate()
    if (mevcut) {
      message.error(`Aynı özelliklere sahip kumaş zaten kayıtlı: ${mevcut.kod}`)
      return
    }
    setSaving(true)
    try {
      let currentId = id
      if (id) {
        await malzemeApi.update(id, form)
        message.success('Kumaş başarıyla güncellendi')
      } else {
        let payload = { ...form }
        if (form.numaratorId) {
          const res = await malzemeApi.nextKod(form.numaratorId)
          payload.kod = res.kod
        }
        if (!payload.kod.trim()) { message.warning('Kod alanı zorunludur'); setSaving(false); return }
        const created = await malzemeApi.create(payload)
        numaratorApi.list('kumas').then(setNumaratorlar).catch(() => {})
        setId(created.id)
        currentId = created.id
        setForm((prev) => ({ ...prev, kod: created.kod }))
        message.success('Kumaş başarıyla oluşturuldu')
      }
      if (dosyalar.length > 0 && currentId) {
        const uploaded = await malzemeEkApi.upload(currentId, dosyalar)
        setEkList((prev) => [...uploaded, ...prev])
        setDosyalar([])
        setSelectedDosya(uploaded.length > 0 ? { type: 'existing', ek: uploaded[0] } : null)
      }
    } catch (e: any) {
      if (e?.message) {
        try {
          const parsed = JSON.parse(e.message)
          message.error(parsed.message || 'Kayıt sırasında hata oluştu')
        } catch { message.error(e.message) }
      } else { message.error('Kayıt sırasında hata oluştu') }
    } finally { setSaving(false); temizle() }
  }

  const handlePrevious = async () => {
    try {
      const list = await malzemeApi.list(2)
      const idx = list.findIndex((d) => d.kod === form.kod)
      if (idx <= 0) { message.info('İlk kayıttasınız'); return }
      await loadByKod(list[idx - 1].kod)
    } catch { message.warning('Önceki kayıt yüklenemedi') }
  }

  const handleNext = async () => {
    try {
      const list = await malzemeApi.list(2)
      const idx = list.findIndex((d) => d.kod === form.kod)
      if (idx < 0 || idx >= list.length - 1) { message.info('Son kayıttasınız'); return }
      await loadByKod(list[idx + 1].kod)
    } catch { message.warning('Sonraki kayıt yüklenemedi') }
  }

  const handleSil = () => {
    if (!id) return
    modal.confirm({
      title: 'Kumaş Sil',
      content: 'Bu kumaşı silmek istediğinize emin misiniz?',
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSaving(true)
        try {
          await malzemeApi.delete(id)
          message.success('Kumaş silindi')
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
  }, {
    save: { accent: kirli },
  })

  const ormeTipiOptions = [
    { value: 'Dokuma', label: 'Dokuma' },
    { value: 'Örme', label: 'Örme' },
  ]

  const kumasUretimTipiOptions = [
    { value: '', label: '(boş)' },
    { value: 'Açık En', label: 'Açık En' },
    { value: 'Tüp', label: 'Tüp' },
    { value: 'Maylı', label: 'Maylı' },
  ]

  const genelContent = (
    <div className="!border !border-gray-200 !rounded-sm !p-4 !w-[550px]">
      <div className="!flex !flex-col !gap-3">
        <FormField label="Türü">
          <Input
            size="small"
            value={turData?.ad ?? ''}
            className="!w-[100px] !text-[11px]"
            readOnly
            suffix={
              <SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => setTurModalOpen(true)} />
            }
            onClick={() => setTurModalOpen(true)}
          />
        </FormField>
        <FormField label="Gr/m²">
          <InputNumber size="small" min={0} value={form.grm2} onChange={(v) => set('grm2', v)} className="!w-[100px] !text-[11px]" />
        </FormField>
        <FormField label="Ebat">
          <Input size="small" value={form.ebat ?? ''} onChange={(e) => set('ebat', e.target.value)} className="!w-[100px] !text-[11px]" />
        </FormField>
        <FormField label="En">
          <InputNumber size="small" min={0} value={form.en} onChange={(v) => set('en', v)} className="!w-[100px] !text-[11px]" />
        </FormField>
        <FormField label="Boy">
          <InputNumber size="small" min={0} value={form.boy} onChange={(v) => set('boy', v)} className="!w-[100px] !text-[11px]" />
        </FormField>
        <FormField label="İplik Boyalı">
          <Switch checked={!!form.iplikBoyali} onChange={(v) => set('iplikBoyali', v)} />
        </FormField>
        <FormField label="Organik">
          <Switch checked={!!form.organik} onChange={(v) => set('organik', v)} />
        </FormField>
        <FormField label="Örme Tipi">
          <Select size="small" value={form.ormeTipi || null} onChange={(v) => set('ormeTipi', v ?? '')} className="!w-[100px] !text-[11px]" options={ormeTipiOptions} allowClear />
        </FormField>
        <FormField label="Kumaş Üretim Tipi">
          <Select size="small" value={form.kumasUretimTipi || null} onChange={(v) => set('kumasUretimTipi', v ?? '')} className="!w-[100px] !text-[11px]" options={kumasUretimTipiOptions} allowClear />
        </FormField>
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
        <Spin spinning={loading} className="!flex-1 !flex !flex-col !min-h-0 [&_.ant-spin-container]:!flex-1 [&_.ant-spin-container]:!flex [&_.ant-spin-container]:!flex-col [&_.ant-spin-container]:!min-h-0">
          <div className="!flex !flex-col !px-3 !py-2 !border-b !border-gray-200 !flex-shrink-0">
            <div className="!flex !items-center !gap-4 !flex-wrap">
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[11px] !font-semibold !text-[#333] !uppercase !w-12">Kodu</label>
                <Select
                  size="small"
                  showSearch
                  placeholder="Kod seç..."
                  className="!w-32 !text-[11px]"
                  value={form.numaratorId}
                  onChange={handleNumaratorChange}
                  labelRender={({ label }) => (form.kod ? form.kod : (label as React.ReactNode))}
                  filterOption={(input, option) =>
                    ((option?.label as string) ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={numaratorlar
                    .filter((n) => n.kullanimda)
                    .map((n) => ({ value: n.id, label: n.onEk }))}
                />
              </div>
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[11px] !font-semibold !text-[#333] !uppercase">Adı</label>
                <Input
                  size="small"
                  value={form.ad}
                  onChange={(e) => {
                    adManuelRef.current = true
                    set('ad', e.target.value)
                  }}
                  suffix={
                    <SearchOutlined
                      style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }}
                      onClick={handleAdiYenidenUret}
                    />
                  }
                  className="!w-[200px] !text-[11px]"
                />
                <span className="!text-[10px] !text-gray-500">🔍 = adı özelliklerden yeniden üret</span>
              </div>
              <Switch checked={form.kullanimda} onChange={(v) => set('kullanimda', v)} />
              <span className="!text-[11px]">Kullanımda</span>
            </div>
          </div>

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

      <OzellikKodlamaModal
        open={turModalOpen}
        kategori="kumasTuru"
        value={form.kumasTuruId}
        onChange={handleTurChange}
        onClose={() => setTurModalOpen(false)}
      />

    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="!flex !items-center !gap-2">
      <label className="!text-[10px] !font-semibold !uppercase !w-28 !text-right !shrink-0 !text-[#333]">
        {label}
      </label>
      {children}
    </div>
  )
}
