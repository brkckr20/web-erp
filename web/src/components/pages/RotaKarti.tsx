'use client'

import { useState, useEffect } from 'react'
import { Input, InputNumber, Switch, App, Tabs, Table, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import SearchableIslemSelect from '@/components/shared/SearchableIslemSelect'
import { rotaApi, type Rota, type RotaOperasyon } from '@/lib/rota-api'

interface RotaKartiProps {
  isNew?: boolean
  kod?: string
}

const emptyRota: Omit<Rota, 'id'> = {
  kod: '',
  ad: '',
  ozelKod: '',
  hizmetKodu: '',
  kullanimda: true,
  operasyonlar: [],
}

export default function RotaKarti({ isNew, kod }: RotaKartiProps) {
  const { message, modal } = App.useApp()
  const [id, setId] = useState<number | null>(null)
  const [form, setForm] = useState<Omit<Rota, 'id'>>(emptyRota)

  const set = <K extends keyof Omit<Rota, 'id'>>(key: K, value: Omit<Rota, 'id'>[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const loadByKod = async (k: string) => {
    const rec = await rotaApi.getByKod(k)
    if (!rec) {
      message.warning('Rota bulunamadı')
      return
    }
    setId(rec.id)
    setForm({ kod: rec.kod, ad: rec.ad, ozelKod: rec.ozelKod ?? '', hizmetKodu: rec.hizmetKodu ?? '', kullanimda: rec.kullanimda, operasyonlar: rec.operasyonlar })
  }

  useEffect(() => {
    if (!isNew && kod) loadByKod(kod)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, kod])

  const handleYeni = () => {
    setId(null)
    setForm(emptyRota)
  }

  const handleKaydet = async () => {
    if (!form.kod.trim()) { message.warning('Kod alanı zorunludur'); return }
    if (!form.ad.trim()) { message.warning('Ad alanı zorunludur'); return }
    try {
      const payload = {
        ...form,
        ozelKod: form.ozelKod?.trim() ? form.ozelKod.trim() : null,
        hizmetKodu: form.hizmetKodu?.trim() ? form.hizmetKodu.trim() : null,
      }
      if (id) {
        await rotaApi.update(id, payload)
        message.success('Rota başarıyla güncellendi')
      } else {
        const created = await rotaApi.create(payload)
        setId(created.id)
        setForm((prev) => ({ ...prev, kod: created.kod }))
        message.success('Rota başarıyla oluşturuldu')
      }
    } catch (e: any) {
      message.error(e?.message || 'Kayıt sırasında hata oluştu')
    }
  }

  const step = async (dir: -1 | 1) => {
    try {
      const list = await rotaApi.list()
      const idx = list.findIndex((d) => d.kod === form.kod)
      const next = list[idx + dir]
      if (!next) { message.info(dir < 0 ? 'İlk kayıttasınız' : 'Son kayıttasınız'); return }
      await loadByKod(next.kod)
    } catch { message.warning('Kayıt yüklenemedi') }
  }

  const handleSil = () => {
    if (!id) return
    modal.confirm({
      title: 'Rota Sil',
      content: 'Bu rotayı silmek istediğinize emin misiniz?',
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await rotaApi.remove(id)
          message.success('Rota silindi')
          handleYeni()
        } catch { message.error('Silme sırasında hata oluştu') }
      },
    })
  }

  const toolbarButtons = createToolbarButtons({
    onNew: handleYeni,
    onSave: handleKaydet,
    onPrevious: () => step(-1),
    onNext: () => step(1),
    onDelete: handleSil,
  })

  const operasyonEkle = () => {
    const sira = form.operasyonlar.length > 0
      ? Math.max(...form.operasyonlar.map((o) => o.sira)) + 1
      : 1
    set('operasyonlar', [
      ...form.operasyonlar,
      { id: 0, sira, operasyonKodu: '', operasyonAdi: '', varsayilanYer: 'İç Üretim', birim: 'ADET', birimFiyat: null },
    ])
  }

  const operasyonSil = (rowId: number, sira: number) => {
    set(
      'operasyonlar',
      form.operasyonlar.filter((o) => (o.id || `s${o.sira}`) !== (rowId || `s${sira}`)),
    )
  }

  const operasyonGuncelle = (rowId: number, sira: number, patch: Partial<RotaOperasyon>) => {
    set(
      'operasyonlar',
      form.operasyonlar.map((o) =>
        (o.id || `s${o.sira}`) === (rowId || `s${sira}`) ? { ...o, ...patch } : o,
      ),
    )
  }

  const operasyonColumns: ColumnsType<RotaOperasyon> = [
    { title: 'Sıra', dataIndex: 'sira', width: 60, render: (v: number) => v },
    {
      title: 'Operasyon Kodu', dataIndex: 'operasyonKodu', width: 170,
      render: (v: string, r: RotaOperasyon) => (
        <SearchableIslemSelect
          value={v || null}
          placeholder="İşlem seç..."
          onChange={(kod, rec) => operasyonGuncelle(r.id, r.sira, {
            operasyonKodu: kod ?? '',
            operasyonAdi: rec?.ad ?? '',
            birim: rec?.birim ?? r.birim,
          })}
        />
      ),
    },
    {
      title: 'Operasyon Adı', dataIndex: 'operasyonAdi', minWidth: 160,
      render: (v: string) => v || <span className="!text-gray-300">—</span>,
    },
    {
      title: 'Varsayılan Yer', dataIndex: 'varsayilanYer', width: 160,
      render: (v: string, r: RotaOperasyon) => (
        <Input size="small" value={v} onChange={(e) => operasyonGuncelle(r.id, r.sira, { varsayilanYer: e.target.value })} className="!text-[11px]" />
      ),
    },
    { title: 'Birim', dataIndex: 'birim', width: 80 },
    {
      title: 'Birim Fiyat', dataIndex: 'birimFiyat', width: 120, align: 'right',
      render: (v: number | null, r: RotaOperasyon) => (
        <InputNumber
          size="small"
          min={0}
          precision={2}
          value={v ?? undefined}
          placeholder="-"
          onChange={(val) => operasyonGuncelle(r.id, r.sira, { birimFiyat: val })}
          className="!w-full !text-[11px]"
        />
      ),
    },
    {
      title: '', width: 40, align: 'center',
      render: (_: unknown, r: RotaOperasyon) => (
        <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => operasyonSil(r.id, r.sira)} />
      ),
    },
  ]

  return (
    <div className="!h-full !flex !flex-col">
      <div className="!bg-white !border !border-gray-200 !rounded-sm !flex-1 !flex !flex-col !overflow-hidden">
        <CardToolbar buttons={toolbarButtons} />
        <div className="!flex !flex-col !px-3 !py-2 !border-b !border-gray-200 !flex-shrink-0">
          <div className="!flex !items-center !gap-4 !flex-wrap">
            <div className="!flex !items-center !gap-1.5">
              <label className="!text-[11px] !font-semibold !text-[#333] !uppercase !w-12">Kodu</label>
              <Input
                size="small"
                value={form.kod}
                onChange={(e) => set('kod', e.target.value)}
                disabled={id !== null}
                className="!w-32 !text-[11px]"
              />
            </div>
            <div className="!flex !items-center !gap-1.5">
              <label className="!text-[11px] !font-semibold !text-[#333] !uppercase">Adı</label>
              <Input size="small" value={form.ad} onChange={(e) => set('ad', e.target.value)} className="!w-[200px] !text-[11px]" />
            </div>
            <div className="!flex !items-center !gap-1.5">
              <label className="!text-[11px] !font-semibold !text-[#333] !uppercase">Özel Kod</label>
              <Input size="small" value={form.ozelKod ?? ''} onChange={(e) => set('ozelKod', e.target.value)} className="!w-32 !text-[11px]" />
            </div>
            <div className="!flex !items-center !gap-1.5">
              <label className="!text-[11px] !font-semibold !text-[#333] !uppercase">Hizmet Kodu</label>
              <Input size="small" value={form.hizmetKodu ?? ''} onChange={(e) => set('hizmetKodu', e.target.value)} className="!w-32 !text-[11px]" />
            </div>
            <Switch checked={form.kullanimda} onChange={(v) => set('kullanimda', v)} />
            <span className="!text-[11px]">Kullanımda</span>
          </div>
        </div>

        <div className="!flex-1 !min-h-0 !px-3 !py-2">
          <Tabs
            size="small"
            items={[
              {
                key: 'operasyonlar',
                label: `Operasyonlar (${form.operasyonlar.length})`,
                children: (
                  <div className="!flex !flex-col !gap-2 !h-full">
                    <div>
                      <Button size="small" icon={<PlusOutlined />} onClick={operasyonEkle} className="!text-[11px]">
                        Satır Ekle
                      </Button>
                    </div>
                    <Table<RotaOperasyon>
                      size="small"
                      columns={operasyonColumns}
                      dataSource={form.operasyonlar}
                      rowKey={(r) => String(r.id || `s${r.sira}`)}
                      pagination={false}
                      locale={{ emptyText: 'Henüz operasyon eklenmedi' }}
                    />
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
