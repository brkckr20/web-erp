'use client'

import { Input, Button, Table, Tabs, Spin, App } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useState, useEffect, useCallback } from 'react'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import RaporSecimModal from '@/components/shared/RaporSecimModal'
import { sirketApi, type SirketAdres, type SirketWeb, type SirketIban } from '@/lib/sirket-api'

const bosAdres = (): SirketAdres & { key: string } => ({
  key: Math.random().toString(36).slice(2),
  baslik: '',
  adres: '',
  ilce: '',
  il: '',
  postaKodu: '',
})
const bosWeb = (): SirketWeb & { key: string } => ({ key: Math.random().toString(36).slice(2), site: '' })
const bosIban = (): SirketIban & { key: string } => ({
  key: Math.random().toString(36).slice(2),
  banka: '',
  iban: '',
  aciklama: '',
})

interface SirketKartiProps {
  id?: number
}

export default function SirketKarti({ id: propId }: SirketKartiProps) {
  const { message, modal } = App.useApp()
  const [id, setId] = useState<number | null>(propId ?? null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [raporModalAcik, setRaporModalAcik] = useState(false)

  const [ad, setAd] = useState('')
  const [telefon, setTelefon] = useState('')
  const [fax, setFax] = useState('')
  const [eposta, setEposta] = useState('')
  const [vergiDairesi, setVergiDairesi] = useState('')
  const [vergiNo, setVergiNo] = useState('')
  const [mersisNo, setMersisNo] = useState('')
  const [eFaturaEtiketi, setEFaturaEtiketi] = useState('')
  const [eIrsaliyeEtiketi, setEIrsaliyeEtiketi] = useState('')
  const [adresler, setAdresler] = useState<(SirketAdres & { key: string })[]>([])
  const [webler, setWebler] = useState<(SirketWeb & { key: string })[]>([])
  const [ibanlar, setIbanlar] = useState<(SirketIban & { key: string })[]>([])

  const doldur = useCallback((s: {
    id: number
    ad: string
    telefon?: string | null
    fax?: string | null
    eposta?: string | null
    vergiDairesi?: string | null
    vergiNo?: string | null
    mersisNo?: string | null
    eFaturaEtiketi?: string | null
    eIrsaliyeEtiketi?: string | null
    adresler?: SirketAdres[]
    webler?: SirketWeb[]
    ibanlar?: SirketIban[]
  }) => {
    setId(s.id)
    setAd(s.ad ?? '')
    setTelefon(s.telefon ?? '')
    setFax(s.fax ?? '')
    setEposta(s.eposta ?? '')
    setVergiDairesi(s.vergiDairesi ?? '')
    setVergiNo(s.vergiNo ?? '')
    setMersisNo(s.mersisNo ?? '')
    setEFaturaEtiketi(s.eFaturaEtiketi ?? '')
    setEIrsaliyeEtiketi(s.eIrsaliyeEtiketi ?? '')
    setAdresler((s.adresler ?? []).map((a) => ({ ...a, key: Math.random().toString(36).slice(2) })))
    setWebler((s.webler ?? []).map((w) => ({ ...w, key: Math.random().toString(36).slice(2) })))
    setIbanlar((s.ibanlar ?? []).map((b) => ({ ...b, key: Math.random().toString(36).slice(2) })))
  }, [])

  const temizle = useCallback(() => {
    setId(null)
    setAd('')
    setTelefon('')
    setFax('')
    setEposta('')
    setVergiDairesi('')
    setVergiNo('')
    setMersisNo('')
    setEFaturaEtiketi('')
    setEIrsaliyeEtiketi('')
    setAdresler([])
    setWebler([])
    setIbanlar([])
  }, [])

  useEffect(() => {
    if (!propId) {
      temizle()
      return
    }
    setLoading(true)
    sirketApi
      .get(propId)
      .then((s) => doldur(s))
      .catch(() => message.warning('Şirket bulunamadı'))
      .finally(() => setLoading(false))
  }, [propId, doldur, temizle, message])

  const handleKaydet = async () => {
    if (!ad.trim()) {
      message.warning('Şirket adı zorunludur')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ad: ad.trim(),
        telefon: telefon || null,
        fax: fax || null,
        eposta: eposta || null,
        vergiDairesi: vergiDairesi || null,
        vergiNo: vergiNo || null,
        mersisNo: mersisNo || null,
        eFaturaEtiketi: eFaturaEtiketi || null,
        eIrsaliyeEtiketi: eIrsaliyeEtiketi || null,
        adresler: adresler.filter((a) => a.adres || a.baslik || a.il || a.ilce).map(({ key: _k, ...rest }) => rest),
        webler: webler.filter((w) => w.site?.trim()).map(({ key: _k, ...rest }) => ({ ...rest, site: rest.site.trim() })),
        ibanlar: ibanlar.filter((b) => b.iban?.trim()).map(({ key: _k, ...rest }) => ({ ...rest, iban: rest.iban.trim() })),
      }
      if (id) {
        await sirketApi.update(id, payload)
        message.success('Şirket güncellendi')
      } else {
        const g = await sirketApi.create(payload)
        setId(g.id)
        message.success('Şirket oluşturuldu')
      }
    } catch (err: unknown) {
      message.error('Hata: ' + ((err as Error)?.message ?? String(err)))
    } finally {
      setSaving(false)
    }
  }

  const gezin = async (yon: -1 | 1) => {
    try {
      const list = await sirketApi.list()
      const idx = list.findIndex((d) => d.id === id)
      const hedef = yon === -1 ? list[idx - 1] : list[idx + 1]
      if (!hedef) {
        message.info(yon === -1 ? 'İlk kayıttasınız' : 'Son kayıttasınız')
        return
      }
      setLoading(true)
      const s = await sirketApi.get(hedef.id)
      doldur(s)
    } catch {
      message.warning('Kayıt yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleSil = () => {
    if (!id) return
    modal.confirm({
      title: 'Şirket Sil',
      content: `"${ad}" kaydını silmek istediğinize emin misiniz?`,
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSaving(true)
        try {
          await sirketApi.remove(id)
          message.success('Şirket silindi')
          temizle()
        } catch {
          message.error('Silme sırasında hata oluştu')
        } finally {
          setSaving(false)
        }
      },
    })
  }

  const toolbarButtons = createToolbarButtons({
    onNew: temizle,
    onSave: handleKaydet,
    onPrevious: () => gezin(-1),
    onNext: () => gezin(1),
    onDelete: handleSil,
    onReport: () => setRaporModalAcik(true),
  }, {
    save: { disabled: saving },
    delete: { disabled: !id },
    report: { disabled: !id },
  })

  const adresKolonlari: ColumnsType<SirketAdres & { key: string }> = [
    { title: 'Başlık', dataIndex: 'baslik', key: 'baslik', width: 130, render: (_, r) => <Input size="small" value={r.baslik ?? ''} onChange={(e) => setAdresler((p) => p.map((x) => (x.key === r.key ? { ...x, baslik: e.target.value } : x)))} /> },
    { title: 'Adres', dataIndex: 'adres', key: 'adres', render: (_, r) => <Input size="small" value={r.adres ?? ''} onChange={(e) => setAdresler((p) => p.map((x) => (x.key === r.key ? { ...x, adres: e.target.value } : x)))} /> },
    { title: 'İlçe', dataIndex: 'ilce', key: 'ilce', width: 120, render: (_, r) => <Input size="small" value={r.ilce ?? ''} onChange={(e) => setAdresler((p) => p.map((x) => (x.key === r.key ? { ...x, ilce: e.target.value } : x)))} /> },
    { title: 'İl', dataIndex: 'il', key: 'il', width: 120, render: (_, r) => <Input size="small" value={r.il ?? ''} onChange={(e) => setAdresler((p) => p.map((x) => (x.key === r.key ? { ...x, il: e.target.value } : x)))} /> },
    { title: 'Posta Kodu', dataIndex: 'postaKodu', key: 'postaKodu', width: 110, render: (_, r) => <Input size="small" value={r.postaKodu ?? ''} onChange={(e) => setAdresler((p) => p.map((x) => (x.key === r.key ? { ...x, postaKodu: e.target.value } : x)))} /> },
    { title: '', key: 'sil', width: 40, render: (_, r) => <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => setAdresler((p) => p.filter((x) => x.key !== r.key))} /> },
  ]

  const webKolonlari: ColumnsType<SirketWeb & { key: string }> = [
    { title: 'Web Sitesi', dataIndex: 'site', key: 'site', render: (_, r) => <Input size="small" value={r.site ?? ''} placeholder="ornek.com" onChange={(e) => setWebler((p) => p.map((x) => (x.key === r.key ? { ...x, site: e.target.value } : x)))} /> },
    { title: '', key: 'sil', width: 40, render: (_, r) => <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => setWebler((p) => p.filter((x) => x.key !== r.key))} /> },
  ]

  const ibanKolonlari: ColumnsType<SirketIban & { key: string }> = [
    { title: 'Banka', dataIndex: 'banka', key: 'banka', width: 180, render: (_, r) => <Input size="small" value={r.banka ?? ''} onChange={(e) => setIbanlar((p) => p.map((x) => (x.key === r.key ? { ...x, banka: e.target.value } : x)))} /> },
    { title: 'IBAN', dataIndex: 'iban', key: 'iban', render: (_, r) => <Input size="small" value={r.iban ?? ''} placeholder="TR..." onChange={(e) => setIbanlar((p) => p.map((x) => (x.key === r.key ? { ...x, iban: e.target.value } : x)))} /> },
    { title: 'Açıklama', dataIndex: 'aciklama', key: 'aciklama', width: 200, render: (_, r) => <Input size="small" value={r.aciklama ?? ''} onChange={(e) => setIbanlar((p) => p.map((x) => (x.key === r.key ? { ...x, aciklama: e.target.value } : x)))} /> },
    { title: '', key: 'sil', width: 40, render: (_, r) => <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => setIbanlar((p) => p.filter((x) => x.key !== r.key))} /> },
  ]

  const alan = (etiket: string, value: string, set: (v: string) => void) => (
    <div className="!flex !items-center !gap-3">
      <div className="!text-[12px] !text-[#6b7280] !w-32 !shrink-0">{etiket}</div>
      <Input size="small" value={value} onChange={(e) => set(e.target.value)} className="!flex-1 !text-[12px]" />
    </div>
  )

  return (
    <Spin spinning={loading} className="!h-full">
      <div className="!px-3 !flex !flex-col !h-full !overflow-hidden">
        <div style={{ marginLeft: -12, marginRight: -12 }}>
          <CardToolbar buttons={toolbarButtons} />
        </div>
        <div className="!flex-1 !min-h-0 !border !border-gray-200 !rounded-sm !bg-white !p-2 !overflow-auto !space-y-1.5">
          <div className="!text-[12px] !font-bold !uppercase !text-[#333]">{id ? `Şirket Kartı - ${ad}` : 'Yeni Şirket Kartı'}</div>
          {alan('Şirket Adı *', ad, setAd)}
          {alan('Telefon', telefon, setTelefon)}
          {alan('Fax', fax, setFax)}
          {alan('E-Posta', eposta, setEposta)}
          {alan('Vergi Dairesi', vergiDairesi, setVergiDairesi)}
          {alan('Vergi No', vergiNo, setVergiNo)}
          {alan('Mersis No', mersisNo, setMersisNo)}
          {alan('E-Fatura Etiketi', eFaturaEtiketi, setEFaturaEtiketi)}
          {alan('E-İrsaliye Etiketi', eIrsaliyeEtiketi, setEIrsaliyeEtiketi)}
          <Tabs
            size="small"
            tabBarGutter={2}
            className="!flex-shrink-0 [&_.ant-tabs-nav]:!mb-[2px] [&_.ant-tabs-nav]:!border-b [&_.ant-tabs-nav]:!border-gray-200 [&_.ant-tabs-tab]:!text-[11px] [&_.ant-tabs-tab]:!px-2 [&_.ant-tabs-tab]:!py-1 [&_.ant-tabs-tab]:!bg-[#E0E0E0] [&_.ant-tabs-tab]:!border [&_.ant-tabs-tab]:!border-gray-200 [&_.ant-tabs-tab]:!text-[#333] [&_.ant-tabs-tab-active]:!bg-white [&_.ant-tabs-tab-active]:!border-t-2 [&_.ant-tabs-tab-active]:!border-t-[#FF9933] [&_.ant-tabs-tab-active]:!text-[#FF9933] [&_.ant-tabs-ink-bar]:!hidden"
            items={[
              {
                key: 'adres',
                label: `Adresler (${adresler.length})`,
                children: (
                  <div>
                    <Button size="small" icon={<PlusOutlined />} onClick={() => setAdresler((p) => [...p, bosAdres()])} className="!mb-2">Adres Ekle</Button>
                    <Table size="small" pagination={false} rowKey="key" dataSource={adresler} columns={adresKolonlari} />
                  </div>
                ),
              },
              {
                key: 'web',
                label: `Web Siteleri (${webler.length})`,
                children: (
                  <div>
                    <Button size="small" icon={<PlusOutlined />} onClick={() => setWebler((p) => [...p, bosWeb()])} className="!mb-2">Site Ekle</Button>
                    <Table size="small" pagination={false} rowKey="key" dataSource={webler} columns={webKolonlari} />
                  </div>
                ),
              },
              {
                key: 'iban',
                label: `IBAN (${ibanlar.length})`,
                children: (
                  <div>
                    <Button size="small" icon={<PlusOutlined />} onClick={() => setIbanlar((p) => [...p, bosIban()])} className="!mb-2">IBAN Ekle</Button>
                    <Table size="small" pagination={false} rowKey="key" dataSource={ibanlar} columns={ibanKolonlari} />
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
      <RaporSecimModal
        open={raporModalAcik}
        ekranAdi="sirket-tanimlari"
        parametreler={id ? { id } : undefined}
        onCancel={() => setRaporModalAcik(false)}
      />
    </Spin>
  )
}
