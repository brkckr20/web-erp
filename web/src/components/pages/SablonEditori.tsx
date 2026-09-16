'use client'

import { useEffect, useState } from 'react'
import { Card, Button, Input, Select, Space, Radio, Slider, Divider, Spin, App } from 'antd'
import { SaveOutlined, ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { sablonApi, type Sablon } from '@/lib/sablon-api'

interface Props {
  geriDon: () => void
  sablonId?: number
}

interface Sorgu {
  adi: string
  sql: string
}

const EKRAN_ADLARI = [
  { value: 'kumas-kartlari', label: 'Kumaş Kartları' },
  { value: 'iplik-kartlari', label: 'İplik Kartları' },
  { value: 'aksesuar-kartlari', label: 'Aksesuar Kartları' },
  { value: 'malzeme-kartlari', label: 'Malzeme Kartları' },
  { value: 'depo-tanimlari', label: 'Depo Tanımları' },
  { value: 'makina-kartlari', label: 'Makina Kartları' },
  { value: 'kalite-kontrol-giris', label: 'Kalite Kontrol Girişleri' },
  { value: 'stok-hareket-fisleri', label: 'Malzeme Yönetim Fişleri' },
  { value: 'stok-ozeti', label: 'Stok Özeti' },
  { value: 'hareket-gecmisi', label: 'Hareket Geçmişi' },
  { value: 'depo-bazli-stok', label: 'Depo Bazlı Stok' },
  { value: 'fire-raporu', label: 'Fire Raporu' },
  { value: 'stok-deger', label: 'Stok Değer Raporu' },
  { value: 'kritik-stok', label: 'Kritik Stok Raporu' },
  { value: 'tedarikci-analiz', label: 'Tedarikçi Analizi' },
  { value: 'model-kartlari', label: 'Model Kartları' },
  { value: 'renk-kartlari', label: 'Renk Kartları' },
  { value: 'marka-kartlari', label: 'Marka Kartları' },
  { value: 'grup-kartlari', label: 'Grup Kartları' },
  { value: 'beden-tanimlari', label: 'Beden Tanımları' },
  { value: 'islem-kartlari', label: 'İşlem Kartları' },
  { value: 'kesim-emri', label: 'Kesim Kartı' },
  { value: 'iade-talepleri', label: 'İade Talepleri' },
  { value: 'siparis-girisi', label: 'Sipariş Girişi' },
  { value: 'fason-hareket', label: 'Fason Hareket Fişleri' },
  { value: 'uretim-hareket', label: 'Üretim Hareket Fişleri' },
  { value: 'kumas-tedarik', label: 'Kumaş Tedarik' },
  { value: 'iplik-tedarik', label: 'İplik Tedarik' },
  { value: 'aksesuar-tedarik', label: 'Aksesuar Tedarik' },
  { value: 'kumas-planlama', label: 'Kumaş Planlama' },
  { value: 'siparis-durum', label: 'Sipariş Durum Raporu' },
  { value: 'uretim-takip', label: 'Üretim Takip Raporu' },
  { value: 'is-emri', label: 'İş Emirleri' },
  { value: 'kk-formu', label: 'Kalite Kontrol Formu' },
  { value: 'fire-takip', label: 'Fire Takibi' },
  { value: 'satinalma-siparis', label: 'Satın Alma Siparişi' },
  { value: 'teslimat-takip', label: 'Teslimat Takibi' },
  { value: 'satinalma-kumas-irsaliyeleri', label: 'Satın Alma Kumaş İrsaliyeleri' },
  { value: 'satinalma-iplik-irsaliyeleri', label: 'Satın Alma İplik İrsaliyeleri' },
  { value: 'satinalma-aksesuar-irsaliyeleri', label: 'Satın Alma Aksesuar İrsaliyeleri' },
  { value: 'satinalma-irsaliyeleri', label: 'Satın Alma İrsaliyeleri' },
  { value: 'cari-hesap-karti', label: 'Cari Hesap Kartı' },
  { value: 'kumas-irsaliyeleri', label: 'Satış Kumaş İrsaliyeleri' },
  { value: 'iplik-irsaliyeleri', label: 'Satış İplik İrsaliyeleri' },
  { value: 'aksesuar-irsaliyeleri', label: 'Satış Aksesuar İrsaliyeleri' },
  { value: 'satis-irsaliyeleri', label: 'Satış İrsaliyeleri' },
  { value: 'musteri-siparis', label: 'Müşteri Siparişi' },
  { value: 'sevkiyat', label: 'Sevkiyat Planlama' },
  { value: 'irsaliye', label: 'İrsaliye' },
  { value: 'fatura', label: 'Fatura' },
  { value: 'odeme-takip', label: 'Ödeme Takibi' },
  { value: 'banka-islem', label: 'Banka İşlemleri' },
  { value: 'maliyet-analiz', label: 'Maliyet Analizi' },
  { value: 'kullanici-tanimlari', label: 'Kullanıcı Tanımları' },
  { value: 'genel-ayarlar', label: 'Genel Ayarlar' },
  { value: 'logo-yonetimi', label: 'Logo Yönetimi' },
  { value: 'rapor-tasarimi', label: 'Rapor Tasarımı' },
  { value: 'veritabani-yedek', label: 'Veritabanı Yedek' },
]

const ORNEK_SORGU = `SELECT
  s.siparis_no,
  s.musteri_adi,
  s.tutar,
  s.tarih
FROM siparis s
WHERE s.id = @id`

const ORNEK_HTML = `<div style="font-family: Arial, sans-serif; font-size: 12px;">
  <h2 style="text-align: center; margin-bottom: 20px;">Siparis Formu</h2>
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 4px 8px; font-weight: bold; width: 120px;">Siparis No:</td>
      <td style="padding: 4px 8px;">{{siparis.siparis_no}}</td>
    </tr>
    <tr>
      <td style="padding: 4px 8px; font-weight: bold;">Musteri:</td>
      <td style="padding: 4px 8px;">{{siparis.musteri_adi}}</td>
    </tr>
    <tr>
      <td style="padding: 4px 8px; font-weight: bold;">Tutar:</td>
      <td style="padding: 4px 8px;">{{siparis.tutar}}</td>
    </tr>
    <tr>
      <td style="padding: 4px 8px; font-weight: bold;">Tarih:</td>
      <td style="padding: 4px 8px;">{{siparis.tarih}}</td>
    </tr>
  </table>
</div>`

export default function SablonEditori({ geriDon, sablonId }: Props) {
  const { message } = App.useApp()
  const [ad, setAd] = useState('')
  const [ekranAdi, setEkranAdi] = useState('')
  const [htmlKod, setHtmlKod] = useState(ORNEK_HTML)
  const [sayfaEn, setSayfaEn] = useState(210)
  const [sayfaBoy, setSayfaBoy] = useState(297)
  const [yon, setYon] = useState('dikey')
  const [ustBosluk, setUstBosluk] = useState(10)
  const [altBosluk, setAltBosluk] = useState(10)
  const [solBosluk, setSolBosluk] = useState(15)
  const [sagBosluk, setSagBosluk] = useState(15)
  const [sorgular, setSorgular] = useState<Sorgu[]>([
    { adi: 'siparis', sql: ORNEK_SORGU },
  ])
  const [zoom, setZoom] = useState(80)
  const [kaydetiyor, setKaydetiyor] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(false)
  // Kaydet sonrası sekme açık kalır: ilk kayıtta dönen id saklanır, sonraki kaydetmeler günceller
  const [kayitId, setKayitId] = useState<number | undefined>(sablonId)

  useEffect(() => {
    if (sablonId) {
      sablonYukle(sablonId)
    }
  }, [sablonId])

  const sablonYukle = async (id: number) => {
    setYukleniyor(true)
    try {
      const data = await sablonApi.get(id)
      setAd(data.ad)
      setEkranAdi(data.ekranAdi)
      setHtmlKod(data.htmlIcerik)
      setSayfaEn(data.sayfaEn)
      setSayfaBoy(data.sayfaBoy)
      setYon(data.yon)
      setUstBosluk(data.ustBosluk)
      setAltBosluk(data.altBosluk)
      setSolBosluk(data.solBosluk)
      setSagBosluk(data.sagBosluk)
      setSorgular(data.sorgular.map((s) => ({ adi: s.ad, sql: s.sqlIcerik })))
    } catch {
      message.error('Şablon yüklenemedi')
    } finally {
      setYukleniyor(false)
    }
  }

  const handleKaydet = async () => {
    if (!ad.trim()) {
      message.warning('Rapor adı gerekli')
      return
    }
    if (!ekranAdi.trim()) {
      message.warning('Ekran adı gerekli')
      return
    }
    setKaydetiyor(true)
    try {
      const data = {
        ad,
        ekranAdi,
        htmlIcerik: htmlKod,
        sayfaEn,
        sayfaBoy,
        yon,
        ustBosluk,
        altBosluk,
        solBosluk,
        sagBosluk,
        sorgular: sorgular.map((s, i) => ({ ad: s.adi, sqlIcerik: s.sql, sira: i })),
      }
      if (kayitId) {
        await sablonApi.update(kayitId, data)
      } else {
        const olusan = await sablonApi.create(data)
        setKayitId(olusan.id)
      }
      message.success('Şablon kaydedildi')
    } catch {
      message.error('Kaydedilemedi')
    } finally {
      setKaydetiyor(false)
    }
  }

  const sorguEkle = () => {
    setSorgular((prev) => [...prev, { adi: '', sql: '' }])
  }

  const sorguSil = (idx: number) => {
    setSorgular((prev) => prev.filter((_, i) => i !== idx))
  }

  const sorguGuncelle = (idx: number, alan: 'adi' | 'sql', deger: string) => {
    setSorgular((prev) => prev.map((s, i) => (i === idx ? { ...s, [alan]: deger } : s)))
  }

  const MM_TO_PX = 3.7795
  const en = yon === 'yatay' ? sayfaBoy : sayfaEn
  const boy = yon === 'yatay' ? sayfaEn : sayfaBoy
  const pxGenislik = en * MM_TO_PX
  const pxYukseklik = boy * MM_TO_PX
  const olcek = zoom / 100

  if (yukleniyor) {
    return <div className="!flex !items-center !justify-center !h-full"><Spin /></div>
  }

  return (
    <div className="!p-3 !h-full !flex !flex-col !gap-3">
      <div className="!flex !items-center !justify-between">
        <div className="!flex !items-center !gap-2">
          <Button size="small" icon={<ArrowLeftOutlined />} onClick={geriDon} />
          <span className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
            {sablonId ? 'Şablon Düzenle' : 'Yeni Rapor Oluştur'}
          </span>
        </div>
        <Button type="primary" size="small" icon={<SaveOutlined />} onClick={handleKaydet} loading={kaydetiyor}>
          Kaydet
        </Button>
      </div>

      <div className="!flex !gap-3 !flex-1 !min-h-0">
        {/* Sol Panel */}
        <div className="!w-[280px] !flex !flex-col !gap-3 !shrink-0 !overflow-y-auto">
          <Card size="small" title="Genel Bilgiler">
            <Space orientation="vertical" className="!w-full" size="small">
              <div>
                <div className="!text-[10px] !text-[#6b7280] !mb-1">Rapor Adı</div>
                <Input size="small" value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Örn: Satış İrsaliyesi Çıktısı" />
              </div>
              <div>
                <div className="!text-[10px] !text-[#6b7280] !mb-1">Ekran Adı</div>
                <Select
                  size="small"
                  className="!w-full"
                  value={ekranAdi || undefined}
                  onChange={setEkranAdi}
                  showSearch
                  placeholder="Ekran seçin veya arayın"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={EKRAN_ADLARI}
                />
              </div>
            </Space>
          </Card>

          <Card size="small" title="Sayfa Ayarları">
            <Space orientation="vertical" className="!w-full" size="small">
              <div>
                <div className="!text-[10px] !text-[#6b7280] !mb-1">Kağıt Boyutu</div>
                <Select
                  size="small"
                  className="!w-full"
                  value={sayfaEn === 210 && sayfaBoy === 297 ? 'A4' : sayfaEn === 148 && sayfaBoy === 210 ? 'A5' : sayfaEn === 105 && sayfaBoy === 148 ? 'A6' : 'ozel'}
                  onChange={(val) => {
                    if (val === 'A4') { setSayfaEn(210); setSayfaBoy(297) }
                    else if (val === 'A5') { setSayfaEn(148); setSayfaBoy(210) }
                    else if (val === 'A6') { setSayfaEn(105); setSayfaBoy(148) }
                  }}
                  options={[
                    { value: 'A4', label: 'A4 (210×297mm)' },
                    { value: 'A5', label: 'A5 (148×210mm)' },
                    { value: 'A6', label: 'A6 (105×148mm)' },
                    { value: 'ozel', label: 'Özel' },
                  ]}
                />
              </div>
              <div className="!flex !gap-2">
                <div className="!flex-1">
                  <div className="!text-[10px] !text-[#6b7280] !mb-1">En (mm)</div>
                  <Input size="small" type="number" value={sayfaEn} onChange={(e) => setSayfaEn(Number(e.target.value))} />
                </div>
                <div className="!flex-1">
                  <div className="!text-[10px] !text-[#6b7280] !mb-1">Boy (mm)</div>
                  <Input size="small" type="number" value={sayfaBoy} onChange={(e) => setSayfaBoy(Number(e.target.value))} />
                </div>
              </div>
              <div>
                <div className="!text-[10px] !text-[#6b7280] !mb-1">Yön</div>
                <Radio.Group size="small" value={yon} onChange={(e) => setYon(e.target.value)}>
                  <Radio.Button value="dikey">Dikey</Radio.Button>
                  <Radio.Button value="yatay">Yatay</Radio.Button>
                </Radio.Group>
              </div>
              <div className="!flex !gap-2">
                <div className="!flex-1">
                  <div className="!text-[10px] !text-[#6b7280] !mb-1">Üst (mm)</div>
                  <Input size="small" type="number" value={ustBosluk} onChange={(e) => setUstBosluk(Number(e.target.value))} />
                </div>
                <div className="!flex-1">
                  <div className="!text-[10px] !text-[#6b7280] !mb-1">Alt (mm)</div>
                  <Input size="small" type="number" value={altBosluk} onChange={(e) => setAltBosluk(Number(e.target.value))} />
                </div>
              </div>
              <div className="!flex !gap-2">
                <div className="!flex-1">
                  <div className="!text-[10px] !text-[#6b7280] !mb-1">Sol (mm)</div>
                  <Input size="small" type="number" value={solBosluk} onChange={(e) => setSolBosluk(Number(e.target.value))} />
                </div>
                <div className="!flex-1">
                  <div className="!text-[10px] !text-[#6b7280] !mb-1">Sağ (mm)</div>
                  <Input size="small" type="number" value={sagBosluk} onChange={(e) => setSagBosluk(Number(e.target.value))} />
                </div>
              </div>
            </Space>
          </Card>

          <Card
            size="small"
            title="Sorgular"
            extra={
              <Button size="small" type="link" icon={<PlusOutlined />} onClick={sorguEkle}>
                Ekle
              </Button>
            }
          >
            <Space orientation="vertical" className="!w-full" size="small">
              {sorgular.map((sorgu, idx) => (
                <div key={idx}>
                  {idx > 0 && <Divider className="!my-2" />}
                  <div className="!flex !items-center !justify-between !mb-1">
                    <div className="!text-[10px] !font-medium !text-[#374151]">Sorgu {idx + 1}</div>
                    {sorgular.length > 1 && (
                      <Button size="small" type="link" danger icon={<DeleteOutlined />} onClick={() => sorguSil(idx)} />
                    )}
                  </div>
                  <Space orientation="vertical" className="!w-full" size="small">
                    <div>
                      <div className="!text-[10px] !text-[#6b7280] !mb-1">Sorgu Adı</div>
                      <Input
                        size="small"
                        value={sorgu.adi}
                        onChange={(e) => sorguGuncelle(idx, 'adi', e.target.value)}
                        placeholder="Örn: siparis"
                      />
                    </div>
                    <div>
                      <div className="!text-[10px] !text-[#6b7280] !mb-1">SQL Sorgusu</div>
                      <Input.TextArea
                        size="small"
                        rows={4}
                        value={sorgu.sql}
                        onChange={(e) => sorguGuncelle(idx, 'sql', e.target.value)}
                        className="!font-mono !text-[11px]"
                      />
                    </div>
                  </Space>
                </div>
              ))}
            </Space>
          </Card>
        </div>

        {/* Sağ Panel */}
        <div className="!flex-1 !flex !gap-3 !min-h-0 !overflow-hidden">
          <div className="!w-1/2 !min-w-[300px] !flex !flex-col !min-h-0">
            <Card size="small" title="HTML Editör" className="!flex-1 !flex !flex-col" styles={{ body: { padding: 0, height: '100%' } }}>
              <div className="!p-2 !h-full">
                <textarea
                  value={htmlKod}
                  onChange={(e) => setHtmlKod(e.target.value)}
                  className="!w-full !h-full !font-mono !text-[11px] !border !rounded !p-2 !resize-none focus:!outline-none"
                  spellCheck={false}
                />
              </div>
            </Card>
          </div>
          <div className="!w-1/2 !min-w-[300px] !flex !flex-col !min-h-0">
            <Card
              size="small"
              className="!flex-1 !flex !flex-col"
              styles={{ body: { padding: 0, height: '100%' } }}
              title={
                <div className="!flex !items-center !gap-3">
                  <span>Canlı Önizleme</span>
                  <div className="!flex !items-center !gap-2 !ml-auto">
                    <span className="!text-[10px] !text-[#6b7280]">Zoom</span>
                    <Slider min={20} max={150} value={zoom} onChange={setZoom} className="!w-32" tooltip={{ formatter: (v) => `${v}%` }} />
                    <span className="!text-[10px] !text-[#6b7280] !w-8">{zoom}%</span>
                  </div>
                </div>
              }
            >
              <div className="!h-full !overflow-auto !bg-gray-100 !p-4">
                <div className="!mx-auto" style={{ width: pxGenislik * olcek, height: pxYukseklik * olcek, overflow: 'hidden' }}>
                  <div className="!text-[10px] !text-[#9ca3af] !mb-1 !text-center">
                    {en}x{boy}mm {yon === 'yatay' ? 'Yatay' : 'Dikey'}
                  </div>
                  <div
                    className="!bg-white !shadow-md"
                    style={{
                      width: pxGenislik,
                      height: pxYukseklik,
                      padding: `${ustBosluk * MM_TO_PX}px ${sagBosluk * MM_TO_PX}px ${altBosluk * MM_TO_PX}px ${solBosluk * MM_TO_PX}px`,
                      boxSizing: 'border-box',
                      transform: `scale(${olcek})`,
                      transformOrigin: 'top left',
                    }}
                  >
                    <div dangerouslySetInnerHTML={{ __html: htmlKod }} />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
