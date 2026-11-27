'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Input, Switch, App, Spin, Tabs } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import { antGridTheme } from '@/lib/ag-grid-theme'
import { agGridLocaleTR } from '@/lib/ag-grid-locale'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import OzellikKodlamaModal from '@/components/shared/OzellikKodlamaModal'
import { malzemeApi, type MalzemeFormData } from '@/lib/malzeme-api'
import { useKirli } from '@/lib/kirli'
import { ozellikKodlamaApi, type OzellikKodlama } from '@/lib/ozellik-kodlama-api'
import { siparisApi, type SiparisModelOzet } from '@/lib/siparis-api'

const emptyData: MalzemeFormData = {
  kod: '',
  ad: '',
  kullanimda: true,
  tip: 3,
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
  iplikNoId: null,
  iplikCinsiId: null,
  organik: null,
  iplikKompozisyonId: null,
}

interface IplikKartiProps {
  isNew?: boolean
  kod?: string
  onOpenSiparis?: (id: number, siparisNo: string) => void
  onKirliChange?: (kirli: boolean) => void
}

const tabClass =
  '!px-3 !pt-2 !flex-1 !flex !flex-col !min-h-0 ' +
  '[&_.ant-tabs-nav]:!mb-2 [&_.ant-tabs-nav]:!flex-shrink-0 ' +
  '[&_.ant-tabs-content-holder]:!flex-1 [&_.ant-tabs-content-holder]:!min-h-0 ' +
  '[&_.ant-tabs-content]:!h-full [&_.ant-tabs-tabpane]:!h-full ' +
  '[&_.ant-tabs-tab]:!text-[11px] [&_.ant-tabs-tab]:!px-2 [&_.ant-tabs-tab]:!py-1 ' +
  '[&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:!text-[#FF9933] [&_.ant-tabs-ink-bar]:!bg-[#FF9933]'

export default function IplikKarti({ isNew, kod, onOpenSiparis, onKirliChange }: IplikKartiProps) {
  const { message, modal } = App.useApp()
  const [form, setForm] = useState<MalzemeFormData>(emptyData)
  const [id, setId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { kirli, temizle } = useKirli([form])
  useEffect(() => { onKirliChange?.(kirli) }, [kirli, onKirliChange])

  const [iplikNoId, setIplikNoId] = useState<number | null>(null)
  const [iplikNoAd, setIplikNoAd] = useState('')
  const [iplikCinsiId, setIplikCinsiId] = useState<number | null>(null)
  const [iplikCinsiAd, setIplikCinsiAd] = useState('')
  const [organik, setOrganik] = useState(false)
  const [iplikKompozisyonId, setIplikKompozisyonId] = useState<number | null>(null)
  const [iplikKompozisyonAd, setIplikKompozisyonAd] = useState('')
  const [orderRows, setOrderRows] = useState<SiparisModelOzet[]>([])
  const [orderLoading, setOrderLoading] = useState(false)

  const [ozellikModal, setOzellikModal] = useState<{
    kategori: string
    value: number | null
    onChange: (id: number | null, rec?: OzellikKodlama) => void
  } | null>(null)

  const isNewMode = useRef(true)

  useEffect(() => {
    if (kod) {
      isNewMode.current = false
      loadByKod(kod)
    } else {
      isNewMode.current = true
      setForm({ ...emptyData })
      setId(null)
      resetIplikFields()
      initNextIplKod()
    }
  }, [kod])

  useEffect(() => {
    if (!id) { setOrderRows([]); return }
    setOrderLoading(true)
    siparisApi.listByMalzeme(id).then(setOrderRows).catch(() => setOrderRows([])).finally(() => setOrderLoading(false))
  }, [id])

  useEffect(() => {
    if (!isNewMode.current) return
    const parts: string[] = []
    if (iplikNoAd) parts.push(iplikNoAd)
    if (iplikCinsiAd) parts.push(iplikCinsiAd)
    if (organik) parts.push('Organik')
    if (iplikKompozisyonAd) parts.push(iplikKompozisyonAd)
    setForm((prev) => ({ ...prev, ad: parts.join(' ') }))
  }, [iplikNoAd, iplikCinsiAd, organik, iplikKompozisyonAd])

  const resetIplikFields = () => {
    setIplikNoId(null)
    setIplikNoAd('')
    setIplikCinsiId(null)
    setIplikCinsiAd('')
    setOrganik(false)
    setIplikKompozisyonId(null)
    setIplikKompozisyonAd('')
  }

  const getNextIplKod = useCallback(async () => {
    try {
      const list = await malzemeApi.list(3)
      let maxNum = 0
      for (const item of list) {
        const m = item.kod.match(/^IPL(\d+)$/)
        if (m) {
          const n = parseInt(m[1], 10)
          if (n > maxNum) maxNum = n
        }
      }
      return `IPL${String(maxNum + 1).padStart(3, '0')}`
    } catch {
      return 'IPL001'
    }
  }, [])

  const initNextIplKod = async () => {
    const nextKod = await getNextIplKod()
    setForm((prev) => ({ ...prev, kod: nextKod }))
  }

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
        iplikNoId: data.iplikNoId ?? null,
        iplikCinsiId: data.iplikCinsiId ?? null,
        organik: data.organik ?? null,
        iplikKompozisyonId: data.iplikKompozisyonId ?? null,
      })
      setIplikNoId(data.iplikNoId)
      setIplikCinsiId(data.iplikCinsiId)
      setOrganik(!!data.organik)
      setIplikKompozisyonId(data.iplikKompozisyonId)
      if (data.iplikNoId) {
        try {
          const rec = await ozellikKodlamaApi.get(data.iplikNoId)
          setIplikNoAd(rec.ad)
        } catch { setIplikNoAd('') }
      } else { setIplikNoAd('') }
      if (data.iplikCinsiId) {
        try {
          const rec = await ozellikKodlamaApi.get(data.iplikCinsiId)
          setIplikCinsiAd(rec.ad)
        } catch { setIplikCinsiAd('') }
      } else { setIplikCinsiAd('') }
      if (data.iplikKompozisyonId) {
        try {
          const rec = await ozellikKodlamaApi.get(data.iplikKompozisyonId)
          setIplikKompozisyonAd(rec.ad)
        } catch { setIplikKompozisyonAd('') }
      } else { setIplikKompozisyonAd('') }
    } catch {
      message.warning('Kod bulunamadı')
    } finally {
      setLoading(false)
      temizle()
    }
  }, [])

  const set = <K extends keyof MalzemeFormData>(key: K, value: MalzemeFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleYeni = async () => {
    isNewMode.current = true
    setId(null)
    setForm({ ...emptyData })
    resetIplikFields()
    await initNextIplKod()
  }

  const buildPayload = () => ({
    ...form,
    iplikNoId,
    iplikCinsiId,
    organik,
    iplikKompozisyonId,
  })

  const handleKaydet = async () => {
    if (!form.ad.trim()) { message.warning('Ad alanı zorunludur'); return }
    setSaving(true)
    try {
      if (id) {
        await malzemeApi.update(id, buildPayload())
        message.success('İplik başarıyla güncellendi')
      } else {
        if (!form.kod.trim()) { message.warning('Kod alanı zorunludur'); setSaving(false); return }
        const created = await malzemeApi.create(buildPayload())
        setId(created.id)
        setForm((prev) => ({ ...prev, kod: created.kod }))
        message.success('İplik başarıyla oluşturuldu')
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
      const list = await malzemeApi.list(3)
      const idx = list.findIndex((d) => d.kod === form.kod)
      if (idx <= 0) { message.info('İlk kayıttasınız'); return }
      isNewMode.current = false
      await loadByKod(list[idx - 1].kod)
    } catch { message.warning('Önceki kayıt yüklenemedi') }
  }

  const handleNext = async () => {
    try {
      const list = await malzemeApi.list(3)
      const idx = list.findIndex((d) => d.kod === form.kod)
      if (idx < 0 || idx >= list.length - 1) { message.info('Son kayıttasınız'); return }
      isNewMode.current = false
      await loadByKod(list[idx + 1].kod)
    } catch { message.warning('Sonraki kayıt yüklenemedi') }
  }

  const handleSil = () => {
    if (!id) return
    modal.confirm({
      title: 'İplik Sil',
      content: 'Bu ipliği silmek istediğinize emin misiniz?',
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSaving(true)
        try {
          await malzemeApi.delete(id)
          message.success('İplik silindi')
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

  const openOzellikModal = (
    kategori: string,
    value: number | null,
    onChange: (id: number | null, rec?: OzellikKodlama) => void,
  ) => {
    setOzellikModal({ kategori, value, onChange })
  }

  const orderColumns = useMemo<ColDef<SiparisModelOzet>[]>(() => [
    { headerName: 'Order No', field: 'siparisNo', width: 140, minWidth: 120 },
    { headerName: 'Tarihi', field: 'tarih', width: 100, valueFormatter: (p) => (p.value ? new Date(p.value).toLocaleDateString('tr-TR') : '') },
    { headerName: 'Müşteri', field: 'musteri', flex: 1, minWidth: 180 },
    { headerName: 'Miktar', field: 'miktar', width: 110, type: 'rightAligned', valueFormatter: (p) => Number(p.value ?? 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 }) },
  ], [])
  const orderToplamMiktar = useMemo(() => orderRows.reduce((a, r) => a + (Number(r.miktar) || 0), 0), [orderRows])

  const genelContent = (
    <div className="!p-3 !overflow-y-auto !h-full">
      <div className="!border !border-gray-200 !rounded-sm !p-3">
        <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">İplik Bilgileri</div>
        <div className="!grid !grid-cols-3 !gap-x-6 !gap-y-2.5">
          <FormField label="İplik No">
            <Input size="small" value={iplikNoAd} className="!text-[11px]" readOnly
              suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => openOzellikModal('iplikNo', iplikNoId, (id, rec) => { setIplikNoId(id); setIplikNoAd(rec?.ad ?? '') })} />}
              onClick={() => openOzellikModal('iplikNo', iplikNoId, (id, rec) => { setIplikNoId(id); setIplikNoAd(rec?.ad ?? '') })} />
          </FormField>
          <FormField label="İplik Cinsi">
            <Input size="small" value={iplikCinsiAd} className="!text-[11px]" readOnly
              suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => openOzellikModal('iplikCinsi', iplikCinsiId, (id, rec) => { setIplikCinsiId(id); setIplikCinsiAd(rec?.ad ?? '') })} />}
              onClick={() => openOzellikModal('iplikCinsi', iplikCinsiId, (id, rec) => { setIplikCinsiId(id); setIplikCinsiAd(rec?.ad ?? '') })} />
          </FormField>
          <FormField label="Organik">
            <Switch checked={organik} onChange={setOrganik} />
          </FormField>
          <FormField label="İplik Kompozisyon">
            <Input size="small" value={iplikKompozisyonAd} className="!text-[11px]" readOnly
              suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }} onClick={() => openOzellikModal('iplikKompozisyon', iplikKompozisyonId, (id, rec) => { setIplikKompozisyonId(id); setIplikKompozisyonAd(rec?.ad ?? '') })} />}
              onClick={() => openOzellikModal('iplikKompozisyon', iplikKompozisyonId, (id, rec) => { setIplikKompozisyonId(id); setIplikKompozisyonAd(rec?.ad ?? '') })} />
          </FormField>
        </div>
      </div>
    </div>
  )

  const orderContent = (
    <div className="!p-3">
      <div className="!flex !justify-end !mb-1">
        <span className="!text-[10px] !text-gray-400">Satıra çift tıklayarak siparişi açabilirsiniz</span>
      </div>
      <div style={{ height: 'calc(100vh - 280px)', minHeight: 240, width: '100%' }}>
        <AgGridReact
          rowData={orderRows}
          columnDefs={orderColumns}
          theme={antGridTheme}
          localeText={agGridLocaleTR}
          headerHeight={32}
          rowHeight={30}
          loading={orderLoading}
          getRowId={(p) => String(p.data.id)}
          defaultColDef={{ resizable: true, sortable: true, filter: true }}
          pinnedBottomRowData={[{ id: 0, siparisNo: `Toplam (${orderRows.length})`, tarih: '', musteri: null, miktar: orderToplamMiktar } as any]}
          onRowDoubleClicked={(e) => { if (e.data?.id) onOpenSiparis?.(e.data.id, e.data.siparisNo) }}
        />
      </div>
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
                <Input size="small" value={form.kod} readOnly className="!w-28 !text-[11px] !bg-gray-50" />
              </div>
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[11px] !font-semibold !text-[#333] !uppercase">Adı</label>
                <Input size="small" value={form.ad} onChange={(e) => set('ad', e.target.value)} className="!w-[300px] !text-[11px]" />
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
              { key: 'siparisler', label: 'Kullanıldığı Siparişler', children: orderContent },
            ]}
          />
        </Spin>
      </div>

      <OzellikKodlamaModal
        open={!!ozellikModal}
        kategori={ozellikModal?.kategori ?? ''}
        value={ozellikModal?.value}
        onChange={(id, rec) => {
          ozellikModal?.onChange(id, rec)
          setOzellikModal(null)
        }}
        onClose={() => setOzellikModal(null)}
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
