'use client'

import { useState } from 'react'
import { Card, Button, Input, Select, Space, Radio, Slider, message, Divider } from 'antd'
import { SaveOutlined, ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'

interface Props {
  geriDon: () => void
}

interface Sorgu {
  adi: string
  sql: string
}

const PDF_BOYUTLARI = ['A4', 'A5', 'A6', 'Özel']
const PDF_YONLERI = [
  { value: 'dikey', label: 'Dikey' },
  { value: 'yatay', label: 'Yatay' },
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

export default function SablonEditori({ geriDon }: Props) {
  const [ad, setAd] = useState('')
  const [ekranAdi, setEkranAdi] = useState('')
  const [tur, setTur] = useState('rapor')
  const [pdfBoyut, setPdfBoyut] = useState('A4')
  const [ozelEn, setOzelEn] = useState(210)
  const [ozelBoy, setOzelBoy] = useState(297)
  const [pdfYon, setPdfYon] = useState('dikey')
  const [bosslukSol, setBosslukSol] = useState(10)
  const [bosslukSag, setBosslukSag] = useState(10)
  const [sorgular, setSorgular] = useState<Sorgu[]>([
    { adi: 'siparis', sql: ORNEK_SORGU },
  ])
  const [htmlKod, setHtmlKod] = useState(ORNEK_HTML)
  const [zoom, setZoom] = useState(80)

  const handleKaydet = () => {
    if (!ad.trim()) {
      message.warning('Rapor adı gerekli')
      return
    }
    if (!ekranAdi.trim()) {
      message.warning('Ekran adı gerekli')
      return
    }
    message.success('Şablon kaydedildi (backend henüz bağlı değil)')
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

  return (
    <div className="!p-3 !h-full !flex !flex-col !gap-3">
      <div className="!flex !items-center !justify-between">
        <div className="!flex !items-center !gap-2">
          <Button size="small" icon={<ArrowLeftOutlined />} onClick={geriDon} />
          <span className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
            Yeni Rapor Oluştur
          </span>
        </div>
        <Button type="primary" size="small" icon={<SaveOutlined />} onClick={handleKaydet}>
          Kaydet
        </Button>
      </div>

      <div className="!flex !gap-3 !flex-1 !min-h-0">
        {/* Sol Panel - Ayarlar */}
        <div className="!w-[280px] !flex !flex-col !gap-3 !shrink-0 !overflow-y-auto">
          <Card size="small" title="Genel Bilgiler">
            <Space orientation="vertical" className="!w-full" size="small">
              <div>
                <div className="!text-[10px] !text-[#6b7280] !mb-1">Rapor Adı</div>
                <Input size="small" value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Örn: Sipariş Formu" />
              </div>
              <div>
                <div className="!text-[10px] !text-[#6b7280] !mb-1">Ekran Adı</div>
                <Input size="small" value={ekranAdi} onChange={(e) => setEkranAdi(e.target.value)} placeholder="Örn: SİP001" />
              </div>
              <div>
                <div className="!text-[10px] !text-[#6b7280] !mb-1">Tür</div>
                <Select size="small" className="!w-full" value={tur} onChange={setTur}
                  options={[
                    { value: 'rapor', label: 'Rapor' },
                    { value: 'irsaliye', label: 'İrsaliye' },
                    { value: 'etiket', label: 'Etiket' },
                  ]}
                />
              </div>
            </Space>
          </Card>

          <Card size="small" title="Sayfa Ayarları">
            <Space orientation="vertical" className="!w-full" size="small">
              <div>
                <div className="!text-[10px] !text-[#6b7280] !mb-1">Kağıt Boyutu</div>
                <Select size="small" className="!w-full" value={pdfBoyut} onChange={setPdfBoyut}
                  options={PDF_BOYUTLARI.map((b) => ({ value: b, label: b }))}
                />
              </div>
              {pdfBoyut === 'Özel' && (
                <Space>
                  <div>
                    <div className="!text-[10px] !text-[#6b7280] !mb-1">En (mm)</div>
                    <Input size="small" type="number" value={ozelEn} onChange={(e) => setOzelEn(Number(e.target.value))} className="!w-20" />
                  </div>
                  <div>
                    <div className="!text-[10px] !text-[#6b7280] !mb-1">Boy (mm)</div>
                    <Input size="small" type="number" value={ozelBoy} onChange={(e) => setOzelBoy(Number(e.target.value))} className="!w-20" />
                  </div>
                </Space>
              )}
              <div>
                <div className="!text-[10px] !text-[#6b7280] !mb-1">Yön</div>
                <Radio.Group size="small" value={pdfYon} onChange={(e) => setPdfYon(e.target.value)}>
                  {PDF_YONLERI.map((y) => (
                    <Radio.Button key={y.value} value={y.value}>{y.label}</Radio.Button>
                  ))}
                </Radio.Group>
              </div>
              <div className="!flex !gap-2">
                <div className="!flex-1">
                  <div className="!text-[10px] !text-[#6b7280] !mb-1">Sol Boşluk (mm)</div>
                  <Input size="small" type="number" value={bosslukSol} onChange={(e) => setBosslukSol(Number(e.target.value))} />
                </div>
                <div className="!flex-1">
                  <div className="!text-[10px] !text-[#6b7280] !mb-1">Sağ Boşluk (mm)</div>
                  <Input size="small" type="number" value={bosslukSag} onChange={(e) => setBosslukSag(Number(e.target.value))} />
                </div>
              </div>
            </Space>
          </Card>

          <Card
            size="small"
            title="Sorgular"
            extra={
              <Button size="small" type="link" icon={<PlusOutlined />} onClick={sorguEkle}>
                Sorgu Ekle
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

        {/* Sağ Panel - HTML Editör + Önizleme Yan Yana */}
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
                    <Slider
                      min={20}
                      max={150}
                      value={zoom}
                      onChange={setZoom}
                      className="!w-32"
                      tooltip={{ formatter: (v) => `${v}%` }}
                    />
                    <span className="!text-[10px] !text-[#6b7280] !w-8">{zoom}%</span>
                  </div>
                </div>
              }
            >
              <div className="!h-full !overflow-auto !bg-gray-100 !p-4">
                {(() => {
                  const MM_TO_PX = 3.7795
                  let genislik = pdfBoyut === 'Özel' ? ozelEn : pdfBoyut === 'A5' ? 148 : pdfBoyut === 'A6' ? 105 : 210
                  let yukseklik = pdfBoyut === 'Özel' ? ozelBoy : pdfBoyut === 'A5' ? 210 : pdfBoyut === 'A6' ? 148 : 297
                  if (pdfYon === 'yatay') { [genislik, yukseklik] = [yukseklik, genislik] }
                  const pxGenislik = genislik * MM_TO_PX
                  const pxYukseklik = yukseklik * MM_TO_PX
                  const olcek = zoom / 100
                  return (
                    <div className="!mx-auto" style={{ width: pxGenislik * olcek, height: pxYukseklik * olcek, overflow: 'hidden' }}>
                      <div className="!text-[10px] !text-[#9ca3af] !mb-1 !text-center">
                        {pdfBoyut} {pdfYon === 'yatay' ? 'Yatay' : 'Dikey'} — {genislik}x{yukseklik}mm
                      </div>
                      <div
                        className="!bg-white !shadow-md"
                        style={{
                          width: pxGenislik,
                          height: pxYukseklik,
                          padding: `${bosslukSol * MM_TO_PX}px ${bosslukSag * MM_TO_PX}px`,
                          boxSizing: 'border-box',
                          transform: `scale(${olcek})`,
                          transformOrigin: 'top left',
                        }}
                      >
                        <div dangerouslySetInnerHTML={{ __html: htmlKod }} />
                      </div>
                    </div>
                  )
                })()}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
