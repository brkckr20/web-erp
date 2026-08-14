'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input, Switch, Select, InputNumber, App, Spin } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import OzellikKodlamaModal from '@/components/shared/OzellikKodlamaModal'
import RaporSecimModal from '@/components/shared/RaporSecimModal'
import { malzemeApi, type MalzemeFormData } from '@/lib/malzeme-api'
import { numaratorApi, type Numarator } from '@/lib/numarator-api'
import { ozellikKodlamaApi, type OzellikKodlama } from '@/lib/ozellik-kodlama-api'
import { formSabloniApi } from '@/lib/form-sabloni-api'
import { formTasarimDoc } from '@/lib/reports/form-tasarim.report'
import { generatePdf, previewPdf } from '@/lib/reports/pdf-common'
import type { FormTasarimDraft } from '@/components/pages/form-tasarimi/types'

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
  ormeTipi: '',
  kumasUretimTipi: '',
  hesapBirimi: '',
  barkod: '',
}

interface KumasKartiProps {
  isNew?: boolean
  kod?: string
}

export default function KumasKarti({ isNew, kod }: KumasKartiProps) {
  const { message, modal } = App.useApp()
  const [form, setForm] = useState<MalzemeFormData>(emptyData)
  const [id, setId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [numaratorlar, setNumaratorlar] = useState<Numarator[]>([])
  const [turModalOpen, setTurModalOpen] = useState(false)
  const [turData, setTurData] = useState<OzellikKodlama | null>(null)
  const [raporModalAcik, setRaporModalAcik] = useState(false)
  const [sablonSecenekleri, setSablonSecenekleri] = useState<{ id: number; ad: string }[]>([])

  useEffect(() => {
    if (kod) {
      loadByKod(kod)
    } else {
      setForm({ ...emptyData })
      setId(null)
      setTurData(null)
    }
  }, [kod])

  useEffect(() => {
    numaratorApi.list('kumas').then(setNumaratorlar).catch(() => {})
  }, [])

  const loadByKod = useCallback(async (k: string) => {
    setLoading(true)
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
    } catch {
      message.warning('Kod bulunamadı')
    } finally {
      setLoading(false)
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
      if (n) {
        set('ad', n.ad)
        if (!id) {
          const nextKod = `${n.onEk}${String(n.sonNo + 1).padStart(3, '0')}`
          set('kod', nextKod)
        }
      }
    } else {
      set('ad', '')
      set('kod', '')
    }
  }

  const handleYeni = () => {
    setId(null)
    setForm({ ...emptyData })
    setTurData(null)
  }

  const handleKaydet = async () => {
    if (!form.ad.trim()) { message.warning('Ad alanı zorunludur'); return }
    setSaving(true)
    try {
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
        setForm((prev) => ({ ...prev, kod: created.kod }))
        message.success('Kumaş başarıyla oluşturuldu')
      }
    } catch (e: any) {
      if (e?.message) {
        try {
          const parsed = JSON.parse(e.message)
          message.error(parsed.message || 'Kayıt sırasında hata oluştu')
        } catch { message.error(e.message) }
      } else { message.error('Kayıt sırasında hata oluştu') }
    } finally { setSaving(false) }
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

  const raporVerisiTopla = async (sablonId: number, malzemeId: number) => {
    const d = await formSabloniApi.getById(sablonId)
    const draft: FormTasarimDraft = {
      id: String(d.id),
      ad: d.ad,
      ekranTuru: d.ekranTuru,
      sorgular: (d.sorgular as FormTasarimDraft['sorgular']) ?? [],
      layout: (d.layout as FormTasarimDraft['layout']) ?? [],
      sayfa: (d.sayfa as FormTasarimDraft['sayfa']) ?? { boyut: 'A4', yon: 'dikey', kenarUst: 8, kenarAlt: 8, kenarSol: 10, kenarSag: 10 },
      sablonId: d.id,
      kod: d.kod,
    }
    const veri: Record<number, Record<string, unknown>[]> = {}
    for (const s of draft.sorgular) {
      if (!s.sorguMetni?.trim()) continue
      try {
        const sonuc = await formSabloniApi.sorguTest({ sorguMetni: s.sorguMetni, parametreler: { id: malzemeId } })
        veri[s.sirano] = sonuc.satirlar
      } catch {
        veri[s.sirano] = []
      }
    }
    return { draft, veri }
  }

  const handleRapor = async () => {
    if (!id) {
      modal.warning({ title: 'Yazdırma', content: 'Kartı yazdırmak için önce kaydetmelisiniz.' })
      return
    }
    try {
      const list = await formSabloniApi.listByEkranTuru('Kumaş Kartları')
      if (list.length === 0) {
        modal.info({
          title: 'Form tasarımı yok',
          content:
            'Bu ekran için form tasarımı bulunamadı. Form Tasarımı ekranından "Kumaş Kartları" için bir form hazırlayıp kaydedin.',
        })
        return
      }
      setSablonSecenekleri(list.map((f) => ({ id: f.id, ad: f.ad })))
      setRaporModalAcik(true)
    } catch {
      message.error('Form şablonları yüklenemedi')
    }
  }

  const handleSabloniOnizle = async (sablonId: number) => {
    if (!id) {
      modal.warning({ title: 'Yazdırma', content: 'Kartı yazdırmak için önce kaydetmelisiniz.' })
      return
    }
    try {
      const { draft, veri } = await raporVerisiTopla(sablonId, id)
      await previewPdf(formTasarimDoc(draft, veri))
    } catch (e) {
      message.error('Rapor hazırlanamadı: ' + (e instanceof Error ? e.message : 'bilinmeyen hata'))
    }
  }

  const handleSabloniIndir = async (sablonId: number) => {
    if (!id) {
      modal.warning({ title: 'Yazdırma', content: 'Kartı yazdırmak için önce kaydetmelisiniz.' })
      return
    }
    try {
      const { draft, veri } = await raporVerisiTopla(sablonId, id)
      await generatePdf(formTasarimDoc(draft, veri), `kumas-karti-${form.kod || 'yeni'}.pdf`)
    } catch (e) {
      message.error('Rapor indirilemedi: ' + (e instanceof Error ? e.message : 'bilinmeyen hata'))
    }
  }

  const toolbarButtons = createToolbarButtons({
    onNew: handleYeni,
    onSave: handleKaydet,
    onPrevious: handlePrevious,
    onNext: handleNext,
    onDelete: handleSil,
    onReport: handleRapor,
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

  return (
    <div className="!h-full !flex !flex-col">
      <div className="!bg-white !border !border-gray-200 !rounded-sm !flex-1 !flex !flex-col !overflow-hidden">
        <CardToolbar buttons={toolbarButtons} />
        <Spin spinning={loading}>
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
                <Input size="small" value={form.ad} onChange={(e) => set('ad', e.target.value)} className="!w-[200px] !text-[11px]" />
              </div>
              <Switch checked={form.kullanimda} onChange={(v) => set('kullanimda', v)} />
              <span className="!text-[11px]">Kullanımda</span>
            </div>
          </div>

          <div className="!p-3 !overflow-y-auto !flex-1">
            <div className="!border !border-gray-200 !rounded-sm !p-3">
              <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">Kumaş Bilgileri</div>
              <div className="!grid !grid-cols-3 !gap-x-6 !gap-y-2.5">
                <FormField label="Türü">
                  <Input
                    size="small"
                    value={turData?.ad ?? ''}
                    className="!text-[11px]"
                    readOnly
                    suffix={
                      <SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => setTurModalOpen(true)} />
                    }
                    onClick={() => setTurModalOpen(true)}
                  />
                </FormField>
                <FormField label="Cinsi">
                  <Input size="small" value={form.cinsi ?? ''} onChange={(e) => set('cinsi', e.target.value)} className="!text-[11px]" />
                </FormField>
                <FormField label="Gr/m²">
                  <InputNumber size="small" min={0} value={form.grm2} onChange={(v) => set('grm2', v)} className="!w-full !text-[11px]" />
                </FormField>
                <FormField label="Ebat">
                  <Input size="small" value={form.ebat ?? ''} onChange={(e) => set('ebat', e.target.value)} className="!text-[11px]" />
                </FormField>
                <FormField label="En">
                  <InputNumber size="small" min={0} value={form.en} onChange={(v) => set('en', v)} className="!w-full !text-[11px]" />
                </FormField>
                <FormField label="Boy">
                  <InputNumber size="small" min={0} value={form.boy} onChange={(v) => set('boy', v)} className="!w-full !text-[11px]" />
                </FormField>
                <FormField label="İplik Boyalı">
                  <Switch checked={!!form.iplikBoyali} onChange={(v) => set('iplikBoyali', v)} />
                </FormField>
                <FormField label="Örme Tipi">
                  <Select size="small" value={form.ormeTipi || null} onChange={(v) => set('ormeTipi', v ?? '')} className="!w-full !text-[11px]" options={ormeTipiOptions} allowClear />
                </FormField>
                <FormField label="Kumaş Üretim Tipi">
                  <Select size="small" value={form.kumasUretimTipi || null} onChange={(v) => set('kumasUretimTipi', v ?? '')} className="!w-full !text-[11px]" options={kumasUretimTipiOptions} allowClear />
                </FormField>
              </div>
            </div>
          </div>
        </Spin>
      </div>

      <OzellikKodlamaModal
        open={turModalOpen}
        kategori="kumasTuru"
        value={form.kumasTuruId}
        onChange={handleTurChange}
        onClose={() => setTurModalOpen(false)}
      />

      <RaporSecimModal
        open={raporModalAcik}
        baslik={form.kod ? `Kumaş Kartı — ${form.kod}` : 'Kumaş Kartı'}
        tasarimlar={sablonSecenekleri.map((s) => ({
          id: String(s.id),
          label: s.ad,
          aciklama: 'Form tasarım editöründe hazırlandı',
        }))}
        onCancel={() => setRaporModalAcik(false)}
        onOnizle={(id) => handleSabloniOnizle(Number(id))}
        onIndir={(id) => handleSabloniIndir(Number(id))}
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
