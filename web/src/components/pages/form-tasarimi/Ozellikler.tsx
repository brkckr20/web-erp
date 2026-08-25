'use client'

import { App, Button, Checkbox, Input, InputNumber, Select } from 'antd'
import type { Band, BandHucre, FormTasarimDraft, HucreStil, Secim, TabloKolon } from './types'
import { ARKA_PLANLAR, HIZALAMALAR, HUCRE_FORMATLARI, TABLO_BASLIK_ARKAPLANLARI, TABLO_CIZGI_STILLERI, alanEtiket, hucreStil } from './sabitler'
import { bandTipiAdlari } from './mock'

interface OzelliklerProps {
  form: FormTasarimDraft
  secili: Secim | null
  alanSecenekler: { value: string; label: string }[]
  onBandPatch: (bandId: string, patch: Partial<Band>) => void
  onHucrePatch: (bandId: string, hucreId: string, patch: Partial<BandHucre>) => void
  onElemanSil: (bandId: string, hucreId: string) => void
  onStilPatch: (bandId: string, hucreId: string, patch: Partial<HucreStil>) => void
  onKolonPatch: (bandId: string, kolonId: string, patch: Partial<TabloKolon>) => void
  onKolonEkleAlan: (bandId: string, alan: string) => void
  onKolonSil: (bandId: string, kolonId: string) => void
  onSorguSec: (bandId: string, sorguId: string) => void
  onSeciliKolon: (bandId: string, kolonId: string) => void
}

export default function Ozellikler(props: OzelliklerProps) {
  const { message } = App.useApp()
  const { form, secili } = props
  if (!secili) {
    return <div className="!text-[10px] !text-[#9ca3af] !p-2">Özellikleri düzenlemek için bir alan veya band seç.</div>
  }

  const band = form.layout.find((b) => b.id === secili.bandId)
  if (!band) return <div className="!text-[10px] !text-[#9ca3af] !p-2">Seçili band bulunamadı.</div>

  if (secili.tur === 'hucre') {
    const hucre = band.elemanlar.find((h) => h.id === secili.hucreId)
    if (!hucre) return null
    const s = hucreStil(hucre)
    const bilesen = hucre.bilesen ?? 'veri'
    return (
      <div className="!flex !flex-col !gap-2 !p-2">
        <div className="!text-[10px] !font-semibold !text-[#6b7280] !uppercase">Alan</div>
        <div className="!flex !flex-col !gap-1">
          <span className="!text-[10px] !text-[#9ca3af]">Tür</span>
          <Select
            size="small"
            value={bilesen}
            onChange={(v) => props.onHucrePatch(secili.bandId, secili.hucreId, { bilesen: v })}
            options={[
              { value: 'veri', label: 'Veri Alanı' },
              { value: 'metin', label: 'Metin' },
              { value: 'checkbox', label: 'Checkbox' },
              { value: 'resim', label: 'Resim' },
              { value: 'tablo', label: 'Tablo' },
              { value: 'barkod', label: 'Barkod' },
            ]}
          />
        </div>

        {bilesen === 'veri' && (
          <>
            <div className="!flex !flex-col !gap-1">
              <span className="!text-[10px] !text-[#9ca3af]">Statik etiket</span>
              <Input
                size="small"
                placeholder="örn. Fiş No"
                value={hucre.etiket ?? ''}
                onChange={(e) => props.onHucrePatch(secili.bandId, secili.hucreId, { etiket: e.target.value || undefined })}
              />
            </div>
            <div className="!flex !flex-col !gap-1">
              <span className="!text-[10px] !text-[#9ca3af]">Bağlı alan</span>
              <Select
                size="small"
                allowClear
                placeholder="Sorgu alanı"
                value={hucre.alan}
                onChange={(v) => props.onHucrePatch(secili.bandId, secili.hucreId, { alan: v || undefined })}
                options={props.alanSecenekler}
              />
            </div>
            <div className="!flex !flex-col !gap-1">
              <span className="!text-[10px] !text-[#9ca3af]">Değer biçimi</span>
              <Select
                size="small"
                value={s.format ?? 'otomatik'}
                onChange={(v) => props.onStilPatch(secili.bandId, secili.hucreId, { format: v === 'otomatik' ? undefined : v })}
                options={HUCRE_FORMATLARI}
              />
            </div>
          </>
        )}

        {bilesen === 'metin' && (
          <div className="!flex !flex-col !gap-1">
            <span className="!text-[10px] !text-[#9ca3af]">İçerik (manuel yazı)</span>
            <Input.TextArea
              size="small"
              autoSize={{ minRows: 2, maxRows: 6 }}
              placeholder="Buraya yazacağınız metin formda görünecek"
              value={hucre.deger ?? ''}
              onChange={(e) => props.onHucrePatch(secili.bandId, secili.hucreId, { deger: e.target.value || undefined })}
            />
          </div>
        )}

        {bilesen === 'checkbox' && (
          <div className="!flex !flex-col !gap-1">
            <span className="!text-[10px] !text-[#9ca3af]">Etiket</span>
            <Input
              size="small"
              placeholder="örn. Onaylandı"
              value={hucre.etiket ?? ''}
              onChange={(e) => props.onHucrePatch(secili.bandId, secili.hucreId, { etiket: e.target.value || undefined })}
            />
          </div>
        )}

        {bilesen === 'resim' && (
          <div className="!text-[10px] !text-[#9ca3af]">
            Resim alanı — görselin yolu ileride eklenecek. Şimdilik çerçeve olarak durur.
          </div>
        )}

        {bilesen === 'tablo' && (
          <div className="!text-[10px] !text-[#9ca3af]">
            Tablo alanı — kalem tablosu bandı daha kapsamlı tablolar için kullanılır.
          </div>
        )}

        {bilesen === 'barkod' && (
          <>
            <div className="!flex !flex-col !gap-1">
              <span className="!text-[10px] !text-[#9ca3af]">Bağlı alan (barkod değeri)</span>
              <Select
                size="small"
                allowClear
                placeholder="Sorgu alanı"
                value={hucre.alan}
                onChange={(v) => props.onHucrePatch(secili.bandId, secili.hucreId, { alan: v || undefined })}
                options={props.alanSecenekler}
              />
            </div>
            <div className="!flex !flex-col !gap-1">
              <span className="!text-[10px] !text-[#9ca3af]">Barkod türü</span>
              <Select
                size="small"
                value={hucre.deger || 'code128'}
                onChange={(v) => props.onHucrePatch(secili.bandId, secili.hucreId, { deger: v })}
                options={[
                  { value: 'code128', label: 'Code 128' },
                  { value: 'code39', label: 'Code 39' },
                  { value: 'ean13', label: 'EAN-13' },
                  { value: 'ean8', label: 'EAN-8' },
                  { value: 'upca', label: 'UPC-A' },
                ]}
              />
            </div>
          </>
        )}
        <div className="!grid !grid-cols-2 !gap-2">
          <div className="!flex !flex-col !gap-1">
            <span className="!text-[10px] !text-[#9ca3af]">X (mm)</span>
            <InputNumber
              size="small"
              min={0}
              step={0.5}
              value={hucre.x}
              onChange={(v) => props.onHucrePatch(secili.bandId, secili.hucreId, { x: v ?? 0 })}
            />
          </div>
          <div className="!flex !flex-col !gap-1">
            <span className="!text-[10px] !text-[#9ca3af]">Y (mm)</span>
            <InputNumber
              size="small"
              min={0}
              step={0.5}
              value={hucre.y}
              onChange={(v) => props.onHucrePatch(secili.bandId, secili.hucreId, { y: v ?? 0 })}
            />
          </div>
          <div className="!flex !flex-col !gap-1">
            <span className="!text-[10px] !text-[#9ca3af]">Genişlik (mm)</span>
            <InputNumber
              size="small"
              min={10}
              step={0.5}
              value={hucre.genislik}
              onChange={(v) => props.onHucrePatch(secili.bandId, secili.hucreId, { genislik: v ?? 10 })}
            />
          </div>
          <div className="!flex !flex-col !gap-1">
            <span className="!text-[10px] !text-[#9ca3af]">Yükseklik (mm)</span>
            <InputNumber
              size="small"
              min={5}
              step={0.5}
              value={hucre.yukseklik}
              onChange={(v) => props.onHucrePatch(secili.bandId, secili.hucreId, { yukseklik: v ?? 5 })}
            />
          </div>
          <div className="!flex !flex-col !gap-1">
            <span className="!text-[10px] !text-[#9ca3af]">Font boyutu</span>
            <InputNumber
              size="small"
              min={6}
              max={28}
              value={s.fontBoyutu ?? 9}
              onChange={(v) => props.onStilPatch(secili.bandId, secili.hucreId, { fontBoyutu: v ?? 9 })}
            />
          </div>
          <div className="!flex !flex-col !gap-1">
            <span className="!text-[10px] !text-[#9ca3af]">Hizalama</span>
            <Select
              size="small"
              value={s.hizalama ?? 'sol'}
              onChange={(v) => props.onStilPatch(secili.bandId, secili.hucreId, { hizalama: v })}
              options={HIZALAMALAR}
            />
          </div>
          <div className="!flex !flex-col !gap-1">
            <span className="!text-[10px] !text-[#9ca3af]">Arka plan</span>
            <Select
              size="small"
              value={s.arkaPlan}
              onChange={(v) => props.onStilPatch(secili.bandId, secili.hucreId, { arkaPlan: v })}
              options={ARKA_PLANLAR as { value: string; label: string }[]}
            />
          </div>
          <div className="!flex !flex-col !gap-1">
            <span className="!text-[10px] !text-[#9ca3af]">Diğer</span>
            <div className="!flex !gap-3">
              <Checkbox
                checked={s.kalin ?? false}
                onChange={(e) => props.onStilPatch(secili.bandId, secili.hucreId, { kalin: e.target.checked })}
              >
                Kalın
              </Checkbox>
              <Checkbox
                checked={s.kenarlik ?? false}
                onChange={(e) => props.onStilPatch(secili.bandId, secili.hucreId, { kenarlik: e.target.checked })}
              >
                Çerçeve
              </Checkbox>
            </div>
          </div>
        </div>
        <Button size="small" danger onClick={() => props.onHucrePatch(secili.bandId, secili.hucreId, { alan: undefined })}>
          Alan bağını kaldır
        </Button>
        <Button size="small" danger onClick={() => props.onElemanSil(secili.bandId, secili.hucreId)}>
          Elemanı sil
        </Button>
      </div>
    )
  }

  if (secili.tur === 'kolon') {
    const kolon = (band.tabloKolonlari ?? []).find((k) => k.id === secili.kolonId)
    if (!kolon) return null
    return (
      <div className="!flex !flex-col !gap-2 !p-2">
        <div className="!text-[10px] !font-semibold !text-[#6b7280] !uppercase">Tablo Kolonu</div>
        <div className="!flex !flex-col !gap-1">
          <span className="!text-[10px] !text-[#9ca3af]">Başlık</span>
          <Input
            size="small"
            placeholder="örn. Malzeme"
            value={kolon.baslik ?? ''}
            onChange={(e) => props.onKolonPatch(secili.bandId, secili.kolonId, { baslik: e.target.value || undefined })}
          />
        </div>
        <div className="!flex !flex-col !gap-1">
          <span className="!text-[10px] !text-[#9ca3af]">Bağlı alan</span>
          <Select
            size="small"
            allowClear
            placeholder="Sorgu alanı"
            value={kolon.alan}
            onChange={(v) => props.onKolonPatch(secili.bandId, secili.kolonId, { alan: v || undefined })}
            options={props.alanSecenekler}
          />
        </div>
        <div className="!flex !flex-col !gap-1">
          <span className="!text-[10px] !text-[#9ca3af]">Değer biçimi</span>
          <Select
            size="small"
            value={kolon.format ?? 'otomatik'}
            onChange={(v) =>
              props.onKolonPatch(secili.bandId, secili.kolonId, { format: v === 'otomatik' ? undefined : v })
            }
            options={HUCRE_FORMATLARI}
          />
        </div>
        <div className="!grid !grid-cols-2 !gap-2">
          <div className="!flex !flex-col !gap-1">
            <span className="!text-[10px] !text-[#9ca3af]">Genişlik (mm)</span>
            <InputNumber
              size="small"
              min={10}
              max={150}
              value={kolon.genislik}
              onChange={(v) => props.onKolonPatch(secili.bandId, secili.kolonId, { genislik: v ?? undefined })}
            />
          </div>
          <div className="!flex !flex-col !gap-1">
            <span className="!text-[10px] !text-[#9ca3af]">Hizalama</span>
            <Select
              size="small"
              value={kolon.hizalama ?? 'sol'}
              onChange={(v) => props.onKolonPatch(secili.bandId, secili.kolonId, { hizalama: v })}
              options={HIZALAMALAR}
            />
          </div>
        </div>
        <Button size="small" danger onClick={() => props.onKolonSil(secili.bandId, secili.kolonId)}>
          Kolonu kaldır
        </Button>
      </div>
    )
  }

  if (secili.tur === 'band' && band.tip !== 'kalem-tablo') {
    return (
      <div className="!flex !flex-col !gap-2 !p-2">
        <div className="!text-[10px] !font-semibold !text-[#6b7280] !uppercase">Band</div>
        <div className="!flex !flex-col !gap-1">
          <span className="!text-[10px] !text-[#9ca3af]">Ad</span>
          <Input
            size="small"
            value={band.ad}
            onChange={(e) => props.onBandPatch(secili.bandId, { ad: e.target.value || bandTipiAdlari[band.tip] })}
          />
        </div>
        <div className="!flex !flex-col !gap-1">
          <span className="!text-[10px] !text-[#9ca3af]">Yükseklik (mm) — boş = içeriğe göre otomatik</span>
          <InputNumber
            size="small"
            min={5}
            max={300}
            step={0.5}
            value={band.yukseklik}
            placeholder="Otomatik"
            onChange={(v) => props.onBandPatch(secili.bandId, { yukseklik: v ?? undefined })}
          />
        </div>
      </div>
    )
  }

  if (band.tip === 'kalem-tablo') {
    const sorgu = form.sorgular.find((s) => s.id === band.sorguId)
    return (
      <div className="!flex !flex-col !gap-2 !p-2">
        <div className="!text-[10px] !font-semibold !text-[#6b7280] !uppercase">Kalem Tablosu</div>
        <div className="!flex !flex-col !gap-1">
          <span className="!text-[10px] !text-[#9ca3af]">Sorgu</span>
          <Select
            size="small"
            placeholder="Kalemleri döndüren sorgu"
            value={band.sorguId}
            onChange={(v) => props.onSorguSec(secili.bandId, v)}
            options={form.sorgular.map((s) => ({ value: s.id, label: `S${s.sirano} · ${s.ad || 'Adsız'}` }))}
          />
        </div>
        <div className="!grid !grid-cols-2 !gap-2">
          <div className="!flex !flex-col !gap-1">
            <span className="!text-[10px] !text-[#9ca3af]">Başlık arka planı</span>
            <Select
              size="small"
              value={band.baslikArkaPlan ?? 'gri'}
              onChange={(v) => props.onBandPatch(secili.bandId, { baslikArkaPlan: v })}
              options={TABLO_BASLIK_ARKAPLANLARI}
            />
          </div>
          <div className="!flex !flex-col !gap-1">
            <span className="!text-[10px] !text-[#9ca3af]">Çizgi stili</span>
            <Select
              size="small"
              value={band.cizgiStili ?? 'yatay'}
              onChange={(v) => props.onBandPatch(secili.bandId, { cizgiStili: v })}
              options={TABLO_CIZGI_STILLERI}
            />
          </div>
        </div>
        <Button
          size="small"
          onClick={() => {
            if (sorgu && sorgu.kolonlar.length > 0) {
              sorgu.kolonlar.forEach((k) => props.onKolonEkleAlan(secili.bandId, `S${sorgu.sirano}.${k}`))
            } else {
              message.info('Sorgu kolonları yüklü değil — önce Sorgular sekmesinde sorguyu çalıştırın.')
            }
          }}
        >
          Tüm kolonları ekle
        </Button>
        <Button size="small" onClick={() => props.onKolonEkleAlan(secili.bandId, '')}>
          + Boş kolon ekle
        </Button>
        <div className="!flex !flex-col !gap-1">
          {(band.tabloKolonlari ?? []).map((k, i) => (
            <div
              key={k.id}
              className="!flex !items-center !justify-between !px-1.5 !py-1 !border !border-gray-200 !rounded-sm !cursor-pointer hover:!border-[#FF9933]"
              onClick={() => props.onSeciliKolon(secili.bandId, k.id)}
            >
              <span className="!text-[10px]">{k.baslik || (k.alan ? alanEtiket(k.alan) : `Kolon ${i + 1}`)}</span>
              <span className="!text-[9px] !text-[#9ca3af]">{k.alan ? alanEtiket(k.alan) : ''}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return null
}
