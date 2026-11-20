'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input, InputNumber, Checkbox, Row, Col, Select, App, Spin } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import { useKirli } from '@/lib/kirli'
import { kasaBankaHesapApi } from '@/lib/kasa-banka-hesap-api'
import type { CreateKasaBankaHesap, KasaBankaTipi } from '@/lib/kasa-banka-hesap-api'
import { dovizApi } from '@/lib/doviz-api'

const { TextArea } = Input

const emptyData = (tip: KasaBankaTipi): CreateKasaBankaHesap => ({
  kod: '',
  ad: '',
  tip,
  dovizKodu: 'TRY',
  acilisBakiye: 0,
  bankaAdi: '',
  sube: '',
  iban: '',
  hesapNo: '',
  kullanimda: true,
  aciklama: '',
})

interface KasaBankaHesapKartiProps {
  tip: KasaBankaTipi
  kod?: string
  onKirliChange?: (kirli: boolean) => void
}

export default function KasaBankaHesapKarti({ tip, kod, onKirliChange }: KasaBankaHesapKartiProps) {
  const { message, modal } = App.useApp()
  const [form, setForm] = useState<CreateKasaBankaHesap>(emptyData(tip))
  const [id, setId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dovizler, setDovizler] = useState<{ value: string; label: string }[]>([
    { value: 'TRY', label: 'TRY' },
  ])
  const { kirli, temizle } = useKirli([form])
  useEffect(() => { onKirliChange?.(kirli) }, [kirli, onKirliChange])

  useEffect(() => {
    dovizApi
      .list()
      .then((list) => {
        const opts = list.map((d) => ({ value: d.kod, label: `${d.kod} - ${d.ad}` }))
        if (!opts.some((o) => o.value === 'TRY')) opts.unshift({ value: 'TRY', label: 'TRY' })
        setDovizler(opts)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (kod) {
      loadByKod(kod)
    } else {
      setForm(emptyData(tip))
      setId(null)
    }
  }, [kod, tip])

  const loadByKod = useCallback(
    async (kod: string) => {
      setLoading(true)
      try {
        const data = await kasaBankaHesapApi.getByKod(kod)
        if (data.tip !== tip) {
          message.warning(tip === 'kasa' ? 'Bu kod bir banka hesabına ait' : 'Bu kod bir kasa hesabına ait')
          setForm(emptyData(tip))
          setId(null)
          return
        }
        setId(data.id)
        setForm({
          kod: data.kod,
          ad: data.ad,
          tip: data.tip,
          dovizKodu: data.dovizKodu ?? 'TRY',
          acilisBakiye: Number(data.acilisBakiye) || 0,
          bankaAdi: data.bankaAdi ?? '',
          sube: data.sube ?? '',
          iban: data.iban ?? '',
          hesapNo: data.hesapNo ?? '',
          kullanimda: data.kullanimda,
          aciklama: data.aciklama ?? '',
        })
      } catch {
        message.warning('Kod bulunamadı')
      } finally {
        setLoading(false)
        temizle()
      }
    },
    [tip],
  )

  const set = <K extends keyof CreateKasaBankaHesap>(key: K, value: CreateKasaBankaHesap[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleKodAra = async () => {
    if (!form.kod.trim()) return
    await loadByKod(form.kod.trim())
  }

  const handleKodKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleKodAra()
  }

  const handleYeni = () => {
    setId(null)
    setForm(emptyData(tip))
    temizle()
  }

  const handleKaydet = async () => {
    if (!form.kod.trim()) {
      message.warning('Kod alanı zorunludur')
      return
    }
    if (!form.ad.trim()) {
      message.warning('Ad alanı zorunludur')
      return
    }
    setSaving(true)
    try {
      if (id) {
        await kasaBankaHesapApi.update(id, form)
        message.success('Kaydedildi')
      } else {
        const created = await kasaBankaHesapApi.create(form)
        setId(created.id)
        message.success('Kaydedildi')
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
      const list = await kasaBankaHesapApi.list(tip)
      const idx = list.findIndex((d) => d.kod === form.kod)
      if (idx <= 0) {
        message.info('İlk kayıttasınız')
        return
      }
      await loadByKod(list[idx - 1].kod)
      temizle()
    } catch {
      message.warning('Önceki kayıt yüklenemedi')
    }
  }

  const handleNext = async () => {
    try {
      const list = await kasaBankaHesapApi.list(tip)
      const idx = list.findIndex((d) => d.kod === form.kod)
      if (idx < 0 || idx >= list.length - 1) {
        message.info('Son kayıttasınız')
        return
      }
      await loadByKod(list[idx + 1].kod)
      temizle()
    } catch {
      message.warning('Sonraki kayıt yüklenemedi')
    }
  }

  const handleSil = () => {
    if (!id) return
    modal.confirm({
      title: 'Hesap Sil',
      content: 'Bu hesabı silmek istediğinize emin misiniz?',
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSaving(true)
        try {
          await kasaBankaHesapApi.remove(id)
          message.success('Hesap silindi')
          handleYeni()
        } catch {
          message.error('Silme sırasında hata oluştu')
        } finally {
          setSaving(false)
          temizle()
        }
      },
    })
  }

  const toolbarButtons = createToolbarButtons(
    {
      onNew: handleYeni,
      onSave: handleKaydet,
      onPrevious: handlePrevious,
      onNext: handleNext,
      onDelete: handleSil,
    },
    { save: { accent: kirli } },
  )

  const ekranAdi = tip === 'kasa' ? 'Kasa Hesabı' : 'Banka Hesabı'

  return (
    <div className="!h-full !flex !flex-col">
      <div className="!bg-white !border !border-gray-200 !rounded-sm !flex-1 !flex !flex-col !overflow-hidden">
        <CardToolbar buttons={toolbarButtons} />
        <Spin spinning={loading || saving}>
          <div className="!flex !flex-col !px-3 !py-2 !border-b !border-gray-200 !flex-shrink-0">
            <div className="!flex !items-center !gap-4">
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[11px] !font-semibold !text-[#333] !uppercase !w-12">Kodu</label>
                <Input
                  size="small"
                  suffix={
                    <SearchOutlined
                      style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }}
                      onClick={handleKodAra}
                    />
                  }
                  value={form.kod}
                  onChange={(e) => set('kod', e.target.value)}
                  onKeyDown={handleKodKeyDown}
                  className="!w-32 !text-[11px]"
                />
              </div>
            </div>
            <div className="!flex !items-center !gap-4 !mt-1.5">
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[11px] !font-semibold !text-[#333] !uppercase !w-12">Adı</label>
                <Input size="small" value={form.ad} onChange={(e) => set('ad', e.target.value)} className="!w-[220px] !text-[11px]" />
              </div>
              <Checkbox checked={form.kullanimda} onChange={(e) => set('kullanimda', e.target.checked)} className="!text-[11px]">
                Kullanımda
              </Checkbox>
            </div>
          </div>

          <div className="!flex-1 !min-h-0 !overflow-auto !p-3">
            <Row gutter={[16, 12]}>
              <Col span={12}>
                <div className="!border !border-gray-200 !rounded-sm !p-3">
                  <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">
                    {ekranAdi} Tanım Bilgileri
                  </div>
                  <div className="!space-y-2.5">
                    <FormField label="Tip">
                      <Input size="small" value={tip === 'kasa' ? 'Kasa' : 'Banka'} disabled className="!text-[11px]" />
                    </FormField>
                    <FormField label="Döviz">
                      <Select
                        size="small"
                        value={form.dovizKodu}
                        onChange={(v) => set('dovizKodu', v)}
                        options={dovizler}
                        className="!w-full !text-[11px]"
                      />
                    </FormField>
                    <FormField label="Açılış Bakiyesi">
                      <InputNumber
                        size="small"
                        value={form.acilisBakiye}
                        onChange={(v) => set('acilisBakiye', Number(v ?? 0))}
                        step={0.01}
                        className="!w-full !text-[11px]"
                      />
                    </FormField>
                    <FormField label="Açıklama">
                      <TextArea
                        size="small"
                        value={form.aciklama}
                        onChange={(e) => set('aciklama', e.target.value)}
                        rows={3}
                        className="!text-[11px]"
                      />
                    </FormField>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                {tip === 'banka' && (
                  <div className="!border !border-gray-200 !rounded-sm !p-3">
                    <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">
                      Banka Bilgileri
                    </div>
                    <div className="!space-y-2.5">
                      <FormField label="Banka Adı">
                        <Input size="small" value={form.bankaAdi} onChange={(e) => set('bankaAdi', e.target.value)} className="!text-[11px]" />
                      </FormField>
                      <FormField label="Şube">
                        <Input size="small" value={form.sube} onChange={(e) => set('sube', e.target.value)} className="!text-[11px]" />
                      </FormField>
                      <FormField label="IBAN">
                        <Input size="small" value={form.iban} onChange={(e) => set('iban', e.target.value)} className="!text-[11px]" />
                      </FormField>
                      <FormField label="Hesap No">
                        <Input size="small" value={form.hesapNo} onChange={(e) => set('hesapNo', e.target.value)} className="!text-[11px]" />
                      </FormField>
                    </div>
                  </div>
                )}
              </Col>
            </Row>
          </div>
        </Spin>
      </div>
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
