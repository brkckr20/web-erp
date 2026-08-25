'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { App, AutoComplete, Button, Input, Slider, Tabs } from 'antd'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from '@dnd-kit/core'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import { previewPdf } from '@/lib/reports/pdf-common'
import { formTasarimDoc } from '@/lib/reports/form-tasarim.report'
import { formSabloniApi } from '@/lib/form-sabloni-api'
import { modules } from '@/data/modules'
import type {
  Band,
  BandHucre,
  BandTipi,
  BilesenTipi,
  FormSorguDraft,
  FormTasarimDraft,
  HucreStil,
  Secim,
  TabloKolon,
} from './form-tasarimi/types'
import { bandTipiAdlari, bandTipiSirasi, bosForm, uidYeni, yeniBand } from './form-tasarimi/mock'
import { BOYUT_MM, OLCU, yuvarla } from './form-tasarimi/sabitler'
import BandSection from './form-tasarimi/BandSection'
import SayfaAyariPanel from './form-tasarimi/SayfaAyariPanel'
import Ozellikler from './form-tasarimi/Ozellikler'
import SorguPaneli from './form-tasarimi/SorguPaneli'
import SolPanel from './form-tasarimi/SolPanel'

type DragVeri = { tur?: 'alan' | 'bilesen' | 'eleman'; alan?: string; bilesen?: BilesenTipi; bandId?: string; hucreId?: string }

interface ResizeState {
  bandId: string
  hucreId: string
  basX: number
  basY: number
  basE: BandHucre
}

interface SurukBas {
  bandId: string
  hucreId: string
  bas: BandHucre
}

export default function FormTasarimi({ baslangicForm }: { baslangicForm?: FormTasarimDraft }) {
  const { message, modal } = App.useApp()
  const [form, setForm] = useState<FormTasarimDraft>(() => baslangicForm ?? bosForm())
  const [sekme, setSekme] = useState<'sorgular' | 'tasarim'>('sorgular')
  const [secili, setSecili] = useState<Secim | null>(null)
  const [calisiyorSorguId, setCalisiyorSorguId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const resizeRef = useRef<ResizeState | null>(null)
  const surukBasRef = useRef<SurukBas | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 3 } }))

  const formGuncelle = (updater: (f: FormTasarimDraft) => FormTasarimDraft) => {
    setForm((prev) => updater(structuredClone(prev)))
  }

  const elemanPatch = (bandId: string, hucreId: string, patch: Partial<BandHucre>) => {
    formGuncelle((f) => ({
      ...f,
      layout: f.layout.map((b) =>
        b.id === bandId ? { ...b, elemanlar: b.elemanlar.map((e) => (e.id === hucreId ? { ...e, ...patch } : e)) } : b,
      ),
    }))
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = resizeRef.current
      if (!d) return
      const dx = (e.clientX - d.basX) / OLCU
      const dy = (e.clientY - d.basY) / OLCU
      elemanPatch(d.bandId, d.hucreId, {
        genislik: yuvarla(Math.max(10, d.basE.genislik + dx)),
        yukseklik: yuvarla(Math.max(5, d.basE.yukseklik + dy)),
      })
    }
    const onUp = () => {
      resizeRef.current = null
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const yeniForm = () => {
    setForm(bosForm())
    setSecili(null)
    setSekme('sorgular')
    message.info('Yeni form başlatıldı.')
  }

  const kaydet = async () => {
    if (!form.ad.trim()) {
      message.warning('Form adı boş olamaz.')
      return
    }
    const kod = form.kod?.trim() || form.ekranTuru?.trim() || form.ad.trim().toLowerCase().replace(/\s+/g, '-')
    const dto = {
      kod,
      ad: form.ad.trim(),
      ekranTuru: form.ekranTuru.trim() || 'genel',
      sorgular: form.sorgular,
      layout: form.layout,
      sayfa: form.sayfa,
    }
    try {
      if (form.sablonId != null) {
        await formSabloniApi.update(form.sablonId, dto)
        message.success('Form şablonu güncellendi.')
      } else {
        const sonuc = await formSabloniApi.create(dto)
        setForm((f) => ({ ...f, sablonId: sonuc.id, kod }))
        message.success('Form şablonu kaydedildi.')
      }
    } catch (e) {
      message.error(`Kaydedilemedi: ${e instanceof Error ? e.message : 'bilinmeyen hata'}`)
    }
  }

  const formSil = () => {
    if (form.sablonId == null) {
      setForm(bosForm())
      setSecili(null)
      setSekme('sorgular')
      message.info('Form sıfırlandı.')
      return
    }
    modal.confirm({
      title: 'Form şablonu silinsin mi?',
      content: `"${form.ad}" şablonu kalıcı olarak silinecek.`,
      okText: 'Sil',
      okButtonProps: { danger: true },
      cancelText: 'Vazgeç',
      onOk: async () => {
        try {
          await formSabloniApi.remove(form.sablonId!)
          setForm(bosForm())
          setSecili(null)
          setSekme('sorgular')
          message.success('Form şablonu silindi.')
        } catch {
          message.error('Silinemedi.')
        }
      },
    })
  }

  const onizle = async () => {
    try {
      const veri: Record<number, Record<string, unknown>[]> = {}
      for (const s of form.sorgular) if (s.satirlar?.length) veri[s.sirano] = s.satirlar
      await previewPdf(formTasarimDoc(form, veri))
    } catch {
      message.error('PDF oluşturulamadı.')
    }
  }

  // ---- Sorgular ----
  const sorguGuncelle = (sorguId: string, patch: Partial<FormSorguDraft>) => {
    formGuncelle((f) => ({
      ...f,
      sorgular: f.sorgular.map((s) => (s.id === sorguId ? { ...s, ...patch } : s)),
    }))
  }

  const sorguCalistir = async (sorguId: string) => {
    const s = form.sorgular.find((x) => x.id === sorguId)
    if (!s) return
    if (!s.sorguMetni.trim()) {
      message.warning('Önce SQL sorgusunu yaz.')
      return
    }
    setCalisiyorSorguId(sorguId)
    try {
      const sonuc = await formSabloniApi.sorguTest({ sorguMetni: s.sorguMetni })
      sorguGuncelle(sorguId, {
        kolonlar: sonuc.kolonlar,
        satirlar: sonuc.satirlar,
        hata: undefined,
        demoSonuc: true,
      })
      if (sonuc.kolonlar.length > 0) {
        message.success(`${sonuc.kolonlar.length} kolon yüklendi — sol panelde görünecek.`)
      } else {
        message.info('Sorgu çalıştı ama kolon dönmedi.')
      }
    } catch (e) {
      sorguGuncelle(sorguId, { hata: e instanceof Error ? e.message : 'Sorgu çalıştırılamadı.' })
    } finally {
      setCalisiyorSorguId(null)
    }
  }

  // ---- Layout ----
  const bandGuncelle = (bandId: string, patch: Partial<Band>) => {
    formGuncelle((f) => ({
      ...f,
      layout: f.layout.map((b) => (b.id === bandId ? { ...b, ...patch } : b)),
    }))
  }

  const bandPatch = (bandId: string, patch: Partial<Band>) => bandGuncelle(bandId, patch)

  const bandSil = (bandId: string) => {
    if (secili && secili.bandId === bandId) setSecili(null)
    formGuncelle((f) => ({ ...f, layout: f.layout.filter((b) => b.id !== bandId) }))
  }

  const bandTasi = (bandId: string, yon: -1 | 1) => {
    formGuncelle((f) => {
      const idx = f.layout.findIndex((b) => b.id === bandId)
      const yeni = idx + yon
      if (yeni < 0 || yeni >= f.layout.length) return f
      const dizi = [...f.layout]
      const [b] = dizi.splice(idx, 1)
      dizi.splice(yeni, 0, b)
      return { ...f, layout: dizi }
    })
  }

  const bandEkle = (tip: BandTipi) => {
    formGuncelle((f) => ({ ...f, layout: [...f.layout, yeniBand(tip)] }))
  }

  const elemanEkle = (bandId: string) => {
    formGuncelle((f) => ({
      ...f,
      layout: f.layout.map((b) =>
        b.id === bandId
          ? { ...b, elemanlar: [...b.elemanlar, { id: uidYeni(), x: 0, y: 0, genislik: 60, yukseklik: 8 }] }
          : b,
      ),
    }))
  }

  const elemanSil = (bandId: string, hucreId: string) => {
    if (secili && secili.tur === 'hucre' && secili.bandId === bandId && secili.hucreId === hucreId) setSecili(null)
    formGuncelle((f) => ({
      ...f,
      layout: f.layout.map((b) =>
        b.id === bandId ? { ...b, elemanlar: b.elemanlar.filter((e) => e.id !== hucreId) } : b,
      ),
    }))
  }

  const elemanEkleAlan = (bandId: string, alan: string, x: number, y: number) => {
    formGuncelle((f) => ({
      ...f,
      layout: f.layout.map((b) =>
        b.id === bandId
          ? { ...b, elemanlar: [...b.elemanlar, { id: uidYeni(), x, y, genislik: 60, yukseklik: 8, alan: alan || undefined }] }
          : b,
      ),
    }))
  }

  const BILESEN_VARSAYILAN: Record<BilesenTipi, { genislik: number; yukseklik: number }> = {
    veri: { genislik: 60, yukseklik: 8 },
    metin: { genislik: 80, yukseklik: 8 },
    checkbox: { genislik: 50, yukseklik: 8 },
    resim: { genislik: 50, yukseklik: 40 },
    tablo: { genislik: 90, yukseklik: 30 },
    barkod: { genislik: 50, yukseklik: 20 },
  }

  const elemanEkleBilesen = (bandId: string, bilesen: BilesenTipi, x: number, y: number) => {
    const varsayilan = BILESEN_VARSAYILAN[bilesen]
    formGuncelle((f) => ({
      ...f,
      layout: f.layout.map((b) =>
        b.id === bandId
          ? {
              ...b,
              elemanlar: [
                ...b.elemanlar,
                {
                  id: uidYeni(),
                  x,
                  y,
                  genislik: varsayilan.genislik,
                  yukseklik: varsayilan.yukseklik,
                  bilesen,
                  etiket: bilesen === 'checkbox' ? 'Seçenek' : undefined,
                },
              ],
            }
          : b,
      ),
    }))
  }

  const boyutBasla = (e: ReactMouseEvent, bandId: string, hucreId: string) => {
    const b = form?.layout.find((x) => x.id === bandId)
    const el = b?.elemanlar.find((x) => x.id === hucreId)
    if (!el) return
    e.preventDefault()
    e.stopPropagation()
    resizeRef.current = { bandId, hucreId, basX: e.clientX, basY: e.clientY, basE: el }
  }

  const stilPatch = (bandId: string, hucreId: string, patch: Partial<HucreStil>) => {
    const band = form?.layout.find((b) => b.id === bandId)
    if (!band) return
    const hucre = band.elemanlar.find((h) => h.id === hucreId)
    if (!hucre) return
    elemanPatch(bandId, hucreId, { stil: { ...(hucre.stil ?? {}), ...patch } })
  }

  const kolonGuncelle = (bandId: string, kolonId: string, patch: Partial<TabloKolon>) => {
    const band = form?.layout.find((b) => b.id === bandId)
    if (!band) return
    bandGuncelle(bandId, {
      tabloKolonlari: (band.tabloKolonlari ?? []).map((k) => (k.id === kolonId ? { ...k, ...patch } : k)),
    })
  }

  const kolonEkleAlan = (bandId: string, alan: string) => {
    const band = form?.layout.find((b) => b.id === bandId)
    if (!band) return
    bandGuncelle(bandId, { tabloKolonlari: [...(band.tabloKolonlari ?? []), { id: uidYeni(), alan: alan || undefined }] })
  }

  const kolonSil = (bandId: string, kolonId: string) => {
    if (secili && secili.tur === 'kolon' && secili.kolonId === kolonId) setSecili(null)
    const band = form?.layout.find((b) => b.id === bandId)
    if (!band) return
    bandGuncelle(bandId, { tabloKolonlari: (band.tabloKolonlari ?? []).filter((k) => k.id !== kolonId) })
  }

  const sorguSec = (bandId: string, sorguId: string) => {
    bandGuncelle(bandId, { sorguId })
  }

  // ---- dnd-kit ----
  const onDragStart = (e: DragStartEvent) => {
    const veri = e.active.data.current as DragVeri | undefined
    if (veri?.tur === 'eleman' && veri.bandId && veri.hucreId) {
      const b = form.layout.find((x) => x.id === veri.bandId)
      const el = b?.elemanlar.find((x) => x.id === veri.hucreId)
      if (el) surukBasRef.current = { bandId: veri.bandId, hucreId: veri.hucreId, bas: el }
    }
  }

  const onDragMove = (e: DragMoveEvent) => {
    const veri = e.active.data.current as DragVeri | undefined
    if (veri?.tur === 'eleman' && surukBasRef.current) {
      const { bandId, hucreId, bas } = surukBasRef.current
      elemanPatch(bandId, hucreId, {
        x: yuvarla(Math.max(0, bas.x + e.delta.x / OLCU)),
        y: yuvarla(Math.max(0, bas.y + e.delta.y / OLCU)),
      })
    }
  }

  const onDragEnd = (e: DragEndEvent) => {
    const veri = e.active.data.current as DragVeri | undefined
    surukBasRef.current = null
    if (!veri || !e.over) return
    const ref = String(e.over.id)
    const bandHedefi = ref.startsWith('band:') ? ref.slice(5) : null

    if (veri.tur === 'bilesen' && veri.bilesen && bandHedefi) {
      const av = e.activatorEvent as MouseEvent
      const rect = e.over.rect
      const x = yuvarla(Math.max(0, (av.clientX + e.delta.x - rect.left) / (OLCU * zoom) - 20))
      const y = yuvarla(Math.max(0, (av.clientY + e.delta.y - rect.top) / (OLCU * zoom) - 4))
      elemanEkleBilesen(bandHedefi, veri.bilesen, x, y)
      return
    }

    if (veri.tur === 'alan') {
      if (bandHedefi) {
        const av = e.activatorEvent as MouseEvent
        const px = av.clientX + e.delta.x
        const py = av.clientY + e.delta.y
        const rect = e.over.rect
        const x = yuvarla(Math.max(0, (px - rect.left) / (OLCU * zoom) - 30))
        const y = yuvarla(Math.max(0, (py - rect.top) / (OLCU * zoom) - 4))
        elemanEkleAlan(bandHedefi, veri.alan ?? '', x, y)
      } else if (ref.startsWith('kolon:')) {
        const [, bandId, kolonId] = ref.split(':')
        kolonGuncelle(bandId, kolonId, { alan: veri.alan })
      } else if (ref.startsWith('yeni-kolon:')) {
        const bandId = ref.slice('yeni-kolon:'.length)
        kolonEkleAlan(bandId, veri.alan ?? '')
      }
    } else if (veri.tur === 'eleman') {
      if (veri.bandId && veri.hucreId) setSecili({ tur: 'hucre', bandId: veri.bandId, hucreId: veri.hucreId })
    }
  }

  // ---- Türetilmiş ----
  const alanSecenekler = useMemo(() => {
    return form.sorgular.flatMap((s) =>
      s.kolonlar.map((k) => ({ value: `S${s.sirano}.${k}`, label: `S${s.sirano}.${k}` })),
    )
  }, [form])

  const kullanilabilirBandTipleri = useMemo(() => {
    const mevcut = new Set(form.layout.map((b) => b.tip))
    return bandTipiSirasi.filter((t) => !mevcut.has(t))
  }, [form])

  const ekranTuruSecenekleri = useMemo(() => {
    const set = new Set<string>()
    modules.forEach((m) => m.categories.forEach((c) => c.items.forEach((i) => set.add(i.label))))
    return Array.from(set).map((v) => ({ value: v }))
  }, [])

  // Sorgular sekmesinde "Çalıştır" ile doldurulan örnek satırlar tuvalde canlı önizleme için kullanılır.
  const ornekVeri = useMemo(() => {
    const v: Record<number, Record<string, unknown>[]> = {}
    for (const s of form.sorgular) if (s.satirlar?.length) v[s.sirano] = s.satirlar
    return v
  }, [form])

  const sayfa = form.sayfa
  const varsayilan = BOYUT_MM[sayfa.boyut] ?? BOYUT_MM.A4
  const g = sayfa.boyut === 'Ozel' && sayfa.ozelGenislik ? sayfa.ozelGenislik : varsayilan[0]
  const y = sayfa.boyut === 'Ozel' && sayfa.ozelYukseklik ? sayfa.ozelYukseklik : varsayilan[1]
  const kagitGenislik = (sayfa.yon === 'yatay' ? y : g) * OLCU
  const kagitYukseklik = (sayfa.yon === 'yatay' ? g : y) * OLCU

  return (
    <div className="!h-full !flex !flex-col !overflow-hidden">
      <div style={{ marginLeft: -12, marginRight: -12 }}>
        <CardToolbar
          buttons={createToolbarButtons(
            { onNew: yeniForm, onSave: kaydet, onDelete: formSil, onReport: onizle },
            { report: { label: 'PDF Önizle', onClick: onizle, disabled: form.layout.length === 0 } },
          )}
        />
      </div>

      <div className="!flex !items-center !gap-2 !px-3 !py-1.5 !bg-white !border-b !border-gray-200">
        <span className="!text-[10px] !text-[#9ca3af]">Form Adı:</span>
        <Input
          size="small"
          className="!w-44"
          value={form.ad}
          placeholder="Form adı"
          onChange={(e) => formGuncelle((f) => ({ ...f, ad: e.target.value }))}
        />
        <span className="!text-[10px] !text-[#9ca3af] !ml-2">Ekran Türü:</span>
        <AutoComplete
          size="small"
          className="!w-48"
          value={form.ekranTuru}
          options={ekranTuruSecenekleri}
          onChange={(v) => formGuncelle((f) => ({ ...f, ekranTuru: v }))}
          placeholder="ör. Stok Hareket Fişleri"
          filterOption={(input, option) => (option?.value ?? '').toLowerCase().includes(input.toLowerCase())}
        />
      </div>

      <div className="!flex-1 !min-h-0 !flex">
        <Tabs
          size="small"
          className="!flex-1 !min-h-0 !flex !flex-col [&_.ant-tabs-content-holder]:!flex [&_.ant-tabs-content]:!flex-1 [&_.ant-tabs-content-holder]:!min-h-0 [&_.ant-tabs-content]:!min-h-0 [&_.ant-tabs-nav]:!mb-0 [&_.ant-tabs-nav]:!px-2 [&_.ant-tabs-nav]:!bg-white [&_.ant-tabs-tab]:!text-[11px]"
          activeKey={sekme}
          onChange={(k) => setSekme(k as 'sorgular' | 'tasarim')}
          items={[
            {
              key: 'sorgular',
              label: 'Sorgular',
              children: (
                <SorguPaneli
                  form={form}
                  calisiyorSorguId={calisiyorSorguId}
                  onSorguGuncelle={sorguGuncelle}
                  onSorguCalistir={sorguCalistir}
                />
              ),
            },
            {
              key: 'tasarim',
              label: 'Tasarım',
              children: (
                <div className="!h-full !flex !flex-col !overflow-hidden">
                  <SayfaAyariPanel sayfa={sayfa} onChange={(p) => formGuncelle((f) => ({ ...f, sayfa: { ...f.sayfa, ...p } }))} />
                  <DndContext sensors={sensors} onDragStart={onDragStart} onDragMove={onDragMove} onDragEnd={onDragEnd}>
                    <div className="!flex-1 !min-h-0 !flex">
                      <div className="!w-52 !border-r !border-gray-300 !bg-[#f7f7f7] !flex !flex-col !overflow-hidden">
                        <div className="!text-[10px] !font-semibold !text-[#6b7280] !uppercase !px-2 !py-1.5 !bg-white !border-b !border-gray-200">
                          Bileşenler
                        </div>
                        <SolPanel alanlar={alanSecenekler} />
                      </div>

                      <div className="!flex-1 !min-h-0 !overflow-auto !bg-[#e2e5ea] !p-4 !relative">
                        <div className="!mx-auto" style={{ width: kagitGenislik * zoom, height: kagitYukseklik * zoom }}>
                          <div
                            className="!bg-white"
                            style={{
                              width: kagitGenislik,
                              height: kagitYukseklik,
                              padding: `${sayfa.kenarUst * OLCU}px ${sayfa.kenarSag * OLCU}px ${sayfa.kenarAlt * OLCU}px ${sayfa.kenarSol * OLCU}px`,
                              boxShadow: '0 0 0 1px #cbd5e1, 0 4px 12px rgba(0,0,0,0.08)',
                              transform: `scale(${zoom})`,
                              transformOrigin: 'top left',
                              overflow: 'hidden',
                            }}
                          >
                            <div className="!flex !flex-col !gap-1.5">
                              {form.layout.map((b, i) => (
                                <BandSection
                                  key={b.id}
                                  band={b}
                                  index={i}
                                  total={form.layout.length}
                                  secili={secili}
                                  ornekVeri={ornekVeri}
                                  onSec={() => setSecili({ tur: 'band', bandId: b.id })}
                                  onSeciliHucre={(bandId, hucreId) => setSecili({ tur: 'hucre', bandId, hucreId })}
                                  onBoyutBasla={boyutBasla}
                                  onElemanSil={elemanSil}
                                  onYukari={() => bandTasi(b.id, -1)}
                                  onAsagi={() => bandTasi(b.id, 1)}
                                  onSil={() => bandSil(b.id)}
                                  onElemanEkle={elemanEkle}
                                  onSelectKolon={(kolonId) => setSecili({ tur: 'kolon', bandId: b.id, kolonId })}
                                />
                              ))}
                              {kullanilabilirBandTipleri.length > 0 && (
                                <div className="!flex !items-center !gap-1 !py-1">
                                  <span className="!text-[10px] !text-[#6b7280]">Band ekle:</span>
                                  {kullanilabilirBandTipleri.map((t) => (
                                    <Button key={t} size="small" className="!h-5 !text-[10px]" onClick={() => bandEkle(t)}>
                                      + {bandTipiAdlari[t]}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="!absolute !top-2 !right-2 !z-10 !flex !items-center !gap-2 !px-3 !py-1.5 !bg-white !rounded-full !shadow-lg !border !border-gray-200">
                          <span className="!text-[10px] !text-[#6b7280]">Yakınlaştır</span>
                          <Slider
                            className="!w-40 !m-0"
                            min={0.5}
                            max={2}
                            step={0.05}
                            value={zoom}
                            onChange={setZoom}
                            tooltip={{ formatter: (v) => `${Math.round((v ?? 1) * 100)}%` }}
                          />
                          <span className="!text-[10px] !font-semibold !text-[#374151] !w-10 !text-right">{Math.round(zoom * 100)}%</span>
                          <Button size="small" className="!h-5 !text-[10px]" onClick={() => setZoom(1)}>
                            Sıfırla
                          </Button>
                        </div>
                      </div>

                      <div className="!w-64 !border-l !border-gray-300 !bg-[#f7f7f7] !flex !flex-col !overflow-hidden">
                        <div className="!text-[10px] !font-semibold !text-[#6b7280] !uppercase !px-2 !py-1.5 !bg-white !border-b !border-gray-200">
                          Özellikler
                        </div>
                        <div className="!flex-1 !min-h-0 !overflow-y-auto">
                          <Ozellikler
                            form={form}
                            secili={secili}
                            alanSecenekler={alanSecenekler}
                            onBandPatch={bandPatch}
                            onHucrePatch={elemanPatch}
                            onElemanSil={elemanSil}
                            onStilPatch={stilPatch}
                            onKolonPatch={kolonGuncelle}
                            onKolonEkleAlan={kolonEkleAlan}
                            onKolonSil={kolonSil}
                            onSorguSec={sorguSec}
                            onSeciliKolon={(bandId, kolonId) => setSecili({ tur: 'kolon', bandId, kolonId })}
                          />
                        </div>
                      </div>
                    </div>
                  </DndContext>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}
