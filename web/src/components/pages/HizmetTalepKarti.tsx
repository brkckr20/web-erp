'use client'

import { useState, useEffect, useMemo } from 'react'
import { Input, Select, Button, Tag, DatePicker, Upload, App } from 'antd'
import { SaveOutlined, DeleteOutlined, PlusOutlined, PaperClipOutlined, SendOutlined } from '@ant-design/icons'
import type { ColDef } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import dayjs from 'dayjs'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import SearchableKullaniciSelect from '@/components/shared/SearchableKullaniciSelect'
import { hizmetTalepApi, type HizmetTalep, type HizmetTalepNot } from '@/lib/hizmet-talep-api'

const durumOptions = [
  { value: 'Açık', label: 'Açık' },
  { value: 'Devam Ediyor', label: 'Devam Ediyor' },
  { value: 'İncelenecek', label: 'İncelenecek' },
  { value: 'Tamamlandı', label: 'Tamamlandı' },
  { value: 'İptal', label: 'İptal' },
]

const oncelikOptions = [
  { value: 'Acil', label: 'Acil' },
  { value: 'Normal', label: 'Normal' },
  { value: 'Düşük', label: 'Düşük' },
]

const formatTarih = (d: string | null) => {
  if (!d) return '-'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '-'
  return dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const durumRenk: Record<string, string> = {
  'Açık': 'blue',
  'Devam Ediyor': 'orange',
  'Tamamlandı': 'green',
  'İptal': 'red',
}

interface Props {
  id?: number
  onClose: () => void
  onKaydet?: (yeniId: number) => void
}

export default function HizmetTalepKarti({ id, onClose, onKaydet }: Props) {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(Boolean(id))
  const [talep, setTalep] = useState<HizmetTalep | null>(null)

  const [baslik, setBaslik] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [durum, setDurum] = useState('Açık')
  const [oncelik, setOncelik] = useState('Normal')
  const [tarih, setTarih] = useState<dayjs.Dayjs>(dayjs())
  const [kapanisTarihi, setKapanisTarihi] = useState<dayjs.Dayjs>(dayjs('1900-01-01'))
  const [kullanici, setKullanici] = useState('')
  const [gorusmeKisi, setGorusmeKisi] = useState('')

  const [notIcerik, setNotIcerik] = useState('')
  const [notTarih, setNotTarih] = useState<dayjs.Dayjs | null>(dayjs())
  const [notKisi, setNotKisi] = useState('')

  useEffect(() => {
    if (id) {
      setLoading(true)
      hizmetTalepApi
        .get(id)
        .then((t) => {
          setTalep(t)
          setBaslik(t.baslik)
          setAciklama(t.aciklama ?? '')
          setDurum(t.durum)
          setOncelik(t.oncelik)
          setTarih(t.tarih ? dayjs(t.tarih) : dayjs())
          setKapanisTarihi(t.kapanisTarihi ? dayjs(t.kapanisTarihi) : dayjs('1900-01-01'))
          setKullanici(t.kullanici ?? '')
          setGorusmeKisi(t.gorusmeKisi ?? '')
        })
        .catch(() => message.error('Talep yüklenemedi'))
        .finally(() => setLoading(false))
    }
  }, [id])

  const handleKaydet = async () => {
    if (!baslik.trim()) {
      message.warning('Başlık boş olamaz')
      return
    }
    try {
      if (id) {
        await hizmetTalepApi.update(id, { baslik, aciklama, durum, oncelik, tarih: tarih.format('YYYY-MM-DD'), kapanisTarihi: kapanisTarihi.format('YYYY-MM-DD'), kullanici, gorusmeKisi } as any)
        message.success('Talep güncellendi')
      } else {
        const created = await hizmetTalepApi.create({ baslik, aciklama, durum, oncelik, tarih: tarih.format('YYYY-MM-DD'), kapanisTarihi: kapanisTarihi.format('YYYY-MM-DD'), kullanici, gorusmeKisi } as any)
        message.success('Talep oluşturuldu')
        onKaydet?.(created.id)
      }
    } catch {
      message.error('Kaydetme hatası')
    }
  }

  const handleSil = async () => {
    if (!id) return
    try {
      await hizmetTalepApi.remove(id)
      message.success('Talep silindi')
      onClose()
    } catch {
      message.error('Silme hatası')
    }
  }

  const handleNotEkle = async () => {
    if (!id || !notIcerik.trim()) return
    try {
      await hizmetTalepApi.addNot({
        hizmetTalepId: id,
        icerik: notIcerik,
        gorusmeTarihi: notTarih?.toISOString(),
        iletisimKisi: notKisi || undefined,
      })
      setNotIcerik('')
      setNotKisi('')
      setNotTarih(dayjs())
      const t = await hizmetTalepApi.get(id)
      setTalep(t)
      message.success('Not eklendi')
    } catch {
      message.error('Not eklenemedi')
    }
  }

  const handleNotSil = async (notId: number) => {
    if (!id) return
    try {
      await hizmetTalepApi.removeNot(notId)
      const t = await hizmetTalepApi.get(id)
      setTalep(t)
      message.success('Not silindi')
    } catch {
      message.error('Not silinemedi')
    }
  }

  const notColumns = useMemo<ColDef<HizmetTalepNot & { key: number }>[]>(
    () => [
      { headerName: 'Tarih', field: 'gorusmeTarihi', width: 110, valueGetter: (p) => formatTarih(p.data?.gorusmeTarihi) },
      { headerName: 'Kişi', field: 'iletisimKisi', width: 130, valueGetter: (p) => p.data?.iletisimKisi ?? '-' },
      { headerName: 'İçerik', field: 'icerik', flex: 1, minWidth: 200 },
      {
        headerName: '',
        width: 40,
        cellRenderer: (p: any) => (
          <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => handleNotSil(p.data.id)} />
        ),
      },
    ],
    [talep],
  )

  const toolbarButtons = createToolbarButtons({
    onSave: handleKaydet,
    onDelete: id ? handleSil : undefined,
    saveDisabled: loading,
    deleteDisabled: loading,
  })

  return (
    <div className="!flex !flex-col !h-full">
      <CardToolbar
        title={id ? `Hizmet Talep #${id}` : 'Yeni Hizmet Talep'}
        buttons={[
          ...toolbarButtons,
          { key: 'back', label: 'Geri', icon: <DeleteOutlined />, onClick: onClose },
        ]}
      />

      <div className="!flex-1 !overflow-auto !p-3 !space-y-3">
        <div className="!border !border-gray-200 !rounded-sm !p-3">
          <div className="!text-[12px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-2">Talep Bilgileri</div>
          <div className="!flex !gap-3">
            <div className="!space-y-1.5 !w-72 !shrink-0">
              <div className="!flex !items-center !gap-3">
                <div className="!text-[11px] !text-[#333] !w-20 !shrink-0">Tarih</div>
                <DatePicker size="small" value={tarih} onChange={(d) => d && setTarih(d)} format="DD.MM.YYYY" className="!w-full !text-[11px]" />
              </div>
              <div className="!flex !items-center !gap-3">
                <div className="!text-[11px] !text-[red] !w-20 !shrink-0">Başlık</div>
                <Input size="small" value={baslik} onChange={(e) => setBaslik(e.target.value)} className="!w-full !text-[11px]" />
              </div>
              <div className="!flex !items-center !gap-3">
                <div className="!text-[11px] !text-[#333] !w-20 !shrink-0">Kullanıcı</div>
                <SearchableKullaniciSelect value={kullanici} onChange={(kod) => setKullanici(kod)} className="!flex-1" widthClass="!w-full" />
              </div>
              <div className="!flex !items-center !gap-3">
                <div className="!text-[11px] !text-[#333] !w-20 !shrink-0">Durum</div>
                <Select size="small" value={durum} onChange={setDurum} options={durumOptions} className="!w-full !text-[11px]" />
              </div>
              <div className="!flex !items-center !gap-3">
                <div className="!text-[11px] !text-[#333] !w-20 !shrink-0">Öncelik</div>
                <Select size="small" value={oncelik} onChange={setOncelik} options={oncelikOptions} className="!w-full !text-[11px]" />
              </div>
              <div className="!flex !items-center !gap-3">
                <div className="!text-[11px] !text-[#333] !w-20 !shrink-0">Kapanış Tarihi</div>
                <DatePicker size="small" value={kapanisTarihi} onChange={(d) => d && setKapanisTarihi(d)} format="DD.MM.YYYY" placeholder="Kapanmadı (01.01.1900)" className="!w-full !text-[11px]" />
              </div>
              <div className="!flex !items-center !gap-3">
                <div className="!text-[11px] !text-[#333] !w-20 !shrink-0">İletişim Kişisi</div>
                <Input size="small" value={gorusmeKisi} onChange={(e) => setGorusmeKisi(e.target.value)} className="!w-full !text-[11px]" />
              </div>
            </div>
            <div className="!flex-1 !flex !flex-col">
              <div className="!text-[11px] !text-[#333] !mb-0.5">Açıklama</div>
              <Input.TextArea size="small" rows={6} value={aciklama} onChange={(e) => setAciklama(e.target.value)} className="!text-[11px] !flex-1" />
            </div>
          </div>
        </div>

        <div className="!border !border-gray-200 !rounded-sm !p-3">
          <div className="!text-[12px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-2">Notlar</div>
          <div className="!flex !gap-3">
            <div className="!w-72 !shrink-0 !space-y-1.5">
              <div className="!flex !items-center !gap-3">
                <div className="!text-[11px] !text-[#333] !w-20 !shrink-0">Tarih</div>
                <DatePicker
                  size="small"
                  value={notTarih}
                  onChange={(d) => setNotTarih(d)}
                  format="DD.MM.YYYY"
                  placeholder="Görüşme tarihi"
                  className="!w-full !text-[11px]"
                />
              </div>
              <div className="!flex !items-center !gap-3">
                <div className="!text-[11px] !text-[#333] !w-20 !shrink-0">Kişi</div>
                <Input
                  size="small"
                  value={notKisi}
                  onChange={(e) => setNotKisi(e.target.value)}
                  placeholder="İletişim kişisi"
                  className="!w-full !text-[11px]"
                />
              </div>
              <div className="!flex !flex-col !gap-1">
                <div className="!text-[11px] !text-[#333]">Not İçeriği</div>
                <Input.TextArea
                  size="small"
                  rows={3}
                  value={notIcerik}
                  onChange={(e) => setNotIcerik(e.target.value)}
                  placeholder="Not içeriği..."
                  className="!text-[11px]"
                />
              </div>
              <Button size="small" type="primary" icon={<SendOutlined />} onClick={handleNotEkle} disabled={!notIcerik.trim()} className="!w-full">
                Not Ekle
              </Button>
            </div>
            <div className="!flex-1 !min-h-0">
              <DataGrid
                columnDefs={notColumns}
                rowData={(talep?.notlar ?? []).map((n) => ({ ...n, key: n.id }))}
                storageKey="hizmetTalepNotlar"
                getRowId={(p: any) => p.data.id}
              />
            </div>
          </div>
        </div>

        <div className="!border !border-gray-200 !rounded-sm !p-3">
          <div className="!text-[12px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-2">
            <PaperClipOutlined className="!mr-1" /> Dosyalar
          </div>
          <div className="!space-y-1">
            {(talep?.dosyalar ?? []).length === 0 && (
              <div className="!text-[11px] !text-gray-400">Henüz dosya eklenmemiş</div>
            )}
            {(talep?.dosyalar ?? []).map((d) => (
              <div key={d.id} className="!flex !items-center !justify-between !text-[11px] !bg-gray-50 !rounded-sm !px-2 !py-1">
                <span>{d.dosyaAdi}</span>
                <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={async () => {
                  if (!id) return
                  await hizmetTalepApi.removeDosya(d.id)
                  const t = await hizmetTalepApi.get(id)
                  setTalep(t)
                }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
