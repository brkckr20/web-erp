'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Tabs, Input, Select, Modal, InputNumber, App, Spin, Button, Switch } from 'antd'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community'
import type { ColDef, GridApi } from 'ag-grid-community'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import SearchableMarkaSelect from '@/components/shared/SearchableMarkaSelect'
import SearchableGrupSelect from '@/components/shared/SearchableGrupSelect'
import SearchableCariSelect from '@/components/shared/SearchableCariSelect'
import { malzemeApi } from '@/lib/malzeme-api'
import { modelReceteApi } from '@/lib/model-recete-api'
import { modelBedenApi, type ModelBeden } from '@/lib/model-beden-api'
import SearchableBedenSelect from '@/components/shared/SearchableBedenSelect'
import SearchableKumasGrupSelect from '@/components/shared/SearchableKumasGrupSelect'
import SearchableMalzemeSelect from '@/components/shared/SearchableMalzemeSelect'
import SearchableGtipSelect from '@/components/shared/SearchableGtipSelect'
import { modelKumasGrupApi, type ModelKumasGrup } from '@/lib/model-kumas-grup-api'
import type { Malzeme } from '@/lib/malzeme-api'
import type { ModelRecete } from '@/lib/model-recete-api'
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
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const kumasGridApiRef = useRef<GridApi | null>(null)
  const [bedenModalVisible, setBedenModalVisible] = useState(false)
  const [bedenModalRowKey, setBedenModalRowKey] = useState<string | null>(null)
  const [bedenModalValues, setBedenModalValues] = useState<Record<number, string>>({})

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
      if (data) setRecete(data)
      setBedenler(bedenData)
      try {
        const kumasGrupData = await modelKumasGrupApi.getByMalzeme(malzeme.id)
        setKumasGruplari(kumasGrupData)
      } catch {
        setKumasGruplari([])
      }
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
  }

  const handleKaydet = async () => {
    if (!model) return
    setSaving(true)
    try {
      if (isNew) {
        const created = await malzemeApi.create({ ...model, tip: 5 } as any)
        setModel(created)
      } else {
        await malzemeApi.update(model.id, model)
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

  const addKumasKalem = () => {
    const newRow = createEmptyKumasKalem()
    setKumasKalemler((prev) => [...prev, newRow])
  }

  const removeKumasKalem = (key: string) =>
    setKumasKalemler((prev) => prev.filter((k) => k.key !== key))

  const updateKumasKalem = (key: string, patch: Partial<KumasRow>) =>
    setKumasKalemler((prev) => prev.map((k) => (k.key === key ? { ...k, ...patch } : k)))

  const openBedenModal = (rowKey: string) => {
    const row = kumasKalemler.find((k) => k.key === rowKey)
    const existing: Record<number, string> = {}
    if (row?.bedenSecimi) {
      try {
        const parsed = JSON.parse(row.bedenSecimi)
        Object.entries(parsed).forEach(([k, v]) => { existing[Number(k)] = String(v) })
      } catch { /* ignore */ }
    }
    setBedenModalValues(existing)
    setBedenModalRowKey(rowKey)
    setBedenModalVisible(true)
  }

  const saveBedenModal = () => {
    if (!bedenModalRowKey) return
    const obj: Record<number, number> = {}
    Object.entries(bedenModalValues).forEach(([k, v]) => {
      const n = parseFloat(v)
      if (!isNaN(n)) obj[Number(k)] = n
    })
    updateKumasKalem(bedenModalRowKey, { bedenSecimi: JSON.stringify(obj) })
    setBedenModalVisible(false)
    setBedenModalRowKey(null)
  }

  const handleKumasGrupEkle = async (kumasGrupId: number) => {
    if (!model) return
    try {
      const added = await modelKumasGrupApi.add({ malzemeId: model.id, kumasGrupId })
      setKumasGruplari((prev) => [...prev, added])
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Kumaş grubu eklenirken hata oluştu')
    }
  }

  const handleKumasGrupSil = async (kumasGrupId: number) => {
    if (!model) return
    try {
      await modelKumasGrupApi.remove(model.id, kumasGrupId)
      setKumasGruplari((prev) => prev.filter((g) => g.kumasGrupId !== kumasGrupId))
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Kumaş grubu silinirken hata oluştu')
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
          <SearchableGtipSelect
            value={model?.gtipNo ?? null}
            onChange={(kod) => set('gtipNo', kod)}
            widthClass="!w-[100px]"
          />
        </FormField>
        </div>
      </div>
      </div>
      <div className="!flex-1 !h-full">
        <div className="!grid !grid-cols-3 !gap-3">
          <div className="!aspect-square !bg-gray-100 !border !border-gray-200 !rounded-sm !flex !items-center !justify-center !text-[11px] !text-gray-400">Görsel 1</div>
          <div className="!aspect-square !bg-gray-100 !border !border-gray-200 !rounded-sm !flex !items-center !justify-center !text-[11px] !text-gray-400">Görsel 2</div>
          <div className="!aspect-square !bg-gray-100 !border !border-gray-200 !rounded-sm !flex !items-center !justify-center !text-[11px] !text-gray-400">Görsel 3</div>
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
          <FormField label="Kumaş Grubu Ekle">
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
            onChange={(kod, rec) => updateKumasKalem(p.data.key, { kumasKodu: kod ?? '', kumasAdi: rec?.ad ?? '' })}
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
            onChange={(v) => updateKumasKalem(p.data.key, { islem: v ?? '' })}
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
            onChange={(v) => updateKumasKalem(p.data.key, { variant1: v ?? '' })}
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
            onClick={() => openBedenModal(p.data.key)}
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
    { headerName: 'Kesilecek', field: 'kesilecek', width: 100, cellRenderer: (p: any) => p.data ? <Switch size="small" checked={p.data.kesilecek === 'true'} onChange={(checked) => updateKumasKalem(p.data.key, { kesilecek: checked ? 'true' : 'false' })} /> : null },
    { headerName: 'Ana Kumaş', field: 'anaKumas', width: 100, editable: true, cellEditor: 'agTextCellEditor' },
    { headerName: 'Tedarik Hesaplanmayacak', field: 'tedarikHesaplanmayacak', width: 130, cellRenderer: (p: any) => p.data ? <Switch size="small" checked={p.data.tedarikHesaplanmayacak === 'true'} onChange={(checked) => updateKumasKalem(p.data.key, { tedarikHesaplanmayacak: checked ? 'true' : 'false' })} /> : null },
    { headerName: 'Kullanım Yeri', field: 'kullanimYeri', width: 120, editable: true, cellEditor: 'agTextCellEditor' },
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
        {recete && <span className="!text-[10px] !text-gray-400">({recete.kalemler.length} kalem)</span>}
      </div>
      <Tabs
        size="small"
        tabBarGutter={2}
        className={innerTabClass}
        items={[
          { key: 'kumas', label: 'Kumaş', children: kumasContent },
          { key: 'iplik', label: 'İplik', children: null },
          { key: 'aksesuar', label: 'Aksesuar', children: null },
          { key: 'susleme', label: 'Süsleme', children: null },
        ]}
      />
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
