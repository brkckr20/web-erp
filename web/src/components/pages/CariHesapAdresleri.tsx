'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button, Table, Modal, Input, Select, Switch, Tag, Space, App } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { cariHesapApi, type CariHesapAdres, type CariHesapAdresFormData } from '@/lib/cari-hesap-api'

const adresTipiOptions = [
  { value: 'İş Adresi', label: 'İş Adresi' },
  { value: 'Ev Adresi', label: 'Ev Adresi' },
  { value: 'Departman Adresi', label: 'Departman Adresi' },
]

const emptyAdres: CariHesapAdresFormData = {
  tip: 'İş Adresi',
  aciklama: '',
  adres1: '',
  adres2: '',
  ulke: 'Türkiye',
  sehir: '',
  ilce: '',
  mahalle: '',
  ozelKod: '',
  telefon: '',
  fax: '',
  postaKodu: '',
  eposta: '',
  aktif: true,
  varsayilan: false,
}

export default function CariHesapAdresleri({ cariId }: { cariId: number | null }) {
  const { message, modal } = App.useApp()
  const [adresler, setAdresler] = useState<CariHesapAdres[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CariHesapAdres | null>(null)
  const [form, setForm] = useState<CariHesapAdresFormData>(emptyAdres)
  const [saving, setSaving] = useState(false)

  const yukle = useCallback(async () => {
    if (!cariId) {
      setAdresler([])
      return
    }
    setLoading(true)
    try {
      setAdresler(await cariHesapApi.adresList(cariId))
    } catch {
      message.error('Adresler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [cariId])

  useEffect(() => {
    yukle()
  }, [yukle])

  const set = <K extends keyof CariHesapAdresFormData>(key: K, value: CariHesapAdresFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleYeni = () => {
    setEditing(null)
    setForm(emptyAdres)
    setModalOpen(true)
  }

  const handleDuzenle = (kayit: CariHesapAdres) => {
    setEditing(kayit)
    setForm({
      tip: kayit.tip ?? 'İş Adresi',
      aciklama: kayit.aciklama ?? '',
      adres1: kayit.adres1 ?? '',
      adres2: kayit.adres2 ?? '',
      ulke: kayit.ulke ?? '',
      sehir: kayit.sehir ?? '',
      ilce: kayit.ilce ?? '',
      mahalle: kayit.mahalle ?? '',
      ozelKod: kayit.ozelKod ?? '',
      telefon: kayit.telefon ?? '',
      fax: kayit.fax ?? '',
      postaKodu: kayit.postaKodu ?? '',
      eposta: kayit.eposta ?? '',
      aktif: kayit.aktif,
      varsayilan: kayit.varsayilan,
    })
    setModalOpen(true)
  }

  const handleKaydet = async () => {
    if (!cariId) return
    setSaving(true)
    try {
      if (editing) {
        await cariHesapApi.adresGuncelle(editing.id, form)
        message.success('Adres güncellendi')
      } else {
        await cariHesapApi.adresEkle(cariId, form)
        message.success('Adres eklendi')
      }
      setModalOpen(false)
      await yukle()
    } catch {
      message.error('Adres kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  const handleSil = (kayit: CariHesapAdres) => {
    modal.confirm({
      title: 'Adres Sil',
      content: `${kayit.kod} kodlu adresi silmek istediğinize emin misiniz?`,
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await cariHesapApi.adresSil(kayit.id)
          message.success('Adres silindi')
          await yukle()
        } catch {
          message.error('Adres silinemedi')
        }
      },
    })
  }

  const columns = [
    { title: 'Kod', dataIndex: 'kod', key: 'kod', width: 60 },
    { title: 'Tip', dataIndex: 'tip', key: 'tip', width: 130 },
    {
      title: 'Adres',
      key: 'adres',
      render: (_: unknown, r: CariHesapAdres) => [r.adres1, r.ilce, r.sehir].filter(Boolean).join(' / ') || '-',
    },
    { title: 'Telefon', dataIndex: 'telefon', key: 'telefon', width: 120 },
    {
      title: 'Aktif',
      dataIndex: 'aktif',
      key: 'aktif',
      width: 70,
      render: (v: boolean) => (v ? <Tag color="green">Aktif</Tag> : <Tag>Pasif</Tag>),
    },
    {
      title: 'Varsayılan',
      dataIndex: 'varsayilan',
      key: 'varsayilan',
      width: 90,
      render: (v: boolean) => (v ? <Tag color="orange">Varsayılan</Tag> : null),
    },
    {
      title: '',
      key: 'islem',
      width: 80,
      render: (_: unknown, r: CariHesapAdres) => (
        <Space size="small">
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => handleDuzenle(r)} />
          <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => handleSil(r)} />
        </Space>
      ),
    },
  ]

  return (
    <div className="!overflow-y-auto !overflow-x-hidden !h-full">
      <div className="!border !border-gray-200 !rounded-sm !p-3">
        <div className="!flex !items-center !justify-between !mb-3">
          <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide">Adres Bilgileri</div>
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleYeni} disabled={!cariId}>
            Yeni Adres
          </Button>
        </div>
        {!cariId ? (
          <div className="!text-[11px] !text-[#7A7A7A]">Adres eklemek için önce cari kartı kaydedin.</div>
        ) : (
          <Table
            size="small"
            rowKey="id"
            loading={loading}
            dataSource={adresler}
            columns={columns}
            pagination={false}
          />
        )}
      </div>

      <Modal
        title={editing ? `Adres Düzenle (${editing.kod})` : 'Yeni Adres'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleKaydet}
        confirmLoading={saving}
        okText="Kaydet"
        cancelText="İptal"
        width={640}
      >
        <div className="!grid !grid-cols-2 !gap-x-4 !gap-y-2.5 !mt-2">
          <AdresField label="Adres Kodu">
            <Input size="small" value={editing ? editing.kod : 'Otomatik'} disabled className="!text-[11px]" />
          </AdresField>
          <AdresField label="Adres Tipi">
            <Select size="small" value={form.tip ?? undefined} onChange={(v) => set('tip', v)} options={adresTipiOptions} className="!w-full !text-[11px]" />
          </AdresField>
          <div className="!col-span-2">
            <AdresField label="Açıklama">
              <Input size="small" value={form.aciklama ?? ''} onChange={(e) => set('aciklama', e.target.value)} className="!text-[11px]" />
            </AdresField>
          </div>
          <div className="!col-span-2">
            <AdresField label="Adres-1">
              <Input.TextArea rows={2} value={form.adres1 ?? ''} onChange={(e) => set('adres1', e.target.value)} className="!text-[11px]" />
            </AdresField>
          </div>
          <div className="!col-span-2">
            <AdresField label="Adres-2">
              <Input.TextArea rows={2} value={form.adres2 ?? ''} onChange={(e) => set('adres2', e.target.value)} className="!text-[11px]" />
            </AdresField>
          </div>
          <AdresField label="Ülke">
            <Input size="small" value={form.ulke ?? ''} onChange={(e) => set('ulke', e.target.value)} className="!text-[11px]" />
          </AdresField>
          <AdresField label="Şehir">
            <Input size="small" value={form.sehir ?? ''} onChange={(e) => set('sehir', e.target.value)} className="!text-[11px]" />
          </AdresField>
          <AdresField label="İlçe">
            <Input size="small" value={form.ilce ?? ''} onChange={(e) => set('ilce', e.target.value)} className="!text-[11px]" />
          </AdresField>
          <AdresField label="Mahalle">
            <Input size="small" value={form.mahalle ?? ''} onChange={(e) => set('mahalle', e.target.value)} className="!text-[11px]" />
          </AdresField>
          <AdresField label="Özel Kod">
            <Input size="small" value={form.ozelKod ?? ''} onChange={(e) => set('ozelKod', e.target.value)} className="!text-[11px]" />
          </AdresField>
          <AdresField label="Telefon">
            <Input size="small" value={form.telefon ?? ''} onChange={(e) => set('telefon', e.target.value)} className="!text-[11px]" />
          </AdresField>
          <AdresField label="Fax">
            <Input size="small" value={form.fax ?? ''} onChange={(e) => set('fax', e.target.value)} className="!text-[11px]" />
          </AdresField>
          <AdresField label="Posta Kodu">
            <Input size="small" value={form.postaKodu ?? ''} onChange={(e) => set('postaKodu', e.target.value)} className="!text-[11px]" />
          </AdresField>
          <AdresField label="E-Posta Adresi">
            <Input size="small" value={form.eposta ?? ''} onChange={(e) => set('eposta', e.target.value)} className="!text-[11px]" />
          </AdresField>
          <div className="!flex !items-center !gap-6 !pt-1">
            <div className="!flex !items-center !gap-2">
              <span className="!text-[10px] !font-semibold !uppercase !text-[#333]">Aktif</span>
              <Switch size="small" checked={form.aktif} onChange={(v) => set('aktif', v)} />
            </div>
            <div className="!flex !items-center !gap-2">
              <span className="!text-[10px] !font-semibold !uppercase !text-[#333]">Varsayılan</span>
              <Switch size="small" checked={form.varsayilan} onChange={(v) => set('varsayilan', v)} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function AdresField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="!flex !items-center !gap-2">
      <label className="!text-[10px] !font-semibold !uppercase !w-28 !text-right !shrink-0 !text-[#333]">
        {label}
      </label>
      <div className="!flex-1 !min-w-0">{children}</div>
    </div>
  )
}
