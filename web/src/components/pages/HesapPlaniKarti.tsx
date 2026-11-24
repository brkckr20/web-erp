'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input, Select, App, Spin } from 'antd'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import { useKirli } from '@/lib/kirli'
import { muhasebeHesapApi, type MuhasebeHesap, type HesapTipi, type HesapTuru } from '@/lib/muhasebe-hesap-api'

const { TextArea } = Input
const HESAP_TIPI_OPTIONS = [
  { value: 'PARASAL', label: 'Parasal' },
  { value: 'PARASAL_OLMAYAN_BORC', label: 'Parasal Olmayan Borç' },
  { value: 'PARASAL_OLMAYAN_ALACAK', label: 'Parasal Olmayan Alacak' },
]
const HESAP_TURU_OPTIONS = [
  { value: 'BORC_ALACAK', label: 'Borç + Alacak' },
  { value: 'BORC', label: 'Borç' },
  { value: 'ALACAK', label: 'Alacak' },
]

interface Props { id?: number; onKirliChange?: (kirli: boolean) => void }

export default function HesapPlaniKarti({ id: propId, onKirliChange }: Props) {
  const { message, modal } = App.useApp()
  const [id, setId] = useState<number | null>(propId ?? null)
  const [kod, setKod] = useState('')
  const [ad, setAd] = useState('')
  const [erisimKodu, setErisimKodu] = useState('')
  const [ozelKod, setOzelKod] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [hesapTipi, setHesapTipi] = useState<HesapTipi>('PARASAL')
  const [hesapTuru, setHesapTuru] = useState<HesapTuru>('BORC_ALACAK')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { kirli, temizle } = useKirli([kod, ad, erisimKodu, ozelKod, aciklama, hesapTipi, hesapTuru])
  useEffect(() => { onKirliChange?.(kirli) }, [kirli, onKirliChange])

  const doldur = useCallback((m: MuhasebeHesap) => {
    setId(m.id); setKod(m.kod); setAd(m.ad)
    setErisimKodu(m.erisimKodu ?? ''); setOzelKod(m.ozelKod ?? ''); setAciklama(m.aciklama ?? '')
    setHesapTipi(m.hesapTipi ?? 'PARASAL'); setHesapTuru(m.hesapTuru ?? 'BORC_ALACAK')
  }, [])

  const handleYeni = useCallback(() => {
    setId(null); setKod(''); setAd(''); setErisimKodu(''); setOzelKod(''); setAciklama('')
    setHesapTipi('PARASAL'); setHesapTuru('BORC_ALACAK'); temizle()
  }, [temizle])

  const load = useCallback(async (pid: number) => {
    setLoading(true)
    try { doldur(await muhasebeHesapApi.getById(pid)); temizle() }
    catch { message.warning('Kayıt yüklenemedi') }
    finally { setLoading(false) }
  }, [doldur, message, temizle])

  useEffect(() => { if (propId) load(propId); else handleYeni() }, [propId, load, handleYeni])

  const handleKaydet = async () => {
    if (!kod.trim()) return message.warning('Kod alanı zorunludur')
    if (!ad.trim()) return message.warning('Ad alanı zorunludur')
    setSaving(true)
    try {
      const payload = { kod: kod.trim(), ad: ad.trim(), erisimKodu: erisimKodu.trim() || null, ozelKod: ozelKod.trim() || null, aciklama: aciklama.trim() || null, hesapTipi, hesapTuru }
      if (id) { await muhasebeHesapApi.update(id, payload); message.success('Kaydedildi') }
      else { const c = await muhasebeHesapApi.create(payload); setId(c.id); message.success('Kaydedildi') }
      temizle()
    } catch (e: any) { message.error(e?.message || 'Kayıt sırasında hata oluştu') }
    finally { setSaving(false) }
  }

  const handleSil = () => {
    if (!id) return
    modal.confirm({ title: 'Muhasebe Hesabı Sil', content: 'Bu hesabı silmek istediğinize emin misiniz?', okText: 'Evet, Sil', cancelText: 'İptal', okButtonProps: { danger: true },
      onOk: async () => { try { await muhasebeHesapApi.remove(id); message.success('Silindi'); handleYeni() } catch (e: any) { message.error(e?.message || 'Silinemedi') } } })
  }

  const navigate = async (dir: -1 | 1) => {
    const list = await muhasebeHesapApi.list()
    const idx = list.findIndex((d) => d.id === id)
    const next = list[idx + dir]
    if (!next) return message.info(dir < 0 ? 'İlk kayıttasınız' : 'Son kayıttasınız')
    doldur(next); temizle()
  }

  const toolbarButtons = createToolbarButtons({ onNew: handleYeni, onSave: handleKaydet, onPrevious: () => navigate(-1), onNext: () => navigate(1), onDelete: handleSil }, { save: { accent: kirli } })

  return (
    <div className="!h-full !flex !flex-col">
      <div className="!bg-white !border !border-gray-200 !rounded-sm !flex-1 !flex !flex-col !overflow-hidden">
        <CardToolbar buttons={toolbarButtons} />
        <Spin spinning={loading || saving}>
          <div className="!px-4 !py-3 !space-y-3">
            <div className="!flex !items-center !gap-3">
              <label className="!text-[12px] !text-[#333] !w-28 !shrink-0">Kod <span className="!text-red-500">*</span></label>
              <Input size="small" value={kod} onChange={(e) => setKod(e.target.value)} className="!w-48 !text-[12px]" />
            </div>
            <div className="!flex !items-center !gap-3">
              <label className="!text-[12px] !text-[#333] !w-28 !shrink-0">Ad <span className="!text-red-500">*</span></label>
              <Input size="small" value={ad} onChange={(e) => setAd(e.target.value)} className="!w-96 !text-[12px]" />
            </div>
            <div className="!flex !items-center !gap-3">
              <label className="!text-[12px] !text-[#333] !w-28 !shrink-0">Erişim Kodu</label>
              <Input size="small" value={erisimKodu} onChange={(e) => setErisimKodu(e.target.value)} className="!w-48 !text-[12px]" />
            </div>
            <div className="!flex !items-center !gap-3">
              <label className="!text-[12px] !text-[#333] !w-28 !shrink-0">Özel Kod</label>
              <Input size="small" value={ozelKod} onChange={(e) => setOzelKod(e.target.value)} className="!w-48 !text-[12px]" />
            </div>
            <div className="!flex !items-start !gap-3">
              <label className="!text-[12px] !text-[#333] !w-28 !shrink-0 !pt-1">Açıklama</label>
              <TextArea size="small" value={aciklama} onChange={(e) => setAciklama(e.target.value)} className="!w-96 !text-[12px]" rows={2} />
            </div>
            <div className="!flex !items-center !gap-3">
              <label className="!text-[12px] !text-[#333] !w-28 !shrink-0">Hesap Tipi</label>
              <Select size="small" value={hesapTipi} onChange={setHesapTipi} options={HESAP_TIPI_OPTIONS} className="!w-56 !text-[12px]" />
            </div>
            <div className="!flex !items-center !gap-3">
              <label className="!text-[12px] !text-[#333] !w-28 !shrink-0">Hesap Türü</label>
              <Select size="small" value={hesapTuru} onChange={setHesapTuru} options={HESAP_TURU_OPTIONS} className="!w-56 !text-[12px]" />
            </div>
          </div>
        </Spin>
      </div>
    </div>
  )
}
