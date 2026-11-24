'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Input, Select, Row, Col, App, Spin } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import { useKirli } from '@/lib/kirli'
import { masrafYeriApi, type MasrafYeri } from '@/lib/masraf-yeri-api'
import { dovizApi, type Doviz } from '@/lib/doviz-api'

const { TextArea } = Input

interface MasrafYeriKartiProps {
  id?: number
  onKirliChange?: (kirli: boolean) => void
}

export default function MasrafYeriKarti({ id: propId, onKirliChange }: MasrafYeriKartiProps) {
  const { message, modal } = App.useApp()
  const [id, setId] = useState<number | null>(propId ?? null)
  const [kod, setKod] = useState('')
  const [ad, setAd] = useState('')
  const [ozelKod, setOzelKod] = useState('')
  const [erisimKodu, setErisimKodu] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [dovizCinsi, setDovizCinsi] = useState('TRY')
  const [dovizler, setDovizler] = useState<Doviz[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { kirli, temizle: temizleKirli } = useKirli([
    kod,
    ad,
    ozelKod,
    erisimKodu,
    aciklama,
    dovizCinsi,
  ])
  useEffect(() => { onKirliChange?.(kirli) }, [kirli, onKirliChange])

  useEffect(() => {
    dovizApi
      .list()
      .then((list) => setDovizler(list.filter((d) => d.kullanimda)))
      .catch(() => setDovizler([]))
  }, [])

  const dovizSecenekleri = useMemo(() => {
    const opts = dovizler.map((d) => ({ value: d.kod, label: `${d.kod} - ${d.ad}` }))
    if (!opts.some((o) => o.value === 'TRY')) opts.unshift({ value: 'TRY', label: 'TRY - Türk Lirası' })
    return opts
  }, [dovizler])

  const doldur = useCallback((m: MasrafYeri) => {
    setId(m.id)
    setKod(m.kod)
    setAd(m.ad)
    setOzelKod(m.ozelKod ?? '')
    setErisimKodu(m.erisimKodu ?? '')
    setAciklama(m.aciklama ?? '')
    setDovizCinsi(m.dovizCinsi ?? 'TRY')
  }, [])

  const load = useCallback(
    async (pid: number) => {
      setLoading(true)
      try {
        doldur(await masrafYeriApi.getById(pid))
        temizleKirli()
      } catch {
        message.warning('Kayıt yüklenemedi')
      } finally {
        setLoading(false)
      }
    },
    [doldur, message, temizleKirli],
  )

  useEffect(() => {
    if (propId) {
      load(propId)
    } else {
      setId(null)
      setKod('')
      setAd('')
      setOzelKod('')
      setErisimKodu('')
      setAciklama('')
      setDovizCinsi('TRY')
      temizleKirli()
    }
  }, [propId])

  const handleYeni = () => {
    setId(null)
    setKod('')
    setAd('')
    setOzelKod('')
    setErisimKodu('')
    setAciklama('')
    setDovizCinsi('TRY')
    temizleKirli()
  }

  const handleKodAra = async () => {
    if (!kod.trim()) return
    try {
      doldur(await masrafYeriApi.getByKod(kod.trim()))
      temizleKirli()
    } catch {
      message.warning('Kod bulunamadı')
    }
  }

  const handleKaydet = async () => {
    if (!kod.trim()) {
      message.warning('Kod alanı zorunludur')
      return
    }
    if (!ad.trim()) {
      message.warning('Ad alanı zorunludur')
      return
    }
    setSaving(true)
    try {
      const payload = {
        kod: kod.trim(),
        ad: ad.trim(),
        ozelKod: ozelKod.trim() || null,
        erisimKodu: erisimKodu.trim() || null,
        aciklama: aciklama.trim() || null,
        dovizCinsi: dovizCinsi || null,
      }
      if (id) {
        await masrafYeriApi.update(id, payload)
        message.success('Kaydedildi')
      } else {
        const created = await masrafYeriApi.create(payload)
        setId(created.id)
        message.success('Kaydedildi')
      }
    } catch {
      message.error('Kayıt sırasında hata oluştu')
    } finally {
      setSaving(false)
      temizleKirli()
    }
  }

  const handlePrevious = async () => {
    try {
      const list = await masrafYeriApi.list()
      const idx = list.findIndex((d) => d.id === id)
      if (idx <= 0) {
        message.info('İlk kayıttasınız')
        return
      }
      doldur(list[idx - 1])
      temizleKirli()
    } catch {
      message.warning('Önceki kayıt yüklenemedi')
    }
  }

  const handleNext = async () => {
    try {
      const list = await masrafYeriApi.list()
      const idx = list.findIndex((d) => d.id === id)
      if (idx < 0 || idx >= list.length - 1) {
        message.info('Son kayıttasınız')
        return
      }
      doldur(list[idx + 1])
      temizleKirli()
    } catch {
      message.warning('Sonraki kayıt yüklenemedi')
    }
  }

  const handleSil = () => {
    if (!id) return
    modal.confirm({
      title: 'Masraf Yeri Sil',
      content: 'Bu masraf yerini silmek istediğinize emin misiniz?',
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSaving(true)
        try {
          await masrafYeriApi.remove(id)
          message.success('Masraf yeri silindi')
          handleYeni()
        } catch {
          message.error('Silme sırasında hata oluştu')
        } finally {
          setSaving(false)
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
                  value={kod}
                  onChange={(e) => setKod(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleKodAra()
                  }}
                  className="!w-32 !text-[11px]"
                />
              </div>
            </div>
            <div className="!flex !items-center !gap-4 !mt-1.5">
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[11px] !font-semibold !text-[#333] !uppercase !w-12">Adı</label>
                <Input size="small" value={ad} onChange={(e) => setAd(e.target.value)} className="!w-[220px] !text-[11px]" />
              </div>
            </div>
          </div>

          <div className="!flex-1 !min-h-0 !overflow-auto !p-3">
            <Row gutter={[16, 12]}>
              <Col span={12}>
                <div className="!border !border-gray-200 !rounded-sm !p-3">
                  <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">
                    Masraf Yeri Tanım Bilgileri
                  </div>
                  <div className="!space-y-2.5">
                    <div className="!flex !items-start !gap-2">
                      <label className="!text-[10px] !font-semibold !uppercase !w-28 !text-right !shrink-0 !text-[#333] !pt-1">
                        Özel Kod
                      </label>
                      <Input
                        size="small"
                        maxLength={100}
                        value={ozelKod}
                        onChange={(e) => setOzelKod(e.target.value)}
                        className="!text-[11px]"
                      />
                    </div>
                    <div className="!flex !items-start !gap-2">
                      <label className="!text-[10px] !font-semibold !uppercase !w-28 !text-right !shrink-0 !text-[#333] !pt-1">
                        Erişim Kodu
                      </label>
                      <Input
                        size="small"
                        maxLength={100}
                        value={erisimKodu}
                        onChange={(e) => setErisimKodu(e.target.value)}
                        className="!text-[11px]"
                      />
                    </div>
                    <div className="!flex !items-start !gap-2">
                      <label className="!text-[10px] !font-semibold !uppercase !w-28 !text-right !shrink-0 !text-[#333] !pt-1">
                        Döviz Cinsi
                      </label>
                      <Select
                        size="small"
                        showSearch
                        optionFilterProp="label"
                        value={dovizCinsi || undefined}
                        onChange={setDovizCinsi}
                        options={dovizSecenekleri}
                        className="!w-48 !text-[11px]"
                      />
                    </div>
                    <div className="!flex !items-start !gap-2">
                      <label className="!text-[10px] !font-semibold !uppercase !w-28 !text-right !shrink-0 !text-[#333] !pt-1">
                        Açıklama
                      </label>
                      <TextArea
                        size="small"
                        value={aciklama}
                        onChange={(e) => setAciklama(e.target.value)}
                        rows={3}
                        className="!text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </Spin>
      </div>
    </div>
  )
}