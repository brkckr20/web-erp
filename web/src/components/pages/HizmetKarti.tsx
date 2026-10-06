'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input, Select, Switch, App, Spin } from 'antd'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import { malzemeApi, type Malzeme, type MalzemeFormData } from '@/lib/malzeme-api'
import { useAuth } from '@/context/AuthContext'

interface HizmetFormData {
  kod: string
  ad: string
  ozelKod: string
  kdvGenel: string
  aciklama: string
  kullanimda: boolean
}

const emptyData: HizmetFormData = {
  kod: '',
  ad: '',
  ozelKod: '',
  kdvGenel: '%20',
  aciklama: '',
  kullanimda: true,
}

const kdvOptions = ['%0', '%1', '%8', '%10', '%18', '%20'].map((v) => ({ value: v, label: v }))

interface HizmetKartiProps {
  isNew?: boolean
  kod?: string
}

export default function HizmetKarti({ isNew, kod }: HizmetKartiProps) {
  const { message, modal } = App.useApp()
  const { kullanici } = useAuth()
  const [form, setForm] = useState<HizmetFormData>(emptyData)
  const [id, setId] = useState<number | null>(null)
  const [kayitBilgi, setKayitBilgi] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadByKod = useCallback(async (kod: string) => {
    setLoading(true)
    try {
      const data = await malzemeApi.getByKod(kod)
      if (data.tip !== 6) {
        message.warning('Bu kod bir hizmet kartı değil')
        return
      }
      setId(data.id)
      setForm({
        kod: data.kod,
        ad: data.ad,
        ozelKod: data.ozelKod ?? '',
        kdvGenel: data.kdvGenel ?? '%20',
        aciklama: data.aciklama ?? '',
        kullanimda: data.kullanimda,
      })
      const tarih = data.createdAt ? new Date(data.createdAt).toLocaleString('tr-TR') : ''
      setKayitBilgi([data.kayitYapan, tarih].filter(Boolean).join(' · '))
    } catch {
      message.warning('Kayıt bulunamadı')
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    if (kod && !isNew) {
      loadByKod(kod)
    } else {
      setForm(emptyData)
      setId(null)
      setKayitBilgi('')
    }
  }, [kod, isNew, loadByKod])

  const set = <K extends keyof HizmetFormData>(key: K, value: HizmetFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleYeni = () => {
    setId(null)
    setForm(emptyData)
    setKayitBilgi('')
  }

  const handleKaydet = async () => {
    if (!form.kod.trim()) {
      message.warning('Hizmet kodu zorunludur')
      return
    }
    if (!form.ad.trim()) {
      message.warning('Hizmet adı zorunludur')
      return
    }
    setSaving(true)
    try {
      const payload = {
        kod: form.kod.trim(),
        ad: form.ad.trim(),
        ozelKod: form.ozelKod.trim() || null,
        kdvGenel: form.kdvGenel || null,
        aciklama: form.aciklama.trim() || null,
        kullanimda: form.kullanimda,
        tip: 6,
        hesapBirimi: 'adet',
        kayitYapan: kullanici ? `${kullanici.kod} - ${kullanici.ad}` : null,
      } as unknown as MalzemeFormData
      if (id) {
        await malzemeApi.update(id, payload)
        message.success('Hizmet kartı güncellendi')
      } else {
        const created = await malzemeApi.create(payload)
        setId(created.id)
        const tarih = created.createdAt ? new Date(created.createdAt).toLocaleString('tr-TR') : ''
        setKayitBilgi([(created as Malzeme).kayitYapan, tarih].filter(Boolean).join(' · '))
        message.success('Hizmet kartı oluşturuldu')
      }
    } catch (e: unknown) {
      const msg = (e as Error)?.message ?? ''
      try {
        const parsed = JSON.parse(msg)
        message.error(parsed.message || 'Kayıt sırasında hata oluştu')
      } catch {
        message.error(msg || 'Kayıt sırasında hata oluştu')
      }
    } finally {
      setSaving(false)
    }
  }

  const handlePrevious = async () => {
    try {
      const list = await malzemeApi.list(6)
      const idx = list.findIndex((d) => d.kod === form.kod)
      if (idx <= 0) {
        message.info('İlk kayıttasınız')
        return
      }
      await loadByKod(list[idx - 1].kod)
    } catch {
      message.warning('Önceki kayıt yüklenemedi')
    }
  }

  const handleNext = async () => {
    try {
      const list = await malzemeApi.list(6)
      const idx = list.findIndex((d) => d.kod === form.kod)
      if (idx < 0 || idx >= list.length - 1) {
        message.info('Son kayıttasınız')
        return
      }
      await loadByKod(list[idx + 1].kod)
    } catch {
      message.warning('Sonraki kayıt yüklenemedi')
    }
  }

  const handleSil = () => {
    if (!id) return
    modal.confirm({
      title: 'Hizmet Kartı Sil',
      content: 'Bu hizmet kartını silmek istediğinize emin misiniz?',
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSaving(true)
        try {
          await malzemeApi.delete(id)
          message.success('Hizmet kartı silindi')
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

  return (
    <div className="!h-full !flex !flex-col">
      <div className="!bg-white !border !border-gray-200 !rounded-sm !flex-1 !flex !flex-col !overflow-hidden">
        <CardToolbar buttons={toolbarButtons} />
        <Spin spinning={loading}>
          <div className="!flex !flex-col !px-3 !py-2 !border-b !border-gray-200 !flex-shrink-0">
            <div className="!flex !items-center !gap-4">
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[11px] !font-semibold !text-[#333] !uppercase !w-16">Kodu</label>
                <Input
                  size="small"
                  value={form.kod}
                  onChange={(e) => set('kod', e.target.value)}
                  className="!w-32 !text-[11px]"
                />
              </div>
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[11px] !font-semibold !text-[#333] !uppercase !w-16">Adı</label>
                <Input size="small" value={form.ad} onChange={(e) => set('ad', e.target.value)} className="!w-[280px] !text-[11px]" />
              </div>
              <Switch checked={form.kullanimda} onChange={(checked) => set('kullanimda', checked)} />
              <span className="!text-[11px]">Kullanımda</span>
            </div>
          </div>

          <div className="!overflow-y-auto !overflow-x-hidden !flex-1 !p-3">
            <div className="!w-full max-w-[600px]">
              <div className="!border !border-gray-200 !rounded-sm !p-3">
                <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">Hizmet Detay</div>
                <div className="!space-y-2.5">
                  <FormField label="Özel Kod">
                    <Input size="small" value={form.ozelKod} onChange={(e) => set('ozelKod', e.target.value)} className="!w-48 !text-[11px]" />
                  </FormField>
                  <FormField label="KDV Oranı" required>
                    <Select size="small" value={form.kdvGenel} onChange={(v) => set('kdvGenel', v)} options={kdvOptions} className="!w-32 !text-[11px]" />
                  </FormField>
                  <FormField label="Hesap Birimi">
                    <Input size="small" value="Adet" readOnly className="!w-32 !text-[11px]" />
                  </FormField>
                  <FormField label="Açıklama">
                    <Input.TextArea size="small" value={form.aciklama} onChange={(e) => set('aciklama', e.target.value)} className="!text-[11px]" rows={3} />
                  </FormField>
                  {kayitBilgi && (
                    <FormField label="Kayıt">
                      <span className="!text-[11px] !text-[#6b7280]">{kayitBilgi}</span>
                    </FormField>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Spin>
      </div>
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
