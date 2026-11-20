'use client'

import { Fragment, useState, useEffect, useCallback, useMemo } from 'react'
import { Input, Switch, App, Spin, Checkbox } from 'antd'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import { modules } from '@/data/modules'
import { rolApi, type Izin } from '@/lib/rol-api'
import { ekranIzinKodu } from '@/lib/yetki'
import { useKirli } from '@/lib/kirli'
import { hataMetni } from '@/lib/hata'

const ISLEMLER = ['goruntule', 'kaydet', 'sil', 'iptal'] as const
const ISLEM_ADLARI: Record<string, string> = {
  goruntule: 'Görüntüle',
  kaydet: 'Kaydet',
  sil: 'Sil',
  iptal: 'İptal',
}

interface RolForm {
  ad: string
  aciklama: string
  aktif: boolean
  izinIdler: number[]
}

const emptyData: RolForm = {
  ad: '',
  aciklama: '',
  aktif: true,
  izinIdler: [],
}

interface RolKartiProps {
  id?: number
  isNew?: boolean
  onKirliChange?: (kirli: boolean) => void
}

export default function RolKarti({ id, isNew, onKirliChange }: RolKartiProps) {
  const { message, modal } = App.useApp()
  const [form, setForm] = useState<RolForm>(emptyData)
  const [kayitId, setKayitId] = useState<number | null>(null)
  const [tumIzinler, setTumIzinler] = useState<Izin[]>([])
  const [acikModuller, setAcikModuller] = useState<Record<string, boolean>>({})
  const [acikGruplar, setAcikGruplar] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { kirli, temizle } = useKirli([form])
  useEffect(() => { onKirliChange?.(kirli) }, [kirli, onKirliChange])

  useEffect(() => {
    rolApi
      .izinler()
      .then(setTumIzinler)
      .catch(() => {
        setTumIzinler([])
        message.error('İzin listesi yüklenemedi')
      })
  }, [message])

  useEffect(() => {
    if (id && !isNew) {
      loadRol(id)
    } else {
      setForm(emptyData)
      setKayitId(null)
    }
  }, [id, isNew])

  const izinByKod = useMemo(
    () => new Map(tumIzinler.map((izin) => [izin.kod, izin])),
    [tumIzinler],
  )

  // Ekran ağacındaki tüm izin id'leri (modül kodu türetimi sunucuda yapılır).
  const ekranIzinIdSet = useMemo(
    () => new Set(tumIzinler.filter((izin) => izin.kod.startsWith('ekran.')).map((izin) => izin.id)),
    [tumIzinler],
  )

  const izinIdleri = useCallback(
    (modul: string, ekranlar: { key: string }[]): number[] => {
      const idler: number[] = []
      for (const ekran of ekranlar) {
        for (const islem of ISLEMLER) {
          const izin = izinByKod.get(ekranIzinKodu(modul, ekran.key, islem))
          if (izin) idler.push(izin.id)
        }
      }
      return idler
    },
    [izinByKod],
  )

  const secimDurumu = useCallback(
    (idler: number[]) => {
      const secili = idler.filter((id) => form.izinIdler.includes(id)).length
      return {
        checked: idler.length > 0 && secili === idler.length,
        indeterminate: secili > 0 && secili < idler.length,
      }
    },
    [form.izinIdler],
  )

  const izinleriDegistir = (idler: number[], secili: boolean) =>
    setForm((prev) => ({
      ...prev,
      izinIdler: secili
        ? [...new Set([...prev.izinIdler, ...idler])]
        : prev.izinIdler.filter((id) => !idler.includes(id)),
    }))

  const seciliEkranIzni = form.izinIdler.filter((id) => ekranIzinIdSet.has(id)).length

  const loadRol = useCallback(async (rolId: number) => {
    setLoading(true)
    try {
      const data = await rolApi.get(rolId)
      setKayitId(data.id)
      // Yalnız ekran izinleri düzenlenir; modül kodları kayıtta sunucuda türetilir.
      const ekranIzinleri = data.izinler.filter((r) => r.izin.kod.startsWith('ekran.'))
      setForm({
        ad: data.ad,
        aciklama: data.aciklama ?? '',
        aktif: data.aktif,
        izinIdler: ekranIzinleri.map((i) => i.izinId),
      })
      // Seçili ekranların menü ve gruplarını açık başlat.
      const moduller: Record<string, boolean> = {}
      const gruplar: Record<string, boolean> = {}
      for (const { izin } of ekranIzinleri) {
        const [, modulKey, ekranKey] = izin.kod.split('.')
        if (modulKey) moduller[modulKey] = true
        const mod = modules.find((m) => m.key === modulKey)
        const grup = mod?.categories.find((c) => c.items.some((i) => i.key === ekranKey))
        if (modulKey && grup) gruplar[`${modulKey}.${grup.title}`] = true
      }
      setAcikModuller(moduller)
      setAcikGruplar(gruplar)
    } catch {
      message.warning('Rol bulunamadı')
    } finally {
      setLoading(false)
      temizle()
    }
  }, [message])

  const set = <K extends keyof RolForm>(key: K, value: RolForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleYeni = () => {
    setKayitId(null)
    setForm(emptyData)
    temizle()
  }

  const handleKaydet = async () => {
    if (!form.ad.trim()) {
      message.warning('Rol adı zorunludur')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ad: form.ad.trim(),
        aciklama: form.aciklama.trim(),
        aktif: form.aktif,
        izinIdler: form.izinIdler,
      }
      if (kayitId) {
        const data = await rolApi.update(kayitId, payload)
        setForm({ ...form, ad: data.ad, aciklama: data.aciklama ?? '', aktif: data.aktif })
        message.success('Rol güncellendi')
      } else {
        const data = await rolApi.create(payload)
        setKayitId(data.id)
        message.success('Rol oluşturuldu')
      }
    } catch (e) {
      message.error(hataMetni(e, 'Kayıt sırasında hata oluştu'))
    } finally {
      setSaving(false)
      temizle()
    }
  }

  const handlePrevious = async () => {
    try {
      const list = await rolApi.list()
      const idx = list.findIndex((r) => r.id === kayitId)
      if (idx <= 0) {
        message.info('İlk kayıttasınız')
        return
      }
      await loadRol(list[idx - 1].id)
    } catch {
      message.warning('Önceki kayıt yüklenemedi')
    }
  }

  const handleNext = async () => {
    try {
      const list = await rolApi.list()
      const idx = list.findIndex((r) => r.id === kayitId)
      if (idx < 0 || idx >= list.length - 1) {
        message.info('Son kayıttasınız')
        return
      }
      await loadRol(list[idx + 1].id)
    } catch {
      message.warning('Sonraki kayıt yüklenemedi')
    }
  }

  const handleSil = () => {
    if (!kayitId) return
    modal.confirm({
      title: 'Rol Sil',
      content: 'Bu rolü silmek istediğinize emin misiniz?',
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSaving(true)
        try {
          await rolApi.delete(kayitId)
          message.success('Rol silindi')
          handleYeni()
        } catch (e) {
          message.error(hataMetni(e, 'Silme sırasında hata oluştu'))
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
        <Spin
          spinning={loading || saving}
          className="!flex-1 !min-h-0 !flex !flex-col"
          classNames={{ container: '!flex-1 !min-h-0 !flex !flex-col' }}
        >
          <div className="!flex !flex-col !px-3 !py-2 !border-b !border-gray-200 !flex-shrink-0">
            <div className="!flex !items-center !gap-4">
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[11px] !font-semibold !text-[#333] !uppercase !w-16">Rol Adı</label>
                <Input
                  size="small"
                  value={form.ad}
                  onChange={(e) => set('ad', e.target.value)}
                  className="!w-56 !text-[11px]"
                />
              </div>
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[11px] !font-semibold !text-[#333] !uppercase">Açıklama</label>
                <Input
                  size="small"
                  value={form.aciklama}
                  onChange={(e) => set('aciklama', e.target.value)}
                  className="!w-72 !text-[11px]"
                />
              </div>
              <div className="!flex !items-center !gap-1.5">
                <Switch checked={form.aktif} onChange={(checked) => set('aktif', checked)} />
                <span className="!text-[11px]">Aktif</span>
              </div>
            </div>
          </div>

          <div className="!overflow-y-auto !overflow-x-hidden !flex-1 !min-h-0 !p-3">
            <div className="!border !border-gray-200 !rounded-sm !p-3 !max-w-[860px]">
              <div className="!flex !items-baseline !gap-3 !mb-2">
                <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide">İzinler</div>
                <div className="!text-[10px] !text-[#9ca3af]">
                  Menü ve grup kutuları toplu seçim içindir; yetki ekran satırlarından yazılır.
                </div>
              </div>
              <div
                className="!grid !items-center"
                style={{ gridTemplateColumns: 'minmax(240px,1fr) repeat(4, 90px)', rowGap: 4 }}
              >
                <div />
                {ISLEMLER.map((islem) => (
                  <div key={islem} className="!text-[10px] !font-semibold !text-[#6b7280] !uppercase">
                    {ISLEM_ADLARI[islem]}
                  </div>
                ))}

                {modules.map((mod) => {
                  const modulIdler = izinIdleri(mod.key, mod.categories.flatMap((c) => c.items))
                  const modulDurum = secimDurumu(modulIdler)
                  const modulAcik = !!acikModuller[mod.key]
                  return (
                    <Fragment key={mod.key}>
                      <div className="!flex !items-center !gap-1.5 !py-1 !border-t !border-gray-100">
                        <button
                          type="button"
                          onClick={() => setAcikModuller((p) => ({ ...p, [mod.key]: !p[mod.key] }))}
                          className="!w-4 !h-4 !flex !items-center !justify-center !text-[10px] !text-[#6b7280] !bg-transparent !border-none !cursor-pointer !p-0"
                        >
                          {modulAcik ? '▾' : '▸'}
                        </button>
                        <Checkbox
                          checked={modulDurum.checked}
                          indeterminate={modulDurum.indeterminate}
                          onChange={(e) => izinleriDegistir(modulIdler, e.target.checked)}
                        />
                        <span className="!text-[11px] !font-bold !text-[#333]">{mod.label}</span>
                        <span className="!text-[10px] !text-[#9ca3af]">
                          ({modulIdler.filter((id) => form.izinIdler.includes(id)).length}/{modulIdler.length})
                        </span>
                      </div>
                      {ISLEMLER.map((islem) => (
                        <div key={islem} />
                      ))}

                      {modulAcik &&
                        mod.categories.map((cat) => {
                          const grupKey = `${mod.key}.${cat.title}`
                          const grupIdler = izinIdleri(mod.key, cat.items)
                          const grupDurum = secimDurumu(grupIdler)
                          const grupAcik = !!acikGruplar[grupKey]
                          return (
                            <Fragment key={grupKey}>
                              <div
                                className="!flex !items-center !gap-1.5 !py-0.5"
                                style={{ paddingLeft: 18 }}
                              >
                                <button
                                  type="button"
                                  onClick={() => setAcikGruplar((p) => ({ ...p, [grupKey]: !p[grupKey] }))}
                                  className="!w-4 !h-4 !flex !items-center !justify-center !text-[9px] !text-[#9ca3af] !bg-transparent !border-none !cursor-pointer !p-0"
                                >
                                  {grupAcik ? '▾' : '▸'}
                                </button>
                                <Checkbox
                                  checked={grupDurum.checked}
                                  indeterminate={grupDurum.indeterminate}
                                  onChange={(e) => izinleriDegistir(grupIdler, e.target.checked)}
                                />
                                <span className="!text-[10px] !font-semibold !text-[#6b7280] !uppercase !tracking-wide">
                                  {cat.title}
                                </span>
                              </div>
                              {ISLEMLER.map((islem) => (
                                <div key={islem} />
                              ))}

                              {grupAcik &&
                                cat.items.map((item) => (
                                  <Fragment key={item.key}>
                                    <div
                                      className="!flex !items-center !py-0.5"
                                      style={{ paddingLeft: 46 }}
                                    >
                                      <span className="!text-[11px] !text-[#374151]">{item.label}</span>
                                    </div>
                                    {ISLEMLER.map((islem) => {
                                      const izin = izinByKod.get(ekranIzinKodu(mod.key, item.key, islem))
                                      return (
                                        <div key={islem} className="!flex !justify-center">
                                          {izin ? (
                                            <Checkbox
                                              checked={form.izinIdler.includes(izin.id)}
                                              onChange={(e) => izinleriDegistir([izin.id], e.target.checked)}
                                            />
                                          ) : (
                                            <span className="!text-[10px] !text-[#d1d5db]" title="İzin tanımı yok">
                                              —
                                            </span>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </Fragment>
                                ))}
                            </Fragment>
                          )
                        })}
                    </Fragment>
                  )
                })}
              </div>
              <div className="!mt-3 !text-[10px] !text-[#9ca3af]">
                Seçilen ekran izni: {seciliEkranIzni} / {ekranIzinIdSet.size}
                {ekranIzinIdSet.size === 0 && (
                  <span className="!text-[#dc2626]"> — ekran izinleri tanımlı değil (seed çalıştırılmalı)</span>
                )}
              </div>
            </div>
          </div>
        </Spin>
      </div>
    </div>
  )
}
