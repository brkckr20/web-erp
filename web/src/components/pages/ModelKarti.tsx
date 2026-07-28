'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Tabs, Input, Select, Modal, App, Spin, Button, Switch, Row, Col } from 'antd'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community'
import type { ColDef, GridApi } from 'ag-grid-community'
import { PlusOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import SearchableMarkaSelect from '@/components/shared/SearchableMarkaSelect'
import SearchableMalzemeSelect from '@/components/shared/SearchableMalzemeSelect'
import SearchableGrupSelect from '@/components/shared/SearchableGrupSelect'
import SearchableCariSelect from '@/components/shared/SearchableCariSelect'
import SearchableGtipSelect from '@/components/shared/SearchableGtipSelect'
import SearchableBedenSelect from '@/components/shared/SearchableBedenSelect'
import SearchableKumasGrupSelect from '@/components/shared/SearchableKumasGrupSelect'
import { malzemeApi } from '@/lib/malzeme-api'
import type { Malzeme } from '@/lib/malzeme-api'
import { modelReceteApi } from '@/lib/model-recete-api'
import type { ModelRecete, ReceteKalem, ReceteOlcu } from '@/lib/model-recete-api'
import { modelBedenApi } from '@/lib/model-beden-api'
import type { ModelBeden } from '@/lib/model-beden-api'
import { modelKumasGrupApi, type ModelKumasGrup } from '@/lib/model-kumas-grup-api'
import { gtipApi } from '@/lib/gtip-api'
import { malzemeEkApi } from '@/lib/malzeme-ek-api'
import type { MalzemeEk } from '@/lib/malzeme-ek-api'
import { agGridLocaleTR } from '@/lib/ag-grid-locale'

ModuleRegistry.registerModules([AllCommunityModule])

interface ModelKartiProps {
  isNew?: boolean
  kod?: string
}

const tabClass =
  '!px-3 !pt-2 !flex-1 !flex !flex-col !min-h-0 ' +
  '[&_.ant-tabs-content-holder]:!flex [&_.ant-tabs-content-holder]:!flex-col [&_.ant-tabs-content-holder]:!flex-1 [&_.ant-tabs-content-holder]:!min-h-0 ' +
  '[&_.ant-tabs-content]:!flex-1 [&_.ant-tabs-content]:!min-h-0 [&_.ant-tabs-tabpane]:!h-full ' +
  '[&_.ant-tabs-nav]:!mb-2 [&_.ant-tabs-nav]:!border-b [&_.ant-tabs-nav]:!border-gray-200 [&_.ant-tabs-nav]:!flex-shrink-0 ' +
  '[&_.ant-tabs-tab]:!text-[11px] [&_.ant-tabs-tab]:!px-2 [&_.ant-tabs-tab]:!py-1 [&_.ant-tabs-tab]:!bg-[#E0E0E0] [&_.ant-tabs-tab]:!border [&_.ant-tabs-tab]:!border-gray-200 [&_.ant-tabs-tab]:!text-[#333] ' +
  '[&_.ant-tabs-tab-active]:!bg-white [&_.ant-tabs-tab-active]:!border-t-2 [&_.ant-tabs-tab-active]:!border-t-[#FF9933] [&_.ant-tabs-tab-active]:!text-[#FF9933] ' +
  '[&_.ant-tabs-ink-bar]:!hidden'

const innerTabClass =
  '!flex-1 !flex !flex-col !min-h-0 ' +
  '[&_.ant-tabs-content-holder]:!flex [&_.ant-tabs-content-holder]:!flex-col [&_.ant-tabs-content-holder]:!flex-1 [&_.ant-tabs-content-holder]:!min-h-0 ' +
  '[&_.ant-tabs-content]:!flex-1 [&_.ant-tabs-content]:!min-h-0 [&_.ant-tabs-tabpane]:!h-full ' +
  '[&_.ant-tabs-nav]:!mb-0 [&_.ant-tabs-nav]:!border-b [&_.ant-tabs-nav]:!border-gray-200 [&_.ant-tabs-nav]:!flex-shrink-0 ' +
  '[&_.ant-tabs-tab]:!text-[11px] [&_.ant-tabs-tab]:!px-2 [&_.ant-tabs-tab]:!py-1 [&_.ant-tabs-tab]:!bg-[#E0E0E0] [&_.ant-tabs-tab]:!border [&_.ant-tabs-tab]:!border-gray-200 [&_.ant-tabs-tab]:!text-[#333] ' +
  '[&_.ant-tabs-tab-active]:!bg-white [&_.ant-tabs-tab-active]:!border-t-2 [&_.ant-tabs-tab-active]:!border-t-[#FF9933] [&_.ant-tabs-tab-active]:!text-[#FF9933] ' +
  '[&_.ant-tabs-ink-bar]:!hidden'

const antGridTheme = themeQuartz.withParams({
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
  backgroundColor: '#ffffff',
  cellHorizontalPadding: 8,
  wrapperBorder: { style: 'solid', width: 1, color: '#f0f0f0' },
  wrapperBorderRadius: 2,
  rangeSelectionBorderColor: 'transparent',
})

interface KumasRow {
  key: string
  backendId?: number
  kumasKodu: string
  kumasAdi: string
  aciklama: string
  islem: string
  variant1: string
  variant2: string
  suslemeSecimi: string
  bedenSecimi: string
  kesilecek: string
  anaKumas: string
  tedarikHesaplanmayacak: string
  kullanimYeri: string
}

interface IplikRow {
  key: string
  backendId?: number
  malzemeId?: number
  iplikKodu: string
  iplikAdi: string
  aciklama: string
  variant1: string
  islem: string
  bedenSecimi: string
}

interface AksesuarRow {
  key: string
  backendId?: number
  malzemeId?: number
  aksesuarKodu: string
  aksesuarAdi: string
  aciklama: string
  variant1: string
  islem: string
  bedenSecimi: string
}

function createEmptyKumasKalem(): KumasRow {
  return {
    key: Math.random().toString(36).slice(2),
    kumasKodu: '',
    kumasAdi: '',
    aciklama: '',
    islem: '',
    variant1: '',
    variant2: '',
    suslemeSecimi: '',
    bedenSecimi: '',
    kesilecek: 'false',
    anaKumas: '',
    tedarikHesaplanmayacak: '',
    kullanimYeri: '',
  }
}

export default function ModelKarti({ isNew, kod }: ModelKartiProps) {
  const { message, modal } = App.useApp()
  const [model, setModel] = useState<Malzeme | null>(null)
  const [recete, setRecete] = useState<ModelRecete | null>(null)
  const [bedenler, setBedenler] = useState<ModelBeden[]>([])
  const [kumasGruplari, setKumasGruplari] = useState<ModelKumasGrup[]>([])
  const [kumasKalemler, setKumasKalemler] = useState<KumasRow[]>([])
  const [iplikKalemler, setIplikKalemler] = useState<IplikRow[]>([])
  const [aksesuarKalemler, setAksesuarKalemler] = useState<AksesuarRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const kumasGridApiRef = useRef<GridApi | null>(null)
  const [bedenModalVisible, setBedenModalVisible] = useState(false)
  const [bedenModalRowKey, setBedenModalRowKey] = useState<string | null>(null)
  const [bedenModalValues, setBedenModalValues] = useState<Record<number, string>>({})
  const [bedenModalFor, setBedenModalFor] = useState<'kumas' | 'iplik' | 'aksesuar'>('kumas')
  const [gtipAd, setGtipAd] = useState<string | null>(null)
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

  const removeExistingDosya = async (id: number) => {
    try {
      await malzemeEkApi.delete(id)
      setEkList((prev) => prev.filter((e) => e.id !== id))
      setSelectedDosya((prev) => {
        if (prev?.type === 'existing' && prev.ek.id === id) return null
        return prev
      })
    } catch {
      message.error('Dosya silinirken hata oluştu')
    }
  }

  const set = (key: keyof Malzeme, value: unknown) =>
    setModel((prev) => prev ? { ...prev, [key]: value } : { ...emptyModel(), [key]: value } as Malzeme)

  const emptyModel = () => ({
    id: 0,
    kod: '',
    ad: '',
    kullanimda: true,
    tip: 5,
    malzemeTuru: null,
    tipi: null,
    kategori: null,
    pluKodu: null,
    rafOmru: null,
    rafOmruBirim: null,
    sezon: null,
    markaId: null,
    model: null,
    kdvGenel: null,
    kdvPerakende: null,
    kdvToptan: null,
    kdvPSatisIade: null,
    kdvTSatisIade: null,
    ekVergiTanimi: null,
    tevkifatSatinAlmaPay: null,
    tevkifatSatinAlmaPayda: null,
    tevkifatSatisPay: null,
    tevkifatSatisPayda: null,
    kullanimYeri: null,
    takipSekli: null,
    ureticiFirmaKodu: null,
    ureticiUrunKodu: null,
    isoDokumanNo: null,
    gtipNo: null,
    webSayfasi: null,
    kampanyaGrubu: null,
    grupId: null,
    fiyatGrubu: null,
    operasyonKodu: null,
    kumasTuruId: null,
    cinsi: null,
    grm2: null,
    ebat: null,
    en: null,
    boy: null,
    iplikBoyali: null,
    ormeTipi: null,
    kumasUretimTipi: null,
    hesapBirimi: null,
    barkod: null,
  })

  useEffect(() => {
    if (kod) loadByKod(kod)
    else if (isNew) handleYeni()
  }, [kod])

  useEffect(() => {
    kumasGridApiRef.current?.redrawRows()
  }, [kumasKalemler])

  const loadByKod = useCallback(async (kod: string) => {
    setLoading(true)
    try {
      const malzeme = await malzemeApi.getByKod(kod)
      setModel(malzeme)
      const [data, bedenData] = await Promise.all([
        modelReceteApi.getByMalzeme(malzeme.id),
        modelBedenApi.getByMalzeme(malzeme.id),
      ])
      if (data) {
        setRecete(data)
        const kRows: KumasRow[] = []
        const iRows: IplikRow[] = []
        const aRows: AksesuarRow[] = []
        data.kalemler.forEach((k: ReceteKalem) => {
          const shared = {
            key: `recete-${k.id}`,
            backendId: k.id,
            aciklama: k.aciklama ?? '',
            islem: k.islem ?? '',
            variant1: k.variant1 ?? '',
            bedenSecimi: k.olculer.length > 0
              ? JSON.stringify(Object.fromEntries(k.olculer.map((o) => [o.bedenId, o.miktar ?? 0])))
              : '',
          }
          if (k.tip === 4) {
            aRows.push({ ...shared, malzemeId: k.malzemeId ?? undefined, aksesuarKodu: k.malzeme?.kod ?? '', aksesuarAdi: k.malzeme?.ad ?? '' })
          } else if (k.tip === 3) {
            iRows.push({ ...shared, malzemeId: k.malzemeId ?? undefined, iplikKodu: k.malzeme?.kod ?? '', iplikAdi: k.malzeme?.ad ?? '' })
          } else {
            kRows.push({ ...shared, kumasKodu: k.malzeme?.kod ?? '', kumasAdi: k.malzeme?.ad ?? '', variant2: k.variant2 ?? '', suslemeSecimi: k.suslemeSecimi ?? '', kesilecek: k.kesilecek ? 'true' : 'false', anaKumas: k.anaKumas ?? '', tedarikHesaplanmayacak: k.tedarikHesaplanmayacak ? 'true' : 'false', kullanimYeri: k.kullanimYeri ?? '' })
          }
        })
        setKumasKalemler(kRows)
        setIplikKalemler(iRows)
        setAksesuarKalemler(aRows)
      }
      setBedenler(bedenData)
      try {
        const kumasGrupData = await modelKumasGrupApi.getByMalzeme(malzeme.id)
        setKumasGruplari(kumasGrupData)
      } catch {
        setKumasGruplari([])
      }
      if (malzeme.gtipNo) {
        try {
          const gtipList = await gtipApi.list()
          const found = gtipList.find((g) => g.kod === malzeme.gtipNo)
          setGtipAd(found?.ad ?? null)
        } catch {
          setGtipAd(null)
        }
      } else {
        setGtipAd(null)
      }
      try {
        const ekData = await malzemeEkApi.list(malzeme.id)
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

  const handleYeni = () => {
    setModel(null)
    setRecete(null)
    setBedenler([])
    setKumasGruplari([])
    setKumasKalemler([])
    setIplikKalemler([])
    setAksesuarKalemler([])
    setDosyalar([])
    setEkList([])
    setSelectedDosya(null)
    setGtipAd(null)
  }

  const handleKaydet = async () => {
    if (!model) return
    setSaving(true)
    try {
      let currentId = model.id
      if (isNew) {
        const created = await malzemeApi.create({ ...model, tip: 5 } as any)
        setModel(created)
        currentId = created.id
      } else {
        await malzemeApi.update(model.id, model)
      }
      if (dosyalar.length > 0 && currentId) {
        const uploaded = await malzemeEkApi.upload(currentId, dosyalar)
        setEkList((prev) => [...uploaded, ...prev])
        setDosyalar([])
      }
      message.success('Model kaydedildi')
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Kayıt sırasında hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handleBedenEkle = async (bedenId: number) => {
    if (!model) return
    try {
      const added = await modelBedenApi.add({ malzemeId: model.id, bedenId })
      setBedenler((prev) => [...prev, added])
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Beden eklenirken hata oluştu')
    }
  }

  const handleBedenSil = async (bedenId: number) => {
    if (!model) return
    try {
      await modelBedenApi.remove(model.id, bedenId)
      setBedenler((prev) => prev.filter((b) => b.bedenId !== bedenId))
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Beden silinirken hata oluştu')
    }
  }

  const addKumasKalem = async () => {
    if (!recete) return
    try {
      const created = await modelReceteApi.createKalem({ receteId: recete.id, tip: 2 })
      const newRow: KumasRow = {
        key: `recete-${created.id}`,
        backendId: created.id,
        kumasKodu: created.malzeme?.kod ?? '',
        kumasAdi: created.malzeme?.ad ?? '',
        aciklama: created.aciklama ?? '',
        islem: created.islem ?? '',
        variant1: created.variant1 ?? '',
        variant2: created.variant2 ?? '',
        suslemeSecimi: created.suslemeSecimi ?? '',
        bedenSecimi: '',
        kesilecek: created.kesilecek ? 'true' : 'false',
        anaKumas: created.anaKumas ?? '',
        tedarikHesaplanmayacak: created.tedarikHesaplanmayacak ? 'true' : 'false',
        kullanimYeri: created.kullanimYeri ?? '',
      }
      setKumasKalemler((prev) => [...prev, newRow])
      setRecete((prev) => prev ? { ...prev, kalemler: [...prev.kalemler, created] } : null)
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Kalem eklenirken hata oluştu')
    }
  }

  const removeKumasKalem = async (key: string) => {
    const row = kumasKalemler.find((k) => k.key === key)
    if (row?.backendId) {
      try {
        await modelReceteApi.deleteKalem(row.backendId)
        setRecete((prev) => prev ? { ...prev, kalemler: prev.kalemler.filter((k) => k.id !== row.backendId) } : null)
      } catch (err: unknown) {
        message.error(err instanceof Error ? err.message : 'Kalem silinirken hata oluştu')
        return
      }
    }
    setKumasKalemler((prev) => prev.filter((k) => k.key !== key))
  }

  const updateKumasKalem = (key: string, patch: Partial<KumasRow>) =>
    setKumasKalemler((prev) => prev.map((k) => (k.key === key ? { ...k, ...patch } : k)))

  const addIplikKalem = () => {
    setIplikKalemler((prev) => [...prev, {
      key: `iplik-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      iplikKodu: '',
      iplikAdi: '',
      aciklama: '',
      variant1: '',
      islem: '',
      bedenSecimi: '',
    }])
  }

  const removeIplikKalem = (key: string) => {
    setIplikKalemler((prev) => prev.filter((k) => k.key !== key))
  }

  const updateIplikKalem = (key: string, patch: Partial<IplikRow>) =>
    setIplikKalemler((prev) => prev.map((k) => (k.key === key ? { ...k, ...patch } : k)))

  const addAksesuarKalem = () => {
    setAksesuarKalemler((prev) => [...prev, {
      key: `aksesuar-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      aksesuarKodu: '',
      aksesuarAdi: '',
      aciklama: '',
      variant1: '',
      islem: '',
      bedenSecimi: '',
    }])
  }

  const removeAksesuarKalem = (key: string) => {
    setAksesuarKalemler((prev) => prev.filter((k) => k.key !== key))
  }

  const updateAksesuarKalem = (key: string, patch: Partial<AksesuarRow>) =>
    setAksesuarKalemler((prev) => prev.map((k) => (k.key === key ? { ...k, ...patch } : k)))

  const persistKalemField = (key: string, field: string, value: unknown) => {
    const row = kumasKalemler.find((k) => k.key === key)
    if (!row?.backendId) return
    let v = value
    if (field === 'kesilecek' || field === 'tedarikHesaplanmayacak') v = value === 'true'
    modelReceteApi.updateKalem(row.backendId, { [field]: v })
  }

  const persistIplikKalemField = (key: string, field: string, value: unknown) => {
    const row = iplikKalemler.find((k) => k.key === key)
    if (!row?.backendId) return
    modelReceteApi.updateKalem(row.backendId, { [field]: value })
  }

  const persistAksesuarKalemField = (key: string, field: string, value: unknown) => {
    const row = aksesuarKalemler.find((k) => k.key === key)
    if (!row?.backendId) return
    modelReceteApi.updateKalem(row.backendId, { [field]: value })
  }

  const openBedenModal = (rowKey: string, kalemler: KumasRow[] | IplikRow[] | AksesuarRow[]) => {
    const row = kalemler.find((k) => k.key === rowKey) as KumasRow | IplikRow | AksesuarRow | undefined
    const existing: Record<number, string> = {}
    if (row?.bedenSecimi) {
      try {
        const parsed = JSON.parse(row.bedenSecimi)
        Object.entries(parsed).forEach(([k, v]) => { existing[Number(k)] = String(v) })
      } catch { /* ignore */ }
    }
    setBedenModalValues(existing)
    setBedenModalRowKey(rowKey)
    if (kalemler === kumasKalemler) setBedenModalFor('kumas')
    else if (kalemler === iplikKalemler) setBedenModalFor('iplik')
    else setBedenModalFor('aksesuar')
    setBedenModalVisible(true)
  }

  const saveBedenModal = async () => {
    if (!bedenModalRowKey || !recete) return
    let items: (KumasRow | IplikRow | AksesuarRow)[]
    if (bedenModalFor === 'kumas') items = kumasKalemler
    else if (bedenModalFor === 'iplik') items = iplikKalemler
    else items = aksesuarKalemler
    let row = items.find((k) => k.key === bedenModalRowKey)
    if (!row) return

    try {
      let kalemId = row.backendId
      if (!kalemId) {
        const createPayload: any = { receteId: recete.id, tip: bedenModalFor === 'kumas' ? 2 : bedenModalFor === 'iplik' ? 3 : 4 }
        if ('malzemeId' in row && row.malzemeId) createPayload.malzemeId = row.malzemeId
        if ('aciklama' in row && row.aciklama) createPayload.aciklama = row.aciklama
        if ('islem' in row && row.islem) createPayload.islem = row.islem
        if ('variant1' in row && row.variant1) createPayload.variant1 = row.variant1
        const created = await modelReceteApi.createKalem(createPayload)
        kalemId = created.id
        const patch = { backendId: created.id }
        if (bedenModalFor === 'kumas') {
          updateKumasKalem(bedenModalRowKey, patch as any)
        } else if (bedenModalFor === 'iplik') {
          updateIplikKalem(bedenModalRowKey, patch as any)
        } else {
          updateAksesuarKalem(bedenModalRowKey, patch as any)
        }
        setRecete((prev) => prev ? { ...prev, kalemler: [...prev.kalemler, created] } : null)
        row = { ...row, ...patch }
      }

      const newValues: Record<number, number> = {}
      Object.entries(bedenModalValues).forEach(([k, v]) => {
        const n = parseFloat(v)
        if (!isNaN(n)) newValues[Number(k)] = n
      })

      const oldOlculer = kalemId === row.backendId ? (recete?.kalemler.find((k) => k.id === kalemId)?.olculer ?? []) : []

      for (const olcu of oldOlculer) {
        if (!(olcu.bedenId in newValues)) {
          try { await modelReceteApi.deleteOlcu(olcu.id) } catch { /* zaten silinmiş */ }
        }
      }

      const upserted: ReceteOlcu[] = []
      for (const [bedenIdStr, miktar] of Object.entries(newValues)) {
        const created = await modelReceteApi.upsertOlcu({ kalemId, bedenId: Number(bedenIdStr), miktar })
        upserted.push(created)
      }

      const keptOld = oldOlculer.filter((o) => o.bedenId in newValues)
      setRecete((prev) => prev ? {
        ...prev,
        kalemler: prev.kalemler.map((k) =>
          k.id === kalemId ? { ...k, olculer: [...keptOld.filter((o) => !upserted.some((u) => u.bedenId === o.bedenId)), ...upserted] } : k
        ),
      } : null)

      if (bedenModalFor === 'kumas') {
        updateKumasKalem(bedenModalRowKey, { bedenSecimi: JSON.stringify(newValues) })
      } else if (bedenModalFor === 'iplik') {
        updateIplikKalem(bedenModalRowKey, { bedenSecimi: JSON.stringify(newValues) })
      } else {
        updateAksesuarKalem(bedenModalRowKey, { bedenSecimi: JSON.stringify(newValues) })
      }
      setBedenModalVisible(false)
      setBedenModalRowKey(null)
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Beden miktarları kaydedilirken hata oluştu')
    }
  }

  const handleKumasGrupEkle = async (kumasGrupId: number) => {
    if (!model) return
    try {
      const added = await modelKumasGrupApi.add({ malzemeId: model.id, kumasGrupId })
      setKumasGruplari((prev) => [...prev, added])
    } catch (err: unknown) {
          message.error(err instanceof Error ? err.message : 'Varyant grubu eklenirken hata oluştu')
    }
  }

  const handleKumasGrupSil = async (kumasGrupId: number) => {
    if (!model) return
    try {
      await modelKumasGrupApi.remove(model.id, kumasGrupId)
      setKumasGruplari((prev) => prev.filter((g) => g.kumasGrupId !== kumasGrupId))
    } catch (err: unknown) {
          message.error(err instanceof Error ? err.message : 'Varyant grubu silinirken hata oluştu')
    }
  }

  const handlePrevious = async () => message.info('İlk kayıttasınız')
  const handleNext = async () => message.info('Son kayıttasınız')

  const handleSil = () => {
    modal.confirm({
      title: 'Model Sil',
      content: 'Bu modeli silmek istediğinize emin misiniz?',
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSaving(true)
        try {
          if (model?.id) await malzemeApi.delete(model.id)
          message.success('Model silindi')
          handleYeni()
        } catch {
          message.error('Silme sırasında hata oluştu')
        } finally {
          setSaving(false)
        }
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

  // --- Genel content ---

  const imageEkler = ekList.filter((e) => e.mimetype.startsWith('image/')).slice(0, 3)

  const genelContent = (
    <div className="!flex !flex-row !gap-4 !h-full">
      <div className="!flex !flex-col !h-full !gap-3">
        <div className="!border !border-gray-200 !rounded-sm !p-4 !w-[550px]">
          <div className="!flex !flex-col !gap-3">
          <FormField label="Marka">
            <SearchableMarkaSelect
              value={model?.markaId ?? null}
              onChange={(id) => set('markaId', id)}
              widthClass="!w-[100px]"
            />
          </FormField>
        <FormField label="Grup">
          <SearchableGrupSelect
            value={model?.grupId ?? null}
            onChange={(id) => set('grupId', id)}
            widthClass="!w-[100px]"
          />
        </FormField>
        <FormField label="Sezon">
          <Input size="small" value={model?.sezon ?? ''} onChange={(e) => set('sezon', e.target.value)} className="!w-[100px] !text-[11px]" />
        </FormField>
        <FormField label="Kategori">
          <Input size="small" value={model?.kategori ?? ''} onChange={(e) => set('kategori', e.target.value)} className="!w-[100px] !text-[11px]" />
        </FormField>
        <FormField label="Cinsiyet">
          <Select
            size="small"
            value={model?.cinsi ?? undefined}
            onChange={(v) => set('cinsi', v)}
            className="!w-[100px] !text-[11px]"
            allowClear
            options={[
              { value: 'Erkek', label: 'Erkek' },
              { value: 'Kadın', label: 'Kadın' },
              { value: 'Unisex', label: 'Unisex' },
            ]}
          />
        </FormField>
        </div>
      </div>
      <div className="!border !border-gray-200 !rounded-sm !p-4 !w-[550px]">
        <div className="!flex !flex-col !gap-3">
        <FormField label="Müşteri Kodu">
          <SearchableCariSelect
            value={model?.ureticiFirmaKodu ?? undefined}
            onChange={(kod) => set('ureticiFirmaKodu', kod)}
            widthClass="!w-[100px]"
          />
        </FormField>
        <FormField label="Müşteri Model No">
          <Input size="small" value={model?.ureticiUrunKodu ?? ''} onChange={(e) => set('ureticiUrunKodu', e.target.value)} className="!w-[100px] !text-[11px]" />
        </FormField>
        </div>
      </div>
      <div className="!border !border-gray-200 !rounded-sm !w-[550px]">
        <div className="!flex !flex-col !gap-3 !px-4 !py-6">
        <FormField label="GTİP">
          <div className="!flex !items-center !gap-2">
            <SearchableGtipSelect
              value={model?.gtipNo ?? null}
              onChange={(kod, rec) => {
                set('gtipNo', kod)
                setGtipAd(rec?.ad ?? null)
              }}
              widthClass="!w-[100px]"
            />
            {gtipAd && <span className="!text-[11px] !text-gray-500">{gtipAd}</span>}
          </div>
        </FormField>
        </div>
      </div>
      </div>
      <div className="!flex-1 !h-full">
        <div className="!grid !grid-cols-3 !gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="!aspect-square !bg-gray-100 !border !border-gray-200 !rounded-sm !flex !items-center !justify-center !text-[11px] !text-gray-400 !overflow-hidden">
                {imageEkler[i] ? (
                  <img src={malzemeEkApi.getDosyaUrl(imageEkler[i].id)} alt={imageEkler[i].dosyaAdi} className="!w-full !h-full !object-cover" />
                ) : (
                  `Görsel ${i + 1}`
                )}
              </div>
            ))}
          </div>
      </div>
    </div>
  )

  const olcuContent = (
    <div>
      <div className="!border !border-gray-200 !rounded-sm !p-4 !w-[550px]">
        <div className="!flex !flex-col !gap-3">
          <FormField label="Beden Ekle">
            <SearchableBedenSelect
              value={null}
              onChange={(bedenId) => handleBedenEkle(bedenId)}
              widthClass="!w-[180px]"
              excludeIds={bedenler.map((b) => b.bedenId)}
            />
          </FormField>
        </div>
      </div>
      <div className="!border !border-gray-200 !rounded-sm !p-4 !w-[550px] !mt-3">
        <div className="!flex !flex-col !gap-1">
          {bedenler.length === 0 && (
            <div className="!text-[11px] !text-gray-400 !p-2">Henüz beden eklenmemiş</div>
          )}
          {bedenler.map((b) => (
            <div key={b.id} className="!flex !items-center !justify-between !px-2 !py-1 hover:!bg-gray-50">
              <span className="!text-[11px] !text-[#333]">{b.beden.kod}</span>
              <button
                className="!text-[11px] !text-red-500 !cursor-pointer !border-none !bg-transparent hover:!text-red-700"
                onClick={() => handleBedenSil(b.bedenId)}
              >
                Sil
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="!border !border-gray-200 !rounded-sm !p-4 !w-[550px] !mt-3">
        <div className="!flex !flex-col !gap-3">
          <FormField label="Varyant Grubu Ekle">
            <SearchableKumasGrupSelect
              value={null}
              onChange={(id) => handleKumasGrupEkle(id)}
              widthClass="!w-[180px]"
              excludeIds={kumasGruplari.map((g) => g.kumasGrupId)}
            />
          </FormField>
        </div>
        <div className="!flex !flex-col !gap-1 !mt-2">
          {kumasGruplari.length === 0 && (
            <div className="!text-[11px] !text-gray-400 !p-2">Henüz kumaş grubu eklenmemiş</div>
          )}
          {kumasGruplari.map((g) => (
            <div key={g.id} className="!flex !items-center !justify-between !px-2 !py-1 hover:!bg-gray-50">
              <span className="!text-[11px] !text-[#333]">{g.kumasGrup?.kod ?? `#${g.kumasGrupId}`}</span>
              <button
                className="!text-[11px] !text-red-500 !cursor-pointer !border-none !bg-transparent hover:!text-red-700"
                onClick={() => handleKumasGrupSil(g.kumasGrupId)}
              >
                Sil
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const kumasColDefs = useMemo<ColDef<KumasRow>[]>(() => [
    {
      headerName: '',
      field: 'key',
      width: 40,
      cellRenderer: (p: any) =>
        p.data ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <DeleteOutlined
              style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: 13 }}
              onClick={() => removeKumasKalem(p.data.key)}
            />
          </div>
        ) : null,
      sortable: false,
      resizable: false,
    },
    {
      headerName: 'Kumaş Kodu',
      field: 'kumasKodu',
      width: 130,
      cellClass: '!p-0',
        cellRenderer: (p: any) =>
        p.data ? (
          <SearchableMalzemeSelect
            value={p.data.kumasKodu}
            tip={2}
            widthClass="!w-full"
            className="!w-full !h-full !text-[11px]"
            onChange={(kod, rec) => {
              updateKumasKalem(p.data.key, { kumasKodu: kod ?? '', kumasAdi: rec?.ad ?? '' })
              if (p.data.backendId && rec) {
                modelReceteApi.updateKalem(p.data.backendId, { malzemeId: rec.id })
              }
            }}
          />
        ) : null,
    },
    { headerName: 'Kumaş Adı', field: 'kumasAdi', width: 150 },
    { headerName: 'Açıklama', field: 'aciklama', width: 150, editable: true, cellEditor: 'agTextCellEditor' },
    {
      headerName: 'İşlem',
      field: 'islem',
      width: 130,
      cellRenderer: (p: any) =>
        p.data ? (
          <Select
            size="small"
            value={p.data.islem || undefined}
            onChange={(v) => {
              updateKumasKalem(p.data.key, { islem: v ?? '' })
              persistKalemField(p.data.key, 'islem', v ?? '')
            }}
            className="!w-full !text-[11px]"
            variant="borderless"
            allowClear
            options={[
              { value: 'Boya', label: 'Boya' },
              { value: 'Baskı', label: 'Baskı' },
              { value: 'Boya + Baskı', label: 'Boya + Baskı' },
              { value: 'Örgü + Baskı', label: 'Örgü + Baskı' },
              { value: 'Örgü + Boya', label: 'Örgü + Boya' },
              { value: 'Örgü + Boya + Baskı', label: 'Örgü + Boya + Baskı' },
            ]}
          />
        ) : null,
    },
    { headerName: 'Varyant-1', field: 'variant1', width: 130,
      cellRenderer: (p: any) =>
        p.data ? (
          <Select
            size="small"
            value={p.data.variant1 || undefined}
            onChange={(v) => {
              updateKumasKalem(p.data.key, { variant1: v ?? '' })
              persistKalemField(p.data.key, 'variant1', v ?? '')
            }}
            className="!w-full !text-[11px]"
            variant="borderless"
            allowClear
            options={kumasGruplari.map((g) => ({
              value: g.kumasGrup?.kod ?? `#${g.kumasGrupId}`,
              label: g.kumasGrup?.kod ?? `#${g.kumasGrupId}`,
            }))}
          />
        ) : null,
    },
    { headerName: 'Varyant-2', field: 'variant2', width: 100, editable: true, cellEditor: 'agTextCellEditor' },
    { headerName: 'Süsleme Seçimi', field: 'suslemeSecimi', width: 120, editable: true, cellEditor: 'agTextCellEditor' },
    { headerName: 'Beden Seçimi', field: 'bedenSecimi', width: 110,
      cellRenderer: (p: any) =>
        p.data ? (
          <span
            className="!text-[11px] !text-blue-600 !cursor-pointer !underline !underline-offset-2"
            onClick={() => openBedenModal(p.data.key, kumasKalemler)}
          >
            {(() => {
              if (!p.data.bedenSecimi) return 'Miktar Gir'
              try {
                const obj = JSON.parse(p.data.bedenSecimi)
                const count = Object.keys(obj).length
                return `${count} beden`
              } catch { return 'Miktar Gir' }
            })()}
          </span>
        ) : null,
    },
    { headerName: 'Kesilecek', field: 'kesilecek', width: 100, cellRenderer: (p: any) => p.data ? <Switch size="small" checked={p.data.kesilecek === 'true'} onChange={(checked) => { updateKumasKalem(p.data.key, { kesilecek: checked ? 'true' : 'false' }); persistKalemField(p.data.key, 'kesilecek', checked ? 'true' : 'false') }} /> : null },
    { headerName: 'Ana Kumaş', field: 'anaKumas', width: 100, editable: true, cellEditor: 'agTextCellEditor' },
    { headerName: 'Tedarik Hesaplanmayacak', field: 'tedarikHesaplanmayacak', width: 130, cellRenderer: (p: any) => p.data ? <Switch size="small" checked={p.data.tedarikHesaplanmayacak === 'true'} onChange={(checked) => { updateKumasKalem(p.data.key, { tedarikHesaplanmayacak: checked ? 'true' : 'false' }); persistKalemField(p.data.key, 'tedarikHesaplanmayacak', checked ? 'true' : 'false') }} /> : null },
    { headerName: 'Kullanım Yeri', field: 'kullanimYeri', width: 120, editable: true, cellEditor: 'agTextCellEditor' },
  ], [kumasGruplari])

  const iplikColDefs = useMemo<ColDef<IplikRow>[]>(() => [
    {
      headerName: '', field: 'key', width: 40,
      cellRenderer: (p: any) =>
        p.data ? (
          <div className="!flex !items-center !justify-center" style={{ height: '100%' }}>
            <DeleteOutlined
              style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: 13 }}
              onClick={() => removeIplikKalem(p.data.key)}
            />
          </div>
        ) : null,
      sortable: false, resizable: false,
    },
    {
      headerName: 'İplik Kodu', field: 'iplikKodu', width: 130, cellClass: '!p-0',
      cellRenderer: (p: any) =>
        p.data ? (
          <SearchableMalzemeSelect
            value={p.data.iplikKodu}
            tip={3}
            widthClass="!w-full"
            className="!w-full !h-full !text-[11px]"
            onChange={(kod, rec) => {
              updateIplikKalem(p.data.key, { iplikKodu: kod ?? '', iplikAdi: rec?.ad ?? '', malzemeId: rec?.id ?? undefined })
              if (p.data.backendId && rec) {
                modelReceteApi.updateKalem(p.data.backendId, { malzemeId: rec.id })
              }
            }}
          />
        ) : null,
    },
    { headerName: 'İplik Adı', field: 'iplikAdi', width: 150 },
    { headerName: 'Açıklama', field: 'aciklama', width: 150, editable: true, cellEditor: 'agTextCellEditor' },
    {
      headerName: 'İşlem', field: 'islem', width: 130,
      cellRenderer: (p: any) =>
        p.data ? (
          <Select
            size="small"
            value={p.data.islem || undefined}
            onChange={(v) => {
              updateIplikKalem(p.data.key, { islem: v ?? '' })
              persistIplikKalemField(p.data.key, 'islem', v ?? '')
            }}
            className="!w-full !text-[11px]"
            variant="borderless"
            allowClear
            options={[
              { value: 'Boya', label: 'Boya' },
              { value: 'Baskı', label: 'Baskı' },
              { value: 'Boya + Baskı', label: 'Boya + Baskı' },
            ]}
          />
        ) : null,
    },
    { headerName: 'Varyant-1', field: 'variant1', width: 130,
      cellRenderer: (p: any) =>
        p.data ? (
          <Select
            size="small"
            value={p.data.variant1 || undefined}
            onChange={(v) => {
              updateIplikKalem(p.data.key, { variant1: v ?? '' })
              persistIplikKalemField(p.data.key, 'variant1', v ?? '')
            }}
            className="!w-full !text-[11px]"
            variant="borderless"
            allowClear
            options={kumasGruplari.map((g) => ({
              value: g.kumasGrup?.kod ?? `#${g.kumasGrupId}`,
              label: g.kumasGrup?.kod ?? `#${g.kumasGrupId}`,
            }))}
          />
        ) : null,
    },
    {
      headerName: 'Beden Seçimi', field: 'bedenSecimi', width: 110,
      cellRenderer: (p: any) =>
        p.data ? (
          <span
            className="!text-[11px] !text-blue-600 !cursor-pointer !underline !underline-offset-2"
            onClick={() => openBedenModal(p.data.key, iplikKalemler)}
          >
            {(() => {
              if (!p.data.bedenSecimi) return 'Miktar Gir'
              try {
                const obj = JSON.parse(p.data.bedenSecimi)
                const count = Object.keys(obj).length
                return `${count} beden`
              } catch { return 'Miktar Gir' }
            })()}
          </span>
        ) : null,
    },
  ], [kumasGruplari])

  const aksesuarColDefs = useMemo<ColDef<AksesuarRow>[]>(() => [
    {
      headerName: '', field: 'key', width: 40,
      cellRenderer: (p: any) =>
        p.data ? (
          <div className="!flex !items-center !justify-center" style={{ height: '100%' }}>
            <DeleteOutlined
              style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: 13 }}
              onClick={() => removeAksesuarKalem(p.data.key)}
            />
          </div>
        ) : null,
      sortable: false, resizable: false,
    },
    {
      headerName: 'Aksesuar Kodu', field: 'aksesuarKodu', width: 130, cellClass: '!p-0',
      cellRenderer: (p: any) =>
        p.data ? (
          <SearchableMalzemeSelect
            value={p.data.aksesuarKodu}
            tip={4}
            widthClass="!w-full"
            className="!w-full !h-full !text-[11px]"
            onChange={(kod, rec) => {
              updateAksesuarKalem(p.data.key, { aksesuarKodu: kod ?? '', aksesuarAdi: rec?.ad ?? '', malzemeId: rec?.id ?? undefined })
              if (p.data.backendId && rec) {
                modelReceteApi.updateKalem(p.data.backendId, { malzemeId: rec.id })
              }
            }}
          />
        ) : null,
    },
    { headerName: 'Aksesuar Adı', field: 'aksesuarAdi', width: 150 },
    { headerName: 'Açıklama', field: 'aciklama', width: 150, editable: true, cellEditor: 'agTextCellEditor' },
    {
      headerName: 'İşlem', field: 'islem', width: 130,
      cellRenderer: (p: any) =>
        p.data ? (
          <Select
            size="small"
            value={p.data.islem || undefined}
            onChange={(v) => {
              updateAksesuarKalem(p.data.key, { islem: v ?? '' })
              persistAksesuarKalemField(p.data.key, 'islem', v ?? '')
            }}
            className="!w-full !text-[11px]"
            variant="borderless"
            allowClear
            options={[
              { value: 'Boya', label: 'Boya' },
              { value: 'Baskı', label: 'Baskı' },
              { value: 'Boya + Baskı', label: 'Boya + Baskı' },
            ]}
          />
        ) : null,
    },
    { headerName: 'Varyant-1', field: 'variant1', width: 130,
      cellRenderer: (p: any) =>
        p.data ? (
          <Select
            size="small"
            value={p.data.variant1 || undefined}
            onChange={(v) => {
              updateAksesuarKalem(p.data.key, { variant1: v ?? '' })
              persistAksesuarKalemField(p.data.key, 'variant1', v ?? '')
            }}
            className="!w-full !text-[11px]"
            variant="borderless"
            allowClear
            options={kumasGruplari.map((g) => ({
              value: g.kumasGrup?.kod ?? `#${g.kumasGrupId}`,
              label: g.kumasGrup?.kod ?? `#${g.kumasGrupId}`,
            }))}
          />
        ) : null,
    },
    {
      headerName: 'Beden Seçimi', field: 'bedenSecimi', width: 110,
      cellRenderer: (p: any) =>
        p.data ? (
          <span
            className="!text-[11px] !text-blue-600 !cursor-pointer !underline !underline-offset-2"
            onClick={() => openBedenModal(p.data.key, aksesuarKalemler)}
          >
            {(() => {
              if (!p.data.bedenSecimi) return 'Miktar Gir'
              try {
                const obj = JSON.parse(p.data.bedenSecimi)
                const count = Object.keys(obj).length
                return `${count} beden`
              } catch { return 'Miktar Gir' }
            })()}
          </span>
        ) : null,
    },
  ], [kumasGruplari])

  const kumasContent = (
    <div className="!flex !flex-col !h-full">
      <style>{`.ag-cell-focus { border: none !important; outline: none !important; } .kumas-grid .ant-select-selector { border: none !important; box-shadow: none !important; } .kumas-grid .ag-cell { display: flex; align-items: center; }`}</style>
      <div className="!flex !items-center !justify-end !px-2 !py-1">
        <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={addKumasKalem} className="!text-[11px]">
          Satır Ekle
        </Button>
      </div>
      <div className="kumas-grid" style={{ height: 300, width: '100%' }}>
        <AgGridReact<KumasRow>
          rowData={kumasKalemler}
          columnDefs={kumasColDefs}
          theme={antGridTheme}
          headerHeight={28}
          rowHeight={28}
          getRowId={(p) => p.data.key}
          localeText={agGridLocaleTR}
          defaultColDef={{ resizable: true, sortable: true, cellClass: '!p-1' }}
          onGridReady={(e) => {
            kumasGridApiRef.current = e.api
            e.api.sizeColumnsToFit()
          }}
          onCellValueChanged={(e) => {
            if (e.data && e.colDef.field) {
              updateKumasKalem(e.data.key, { [e.colDef.field]: e.newValue } as Partial<KumasRow>)
              persistKalemField(e.data.key, e.colDef.field, e.newValue)
            }
          }}
        />
      </div>
    </div>
  )

  const iplikContent = (
    <div className="!flex !flex-col !h-full">
      <style>{`.iplik-grid .ant-select-selector { border: none !important; box-shadow: none !important; } .iplik-grid .ag-cell { display: flex; align-items: center; }`}</style>
      <div className="!flex !items-center !justify-end !px-2 !py-1">
        <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={addIplikKalem} className="!text-[11px]">
          Satır Ekle
        </Button>
      </div>
      <div className="iplik-grid" style={{ height: 300, width: '100%' }}>
        <AgGridReact<IplikRow>
          rowData={iplikKalemler}
          columnDefs={iplikColDefs}
          theme={antGridTheme}
          headerHeight={28}
          rowHeight={28}
          getRowId={(p) => p.data.key}
          localeText={agGridLocaleTR}
          defaultColDef={{ resizable: true, sortable: true, cellClass: '!p-1' }}
          onGridReady={(e) => {
            e.api.sizeColumnsToFit()
          }}
          onCellValueChanged={(e) => {
            if (e.data && e.colDef.field) {
              updateIplikKalem(e.data.key, { [e.colDef.field]: e.newValue } as Partial<IplikRow>)
              persistIplikKalemField(e.data.key, e.colDef.field, e.newValue)
            }
          }}
        />
      </div>
    </div>
  )

  const aksesuarContent = (
    <div className="!flex !flex-col !h-full">
      <style>{`.aksesuar-grid .ant-select-selector { border: none !important; box-shadow: none !important; } .aksesuar-grid .ag-cell { display: flex; align-items: center; }`}</style>
      <div className="!flex !items-center !justify-end !px-2 !py-1">
        <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={addAksesuarKalem} className="!text-[11px]">
          Satır Ekle
        </Button>
      </div>
      <div className="aksesuar-grid" style={{ height: 300, width: '100%' }}>
        <AgGridReact<AksesuarRow>
          rowData={aksesuarKalemler}
          columnDefs={aksesuarColDefs}
          theme={antGridTheme}
          headerHeight={28}
          rowHeight={28}
          getRowId={(p) => p.data.key}
          localeText={agGridLocaleTR}
          defaultColDef={{ resizable: true, sortable: true, cellClass: '!p-1' }}
          onGridReady={(e) => {
            e.api.sizeColumnsToFit()
          }}
          onCellValueChanged={(e) => {
            if (e.data && e.colDef.field) {
              updateAksesuarKalem(e.data.key, { [e.colDef.field]: e.newValue } as Partial<AksesuarRow>)
              persistAksesuarKalemField(e.data.key, e.colDef.field, e.newValue)
            }
          }}
        />
      </div>
    </div>
  )

  const receteContent = (
    <div className="!flex !flex-col !h-full">
      <div className="!flex !items-center !gap-2 !px-3 !py-2 !border-b !border-gray-200 !bg-gray-50">
        <span className="!text-[11px] !font-semibold !text-[#333] !uppercase">Reçete Detayları</span>
      </div>
      <Tabs
        size="small"
        tabBarGutter={2}
        className={innerTabClass}
        items={[
          { key: 'kumas', label: 'Kumaş', children: kumasContent },
          { key: 'iplik', label: 'İplik', children: iplikContent },
          { key: 'aksesuar', label: 'Aksesuar', children: aksesuarContent },
          { key: 'susleme', label: 'Süsleme', children: null },
        ]}
      />
    </div>
  )

  const orderContent = (
    <div className="!flex !flex-col !h-full" />
  )

  const eklerContent = (
    <div className="!overflow-y-auto !overflow-x-hidden !h-full">
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
          <div className="!border !border-gray-200 !rounded-sm !p-3 !h-full !flex !items-center !justify-center !overflow-hidden">
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
        <Spin spinning={loading}>
            <div className="!flex !items-center !gap-4 !px-3 !py-2 !border-b !border-gray-200 !flex-shrink-0">
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[11px] !font-semibold !text-[#333] !uppercase !w-12">Kodu</label>
                <Input size="small" value={model?.kod ?? ''} onChange={(e) => set('kod', e.target.value)} className="!w-32 !text-[11px]" />
              </div>
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[11px] !font-semibold !text-[#333] !uppercase !w-8">Adı</label>
                <Input size="small" value={model?.ad ?? ''} onChange={(e) => set('ad', e.target.value)} className="!w-[200px] !text-[11px]" />
              </div>
            </div>

          <Tabs
            size="small"
            tabBarGutter={2}
            className={tabClass}
            items={[
              { key: 'genel', label: 'Genel', children: genelContent },
              { key: 'olcu', label: 'Ölçü Tablosu', children: olcuContent },
              { key: 'recete', label: 'Reçete Detayı', children: receteContent },
              { key: 'order', label: 'Order Bilgileri', children: orderContent },
              { key: 'ekler', label: 'Ekler', children: eklerContent },
            ]}
          />
        </Spin>
      </div>

      <Modal
        title={<span className="!text-[11px] !font-semibold">Beden Miktarları</span>}
        open={bedenModalVisible}
        onOk={saveBedenModal}
        onCancel={() => setBedenModalVisible(false)}
        width={350}
        okText="Kaydet"
        cancelText="İptal"
        okButtonProps={{ size: 'small', className: '!text-[11px]' }}
        cancelButtonProps={{ size: 'small', className: '!text-[11px]' }}
      >
        <div className="!py-2">
          {bedenler.length === 0 ? (
            <div className="!text-[11px] !text-gray-400">Henüz beden eklenmemiş</div>
          ) : (
            <table className="!w-full !text-[11px]">
              <thead>
                <tr className="!border-b !border-gray-200">
                  <th className="!text-left !font-semibold !text-[#333] !pb-1.5 !w-20">Beden</th>
                  <th className="!text-left !font-semibold !text-[#333] !pb-1.5">Metraj</th>
                </tr>
              </thead>
              <tbody>
                {bedenler.map((b) => (
                  <tr key={b.id} className="!border-b !border-gray-50">
                    <td className="!py-1.5 !text-[#333]">{b.beden.kod}</td>
                    <td className="!py-1.5">
                      <input
                        type="text"
                        inputMode="decimal"
                        className="!w-full !h-[24px] !text-[11px] !border !border-gray-300 !rounded !px-2 !box-border"
                        value={bedenModalValues[b.bedenId] !== undefined ? bedenModalValues[b.bedenId] : ''}
                        onChange={(e) => {
                          const raw = e.target.value
                          if (/^[0-9]*[.,]?[0-9]*$/.test(raw)) {
                            setBedenModalValues((prev) => ({ ...prev, [b.bedenId]: raw }))
                          }
                        }}
                        onBlur={() => {
                          const val = bedenModalValues[b.bedenId]
                          if (!val || val.trim() === '') return
                          const normalized = val.replace(',', '.')
                          const num = parseFloat(normalized)
                          if (isNaN(num)) {
                            setBedenModalValues((prev) => {
                              const next = { ...prev }
                              delete next[b.bedenId]
                              return next
                            })
                            return
                          }
                          setBedenModalValues((prev) => ({ ...prev, [b.bedenId]: num.toFixed(2).replace('.', ',') }))
                        }}
                        placeholder="0,00"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>
    </div>
  )
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="!flex !items-center !gap-2">
      <label className={`!text-[10px] !font-semibold !uppercase !w-28 !text-right !shrink-0 ${required ? '!text-red-500' : '!text-[#333]'}`}>
        {label}
      </label>
      {children}
    </div>
  )
}
