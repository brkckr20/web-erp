'use client'

import { useState, useMemo } from 'react'
import { Input, Tag, Card, Empty } from 'antd'
import { SearchOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import type { UretimHareket } from './UretimHareketGirisi'

const mockHareketler: UretimHareket[] = [
  { id: 1, siparisNo: 'SIP-2026-001', modelKod: 'BT001', modelAd: 'Basic Tişört', renkAd: 'Beyaz', beden: 'M', islemKod: 'KESIM', islemAd: 'Kesim', miktar: 1200, kalite: 1, birimFiyat: null, cariAd: null, tarih: '2026-08-01', aciklama: '', barkod: 'SIP-2026-001-BT001-Beyaz-M', kayitYapan: 'Ahmet' },
  { id: 2, siparisNo: 'SIP-2026-001', modelKod: 'BT001', modelAd: 'Basic Tişört', renkAd: 'Beyaz', beden: 'L', islemKod: 'KESIM', islemAd: 'Kesim', miktar: 800, kalite: 1, birimFiyat: null, cariAd: null, tarih: '2026-08-02', aciklama: '', barkod: 'SIP-2026-001-BT001-Beyaz-L', kayitYapan: 'Ahmet' },
  { id: 3, siparisNo: 'SIP-2026-001', modelKod: 'BT001', modelAd: 'Basic Tişört', renkAd: 'Beyaz', beden: 'M', islemKod: 'DIKIM', islemAd: 'Dikim', miktar: 1000, kalite: 1, birimFiyat: 15.00, cariAd: 'ABC Dikim Ltd.', tarih: '2026-08-03', aciklama: 'Fason dikim', barkod: 'SIP-2026-001-BT001-Beyaz-M', kayitYapan: 'Mehmet' },
  { id: 4, siparisNo: 'SIP-2026-001', modelKod: 'BT001', modelAd: 'Basic Tişört', renkAd: 'Siyah', beden: 'M', islemKod: 'KESIM', islemAd: 'Kesim', miktar: 600, kalite: 1, birimFiyat: null, cariAd: null, tarih: '2026-08-02', aciklama: '', barkod: 'SIP-2026-001-BT001-Siyah-M', kayitYapan: 'Ahmet' },
  { id: 5, siparisNo: 'SIP-2026-001', modelKod: 'VE002', modelAd: 'Viskon Elbise', renkAd: 'Kırmızı', beden: '38', islemKod: 'KESIM', islemAd: 'Kesim', miktar: 400, kalite: 1, birimFiyat: null, cariAd: null, tarih: '2026-08-04', aciklama: '', barkod: 'SIP-2026-001-VE002-Kirmizi-38', kayitYapan: 'Ali' },
]

const mockKumasGirisCikis = [
  { siparisNo: 'SIP-2026-001', modelKod: 'BT001', kumasAd: 'Overlay Penye', renkAd: 'Beyaz', giris: 0, cikis: 1200, birim: 'MT' },
  { siparisNo: 'SIP-2026-001', modelKod: 'BT001', kumasAd: 'Overlay Penye', renkAd: 'Siyah', giris: 0, cikis: 600, birim: 'MT' },
  { siparisNo: 'SIP-2026-001', modelKod: 'VE002', kumasAd: 'Viskon Kumaş', renkAd: 'Kırmızı', giris: 0, cikis: 400, birim: 'MT' },
]

interface ModelOzet {
  modelKod: string
  modelAd: string
  islemler: Record<string, number>
  renkler: {
    renkAd: string
    bedenler: {
      beden: string
      islemler: Record<string, number>
    }[]
  }[]
  toplamMiktar: number
}

interface SiparisOzet {
  siparisNo: string
  modeller: ModelOzet[]
  toplamIslem: number
}

export default function SiparisDurumu() {
  const [arama, setArama] = useState('')

  const siparisOzetleri = useMemo(() => {
    const gruplu: Record<string, Record<string, ModelOzet>> = {}

    mockHareketler.forEach((h) => {
      if (!gruplu[h.siparisNo]) gruplu[h.siparisNo] = {}
      if (!gruplu[h.siparisNo][h.modelKod]) {
        gruplu[h.siparisNo][h.modelKod] = {
          modelKod: h.modelKod,
          modelAd: h.modelAd,
          islemler: {},
          renkler: [],
          toplamMiktar: 0,
        }
      }
      const model = gruplu[h.siparisNo][h.modelKod]
      model.islemler[h.islemAd] = (model.islemler[h.islemAd] || 0) + h.miktar
      model.toplamMiktar += h.miktar

      let renk = model.renkler.find((r) => r.renkAd === h.renkAd)
      if (!renk) {
        renk = { renkAd: h.renkAd, bedenler: [] }
        model.renkler.push(renk)
      }
      let beden = renk.bedenler.find((b) => b.beden === h.beden)
      if (!beden) {
        beden = { beden: h.beden, islemler: {} }
        renk.bedenler.push(beden)
      }
      beden.islemler[h.islemAd] = (beden.islemler[h.islemAd] || 0) + h.miktar
    })

    return Object.entries(gruplu)
      .filter(([siparisNo]) => !arama || siparisNo.toLowerCase().includes(arama.toLowerCase()))
      .map(([siparisNo, modeller]) => ({
        siparisNo,
        modeller: Object.values(modeller),
        toplamIslem: Object.values(modeller).reduce((acc, m) => acc + m.toplamMiktar, 0),
      }))
  }, [arama])

  return (
    <div className="!p-3 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider">
          Sipariş Durumu
        </div>
        <Input
          size="small"
          placeholder="Sipariş ara..."
          prefix={<SearchOutlined />}
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          className="!w-48"
          allowClear
        />
      </div>

      {siparisOzetleri.length === 0 ? (
        <Empty description="Sipariş bulunamadı" />
      ) : (
        <div className="flex-1 overflow-auto space-y-3">
          {siparisOzetleri.map((siparis) => (
            <Card
              key={siparis.siparisNo}
              size="small"
              title={
                <div className="flex items-center gap-2">
                  <ShoppingCartOutlined />
                  <span className="text-[12px] font-semibold">{siparis.siparisNo}</span>
                  <Tag color="blue">{siparis.modeller.length} Model</Tag>
                </div>
              }
              extra={
                <span className="text-[11px] text-gray-500">
                  Toplam: {siparis.toplamIslem.toLocaleString('tr-TR')} adet
                </span>
              }
            >
              {siparis.modeller.map((model) => (
                <div key={model.modelKod} className="mb-3 last:mb-0">
                  {/* Model Başlığı */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-semibold text-gray-700">
                      {model.modelKod} - {model.modelAd}
                    </span>
                    <Tag color="default" className="!text-[10px]">
                      {model.toplamMiktar.toLocaleString('tr-TR')} adet
                    </Tag>
                  </div>

                  {/* İşlem Özetleri */}
                  <div className="flex gap-2 mb-1">
                    {Object.entries(model.islemler).map(([islem, miktar]) => (
                      <Tag
                        key={islem}
                        color={miktar > 0 ? 'green' : 'default'}
                        className="!text-[10px]"
                      >
                        {islem}: {miktar.toLocaleString('tr-TR')}
                      </Tag>
                    ))}
                  </div>

                  {/* Renk/Beden Detayları */}
                  <div className="ml-2 space-y-0.5">
                    {model.renkler.map((renk) => (
                      <div key={renk.renkAd} className="text-[10px] text-gray-500">
                        <span className="font-medium text-gray-600">{renk.renkAd}:</span>
                        {renk.bedenler.map((beden) => (
                          <span key={beden.beden} className="ml-2">
                            <span className="text-gray-400">{beden.beden}:</span>
                            {Object.entries(beden.islemler).map(([islem, miktar]) => (
                              <span key={islem} className="ml-1">
                                {islem}={<span className="font-medium text-gray-700">{miktar}</span>}
                              </span>
                            ))}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Kumaş Giriş/Çıkış */}
                  {mockKumasGirisCikis
                    .filter((k) => k.siparisNo === siparis.siparisNo && k.modelKod === model.modelKod)
                    .length > 0 && (
                    <div className="mt-1 ml-2">
                      <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">
                        Kumaş Giriş/Çıkış
                      </div>
                      {mockKumasGirisCikis
                        .filter((k) => k.siparisNo === siparis.siparisNo && k.modelKod === model.modelKod)
                        .map((k, idx) => (
                          <div key={idx} className="text-[10px] text-gray-500 ml-1">
                            {k.kumasAd} ({k.renkAd}):
                            <span className="ml-1 text-green-600">
                              Giriş {k.giris} {k.birim}
                            </span>
                            /
                            <span className="ml-1 text-red-500">
                              Çıkış {k.cikis} {k.birim}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}

                  {siparis.modeller.indexOf(model) < siparis.modeller.length - 1 && (
                    <div className="border-b border-gray-100 mt-2" />
                  )}
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
