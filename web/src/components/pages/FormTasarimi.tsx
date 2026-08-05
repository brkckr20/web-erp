'use client'

import { useMemo, useState } from 'react'
import type { CSSProperties, DragEvent } from 'react'
import { Button, Checkbox, Input, InputNumber, Select, Tabs, Tag, message } from 'antd'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import { previewPdf } from '@/lib/reports/pdf-common'
import { formTasarimDoc } from '@/lib/reports/form-tasarim.report'
import type {
  Band,
  BandHucre,
  BandTipi,
  FormSorguDraft,
  FormTasarimDraft,
  Hizalama,
  HucreStil,
  SayfaAyari,
  Secim,
  TabloKolon,
} from './form-tasarimi/types'
import { bandTipiAdlari, bandTipiSirasi, bosForm, uidYeni, yeniBand } from './form-tasarimi/mock'

const HIZALAMALAR: { value: Hizalama; label: string }[] = [
  { value: 'sol', label: 'Sol' },
  { value: 'orta', label: 'Orta' },
  { value: 'sag', label: 'Sağ' },
]

const ARKA_PLANLAR: { value?: string; label: string }[] = [
  { label: 'Yok' },
  { value: '#F3F4F6', label: 'Gri' },
  { value: '#FF9933', label: 'Turuncu' },
  { value: '#DBEAFE', label: 'Açık Mavi' },
  { value: '#FEF3C7', label: 'Açık Sarı' },
]

const OLCU = 2.6
const BOYUT_MM: Record<SayfaAyari['boyut'], [number, number]> = {
  A4: [210, 297],
  A5: [148, 210],
  Ozel: [210, 297],
}

const HIZA_CSS: Record<Hizalama, 'left' | 'right' | 'center'> = {
  sol: 'left',
  orta: 'center',
  sag: 'right',
}

function alanEtiket(ref: string): string {
  const i = ref.indexOf('.')
  return i >= 0 ? ref.slice(i + 1) : ref
}

function hucreStil(h: BandHucre): HucreStil {
  return h.stil ?? {}
}

function hucreGosterim(h: BandHucre): string {
  if (h.alan) {
    const v = alanEtiket(h.alan)
    return h.etiket ? `${h.etiket}: ${v}` : v
  }
  return h.etiket ?? ''
}

interface BandCellProps {
  hucre: BandHucre
  secili: boolean
  onSelect: () => void
}

function BandCell({ hucre, secili, onSelect }: BandCellProps) {
  const s = hucreStil(hucre)
  const style: CSSProperties = {
    fontSize: s.fontBoyutu ?? 9,
    fontWeight: s.kalin ? 'bold' : undefined,
    textAlign: s.hizalama ? HIZA_CSS[s.hizalama] : 'left',
    background: s.arkaPlan,
    border: s.kenarlik ? '1px solid #d1d5db' : '1px dashed transparent',
  }
  return (
    <div
      onClick={onSelect}
      className={`!min-h-[24px] !px-1 !py-0.5 !rounded-sm !cursor-pointer !select-none ${
        secili ? '!ring-2 !ring-[#FF9933]' : 'hover:!ring-1 hover:!ring-[#FF9933]/50'
      }`}
      style={style}
    >
      {hucreGosterim(hucre) || <span className="!text-[9px] !text-gray-300">boş</span>}
    </div>
  )
}

interface KalemTabloBandProps {
  band: Band
  seciliKolonId: string | null
  onSelectKolon: (kolonId: string) => void
  onDropKolon: (e: DragEvent<HTMLDivElement>, kolonId?: string) => void
}

function KalemTabloBand({ band, seciliKolonId, onSelectKolon, onDropKolon }: KalemTabloBandProps) {
  const kolonlar = band.tabloKolonlari ?? []
  return (
    <div>
      <table className="!w-full !border-collapse" style={{ borderSpacing: 1 }}>
        <thead>
          <tr>
            {kolonlar.map((kolon) => (
              <th
                key={kolon.id}
                className={`!border !border-gray-300 !p-0.5 !align-top !cursor-pointer ${
                  seciliKolonId === kolon.id ? '!bg-[#FF9933]/20' : '!bg-gray-50'
                }`}
                onClick={() => onSelectKolon(kolon.id)}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'copy'
                }}
                onDrop={(e) => onDropKolon(e, kolon.id)}
              >
                <div className="!text-[9px] !font-semibold !text-center">
                  {kolon.baslik || (kolon.alan ? alanEtiket(kolon.alan) : '...')}
                </div>
              </th>
            ))}
            <th
              className="!border !border-dashed !border-gray-400 !p-0.5 !min-w-[40px]"
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'copy'
              }}
              onDrop={(e) => onDropKolon(e)}
            >
              <span className="!text-[9px] !text-gray-400">+ kolon</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {kolonlar.map((kolon) => (
              <td key={kolon.id} className="!border !border-gray-200 !p-0.5 !text-[9px]">
                {kolon.alan ? alanEtiket(kolon.alan) : ' '}
              </td>
            ))}
            <td className="!border !border-gray-200 !p-0.5" />
          </tr>
        </tbody>
      </table>
    </div>
  )
}

interface BandSectionProps {
  band: Band
  index: number
  total: number
  secili: Secim | null
  onSec: () => void
  onSeciliHucre: (bandId: string, satirId: string, hucreId: string) => void
  onYukari: () => void
  onAsagi: () => void
  onSil: () => void
  onSelectKolon: (kolonId: string) => void
  onDropKolon: (e: DragEvent<HTMLDivElement>, kolonId?: string) => void
}

function BandSection(props: BandSectionProps) {
  const { band, index, total, secili } = props
  const bandSecili = secili?.tur === 'band' && secili.bandId === band.id
  return (
    <div
      onClick={props.onSec}
      className={`!rounded-sm !overflow-hidden !border !bg-white ${
        bandSecili ? '!border-[#FF9933] !ring-1 !ring-[#FF9933]' : '!border-dashed !border-gray-300'
      }`}
    >
      <div
        className="!flex !items-center !gap-1 !px-1.5 !py-0.5 !bg-[#f1f2f4] !border-b !border-gray-200 !cursor-pointer"
        onClick={props.onSec}
      >
        <span className="!text-[10px] !font-semibold !text-[#333]">{band.ad}</span>
        <span className="!text-[9px] !text-[#9ca3af]">{bandTipiAdlari[band.tip]}</span>
        <span className="!flex-1" />
        <button
          type="button"
          className="!text-[10px] !text-[#9ca3af] !px-1 disabled:!opacity-30"
          onClick={(e) => {
            e.stopPropagation()
            props.onYukari()
          }}
          disabled={index <= 0}
        >
          ↑
        </button>
        <button
          type="button"
          className="!text-[10px] !text-[#9ca3af] !px-1 disabled:!opacity-30"
          onClick={(e) => {
            e.stopPropagation()
            props.onAsagi()
          }}
          disabled={index >= total - 1}
        >
          ↓
        </button>
        <button
          type="button"
          className="!text-[10px] !text-red-400 !px-1"
          onClick={(e) => {
            e.stopPropagation()
            props.onSil()
          }}
        >
          🗑
        </button>
      </div>
      <div className="!p-1.5">
        {band.tip === 'kalem-tablo' ? (
          <KalemTabloBand
            band={band}
            seciliKolonId={secili?.tur === 'kolon' ? secili.kolonId : null}
            onSelectKolon={props.onSelectKolon}
            onDropKolon={props.onDropKolon}
          />
        ) : (
          <table className="!w-full !border-collapse" style={{ borderSpacing: 3 }}>
            <tbody>
              {band.satirlar.map((satir) => (
                <tr key={satir.id}>
                  {satir.hucreler.map((hucre) => (
                    <td key={hucre.id} className="!align-middle !w-1/4">
                      <BandCell
                        hucre={hucre}
                        secili={isSeciliHucre(secili, band.id, satir.id, hucre.id)}
                        onSelect={() => props.onSeciliHucre(band.id, satir.id, hucre.id)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function isSeciliHucre(secili: Secim | null, bandId: string, satirId: string, hucreId: string): boolean {
  return secili?.tur === 'hucre' && secili.bandId === bandId && secili.satirId === satirId && secili.hucreId === hucreId
}

function SayfaAyariPanel({ sayfa, onChange }: { sayfa: SayfaAyari; onChange: (p: Partial<SayfaAyari>) => void }) {
  return (
    <div className="!border !border-gray-300 !rounded-sm !bg-[#FAFAFA] !p-2 !flex !items-center !gap-3 !shrink-0">
      <span className="!text-[11px] !font-semibold !text-[#333]">Sayfa Ayarı</span>
      <span className="!text-[10px] !text-[#6b7280]">Boyut:</span>
      <Select
        size="small"
        className="!w-20"
        value={sayfa.boyut}
        onChange={(v) => onChange({ boyut: v })}
        options={[
          { value: 'A4', label: 'A4' },
          { value: 'A5', label: 'A5' },
          { value: 'Ozel', label: 'Özel' },
        ]}
      />
      <span className="!text-[10px] !text-[#6b7280]">Yön:</span>
      <Select
        size="small"
        className="!w-24"
        value={sayfa.yon}
        onChange={(v) => onChange({ yon: v })}
        options={[
          { value: 'dikey', label: 'Dikey' },
          { value: 'yatay', label: 'Yatay' },
        ]}
      />
      <span className="!text-[10px] !text-[#6b7280]">Kenarlar (mm):</span>
      {(
        [
          ['kenarUst', 'Üst'],
          ['kenarAlt', 'Alt'],
          ['kenarSol', 'Sol'],
          ['kenarSag', 'Sağ'],
        ] as const
      ).map(([k, lbl]) => (
        <span key={k} className="!flex !items-center !gap-1">
          <span className="!text-[9px] !text-[#9ca3af]">{lbl}</span>
          <InputNumber
            size="small"
            className="!w-14"
            min={0}
            max={50}
            value={sayfa[k]}
            onChange={(v) => onChange({ [k]: v ?? 0 } as Partial<SayfaAyari>)}
          />
        </span>
      ))}
    </div>
  )
}

interface OzelliklerProps {
  form: FormTasarimDraft
  secili: Secim | null
  alanSecenekler: { value: string; label: string }[]
  onHucrePatch: (bandId: string, satirId: string, hucreId: string, patch: Partial<BandHucre>) => void
  onStilPatch: (bandId: string, satirId: string, hucreId: string, patch: Partial<HucreStil>) => void
  onKolonPatch: (bandId: string, kolonId: string, patch: Partial<TabloKolon>) => void
  onKolonEkleAlan: (bandId: string, alan: string) => void
  onKolonSil: (bandId: string, kolonId: string) => void
  onSorguSec: (bandId: string, sorguId: string) => void
  onSeciliKolon: (bandId: string, kolonId: string) => void
}

function Ozellikler(props: OzelliklerProps) {
  const { form, secili } = props
  if (!secili) {
    return <div className="!text-[10px] !text-[#9ca3af] !p-2">Özellikleri düzenlemek için bir alan veya band seç.</div>
  }

  const band = form.layout.find((b) => b.id === secili.bandId)
  if (!band) return <div className="!text-[10px] !text-[#9ca3af] !p-2">Seçili band bulunamadı.</div>

  if (secili.tur === 'hucre') {
    const satir = band.satirlar.find((r) => r.id === secili.satirId)
    const hucre = satir?.hucreler.find((h) => h.id === secili.hucreId)
    if (!hucre) return null
    const s = hucreStil(hucre)
    return (
      <div className="!flex !flex-col !gap-2 !p-2">
        <div className="!text-[10px] !font-semibold !text-[#6b7280] !uppercase">Hücre</div>
        <div className="!flex !flex-col !gap-1">
          <span className="!text-[10px] !text-[#9ca3af]">Statik etiket</span>
          <Input
            size="small"
            placeholder="örn. Fiş No"
            value={hucre.etiket ?? ''}
            onChange={(e) => props.onHucrePatch(secili.bandId, secili.satirId, secili.hucreId, { etiket: e.target.value || undefined })}
          />
        </div>
        <div className="!flex !flex-col !gap-1">
          <span className="!text-[10px] !text-[#9ca3af]">Bağlı alan</span>
          <Select
            size="small"
            allowClear
            placeholder="Sorgu alanı"
            value={hucre.alan}
            onChange={(v) => props.onHucrePatch(secili.bandId, secili.satirId, secili.hucreId, { alan: v || undefined })}
            options={props.alanSecenekler}
          />
        </div>
        <div className="!grid !grid-cols-2 !gap-2">
          <div className="!flex !flex-col !gap-1">
            <span className="!text-[10px] !text-[#9ca3af]">Font boyutu</span>
            <InputNumber
              size="small"
              min={6}
              max={28}
              value={s.fontBoyutu ?? 9}
              onChange={(v) => props.onStilPatch(secili.bandId, secili.satirId, secili.hucreId, { fontBoyutu: v ?? 9 })}
            />
          </div>
          <div className="!flex !flex-col !gap-1">
            <span className="!text-[10px] !text-[#9ca3af]">Hizalama</span>
            <Select
              size="small"
              value={s.hizalama ?? 'sol'}
              onChange={(v) => props.onStilPatch(secili.bandId, secili.satirId, secili.hucreId, { hizalama: v })}
              options={HIZALAMALAR}
            />
          </div>
          <div className="!flex !flex-col !gap-1">
            <span className="!text-[10px] !text-[#9ca3af]">Arka plan</span>
            <Select
              size="small"
              value={s.arkaPlan}
              onChange={(v) => props.onStilPatch(secili.bandId, secili.satirId, secili.hucreId, { arkaPlan: v })}
              options={ARKA_PLANLAR as { value: string; label: string }[]}
            />
          </div>
          <div className="!flex !flex-col !gap-1">
            <span className="!text-[10px] !text-[#9ca3af]">Diğer</span>
            <div className="!flex !gap-3">
              <Checkbox
                checked={s.kalin ?? false}
                onChange={(e) => props.onStilPatch(secili.bandId, secili.satirId, secili.hucreId, { kalin: e.target.checked })}
              >
                Kalın
              </Checkbox>
              <Checkbox
                checked={s.kenarlik ?? false}
                onChange={(e) => props.onStilPatch(secili.bandId, secili.satirId, secili.hucreId, { kenarlik: e.target.checked })}
              >
                Çerçeve
              </Checkbox>
            </div>
          </div>
        </div>
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
        <Button
          size="small"
          onClick={() => {
            if (sorgu && sorgu.kolonlar.length > 0) {
              sorgu.kolonlar.forEach((k) => props.onKolonEkleAlan(secili.bandId, `S${sorgu.sirano}.${k}`))
            } else {
              message.info('Sorgu kolonları yüklü değil — gerçek sorgu çalışması backend fazında.')
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

export default function FormTasarimi() {
  const [form, setForm] = useState<FormTasarimDraft>(() => bosForm())
  const [sekme, setSekme] = useState<'sorgular' | 'tasarim'>('sorgular')
  const [secili, setSecili] = useState<Secim | null>(null)

  const formGuncelle = (updater: (f: FormTasarimDraft) => FormTasarimDraft) => {
    setForm((prev) => updater(structuredClone(prev)))
  }

  const yeniForm = () => {
    setForm(bosForm())
    setSecili(null)
    setSekme('sorgular')
    message.info('Yeni form başlatıldı.')
  }

  const kaydet = () => {
    message.success('Tasarım hazır — backend fazı bağlanınca kalıcı kaydedilecek.')
  }

  const formSil = () => {
    setForm(bosForm())
    setSecili(null)
    setSekme('sorgular')
    message.info('Form sıfırlandı.')
  }

  const onizle = async () => {
    try {
      await previewPdf(formTasarimDoc(form))
    } catch {
      message.error('PDF oluşturulamadı.')
    }
  }

  // ---- Sorgular ----
  const sorguGuncelle = (sorguId: string, patch: Partial<FormSorguDraft>) => {
    formGuncelle((f) => ({
      ...f,
      sorgular: f.sorgular.map((s) => (s.id === sorguId ? { ...s, ...patch } : s)),
    }))
  }

  // ---- Layout ----
  const bandGuncelle = (bandId: string, patch: Partial<Band>) => {
    formGuncelle((f) => ({
      ...f,
      layout: f.layout.map((b) => (b.id === bandId ? { ...b, ...patch } : b)),
    }))
  }

  const bandSil = (bandId: string) => {
    if (secili && secili.bandId === bandId) setSecili(null)
    formGuncelle((f) => ({ ...f, layout: f.layout.filter((b) => b.id !== bandId) }))
  }

  const bandTasi = (bandId: string, yon: -1 | 1) => {
    formGuncelle((f) => {
      const idx = f.layout.findIndex((b) => b.id === bandId)
      const yeni = idx + yon
      if (yeni < 0 || yeni >= f.layout.length) return f
      const dizi = [...f.layout]
      const [b] = dizi.splice(idx, 1)
      dizi.splice(yeni, 0, b)
      return { ...f, layout: dizi }
    })
  }

  const bandEkle = (tip: BandTipi) => {
    formGuncelle((f) => ({ ...f, layout: [...f.layout, yeniBand(tip)] }))
  }

  const hucrePatch = (bandId: string, satirId: string, hucreId: string, patch: Partial<BandHucre>) => {
    const band = form?.layout.find((b) => b.id === bandId)
    if (!band) return
    bandGuncelle(bandId, {
      satirlar: band.satirlar.map((s) =>
        s.id === satirId
          ? { ...s, hucreler: s.hucreler.map((h) => (h.id === hucreId ? { ...h, ...patch } : h)) }
          : s,
      ),
    })
  }

  const stilPatch = (bandId: string, satirId: string, hucreId: string, patch: Partial<HucreStil>) => {
    const band = form?.layout.find((b) => b.id === bandId)
    if (!band) return
    const hucre = band.satirlar.find((r) => r.id === satirId)?.hucreler.find((h) => h.id === hucreId)
    if (!hucre) return
    hucrePatch(bandId, satirId, hucreId, { stil: { ...(hucre.stil ?? {}), ...patch } })
  }

  const kolonGuncelle = (bandId: string, kolonId: string, patch: Partial<TabloKolon>) => {
    const band = form?.layout.find((b) => b.id === bandId)
    if (!band) return
    bandGuncelle(bandId, {
      tabloKolonlari: (band.tabloKolonlari ?? []).map((k) => (k.id === kolonId ? { ...k, ...patch } : k)),
    })
  }

  const kolonEkleAlan = (bandId: string, alan: string) => {
    const band = form?.layout.find((b) => b.id === bandId)
    if (!band) return
    bandGuncelle(bandId, { tabloKolonlari: [...(band.tabloKolonlari ?? []), { id: uidYeni(), alan: alan || undefined }] })
  }

  const kolonSil = (bandId: string, kolonId: string) => {
    if (secili && secili.tur === 'kolon' && secili.kolonId === kolonId) setSecili(null)
    const band = form?.layout.find((b) => b.id === bandId)
    if (!band) return
    bandGuncelle(bandId, { tabloKolonlari: (band.tabloKolonlari ?? []).filter((k) => k.id !== kolonId) })
  }

  const kolonDrop = (e: DragEvent<HTMLDivElement>, bandId: string, kolonId?: string) => {
    e.preventDefault()
    const ref = e.dataTransfer.getData('text/plain')
    if (kolonId) {
      kolonGuncelle(bandId, kolonId, { alan: ref || undefined })
    } else if (ref) {
      kolonEkleAlan(bandId, ref)
    }
  }

  const sorguSec = (bandId: string, sorguId: string) => {
    bandGuncelle(bandId, { sorguId })
  }

  const alanSecenekler = useMemo(() => {
    return form.sorgular.flatMap((s) =>
      s.kolonlar.map((k) => ({ value: `S${s.sirano}.${k}`, label: `S${s.sirano}.${k}` })),
    )
  }, [form])

  const kullanilabilirBandTipleri = useMemo(() => {
    const mevcut = new Set(form.layout.map((b) => b.tip))
    return bandTipiSirasi.filter((t) => !mevcut.has(t))
  }, [form])

  const sayfa = form.sayfa
  const [g, y] = BOYUT_MM[sayfa.boyut] ?? BOYUT_MM.A4
  const kagitGenislik = (sayfa.yon === 'yatay' ? y : g) * OLCU
  const kagitYukseklik = (sayfa.yon === 'yatay' ? g : y) * OLCU

  return (
    <div className="!h-full !flex !flex-col !overflow-hidden">
      <div style={{ marginLeft: -12, marginRight: -12 }}>
        <CardToolbar
          buttons={createToolbarButtons(
            { onNew: yeniForm, onSave: kaydet, onDelete: formSil, onReport: onizle },
            { report: { label: 'PDF Önizle', onClick: onizle, disabled: form.layout.length === 0 } },
          )}
        />
      </div>

      <div className="!flex !items-center !gap-2 !px-3 !py-1.5 !bg-white !border-b !border-gray-200">
        <span className="!text-[10px] !text-[#9ca3af]">Form Adı:</span>
        <Input
          size="small"
          className="!w-44"
          value={form.ad}
          placeholder="Form adı"
          onChange={(e) => formGuncelle((f) => ({ ...f, ad: e.target.value }))}
        />
        <span className="!text-[10px] !text-[#9ca3af] !ml-2">Ekran Türü:</span>
        <Input
          size="small"
          className="!w-44"
          value={form.ekranTuru}
          placeholder="ör. stok-hareket-fisi"
          onChange={(e) => formGuncelle((f) => ({ ...f, ekranTuru: e.target.value }))}
        />
      </div>

      <div className="!flex-1 !min-h-0 !flex">
        <Tabs
          size="small"
          className="!flex-1 !min-h-0 !flex !flex-col [&_.ant-tabs-content-holder]:!flex [&_.ant-tabs-content]:!flex-1 [&_.ant-tabs-content-holder]:!min-h-0 [&_.ant-tabs-content]:!min-h-0 [&_.ant-tabs-nav]:!mb-0 [&_.ant-tabs-nav]:!px-2 [&_.ant-tabs-nav]:!bg-white [&_.ant-tabs-tab]:!text-[11px]"
          activeKey={sekme}
          onChange={(k) => setSekme(k as 'sorgular' | 'tasarim')}
          items={[
            {
              key: 'sorgular',
              label: 'Sorgular',
              children: (
                <div className="!h-full !flex !flex-col !gap-2 !p-2.5">
                  <div className="!border !border-gray-300 !rounded-sm !bg-[#FAFAFA] !p-3 !flex !flex-col !gap-2 !shrink-0">
                    <div className="!text-[11px] !font-semibold !text-[#333]">Veri Kaynağı İsimleri</div>
                    <div className="!grid !grid-cols-2 !gap-x-6 !gap-y-1.5">
                      {form.sorgular.map((s) => (
                        <div key={s.id} className="!flex !items-center !gap-2">
                          <span className="!text-[10px] !text-[#6b7280] !w-12 !shrink-0">Sorgu {s.sirano}</span>
                          <Input
                            size="small"
                            className="!w-56"
                            value={s.ad}
                            placeholder="Veri adı"
                            onChange={(e) => sorguGuncelle(s.id, { ad: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Tabs
                    size="small"
                    type="card"
                    tabBarGutter={2}
                    className="!flex-1 !min-h-0 !flex !flex-col [&_.ant-tabs-content-holder]:!flex [&_.ant-tabs-content]:!flex-1 [&_.ant-tabs-content-holder]:!min-h-0 [&_.ant-tabs-content]:!min-h-0 [&_.ant-tabs-nav]:!mb-0 [&_.ant-tabs-tab]:!text-[11px] [&_.ant-tabs-tab]:!px-2.5 [&_.ant-tabs-tab-active]:!border-t-2 [&_.ant-tabs-tab-active]:!border-t-[#FF9933]"
                    items={form.sorgular.map((s) => ({
                      key: s.id,
                      label: `Sorgu ${s.sirano}`,
                      children: (
                        <div className="!h-full !overflow-y-auto !pt-2">
                          <Input.TextArea
                            size="small"
                            autoSize={{ minRows: 6, maxRows: 16 }}
                            className="!text-[11px] !font-mono"
                            placeholder="SELECT * FROM stok_hareket_fisi WHERE id = :id"
                            value={s.sorguMetni}
                            onChange={(e) => sorguGuncelle(s.id, { sorguMetni: e.target.value })}
                          />
                        </div>
                      ),
                    }))}
                  />
                </div>
              ),
            },
            {
              key: 'tasarim',
              label: 'Tasarım',
              children: (
                <div className="!h-full !flex !flex-col !overflow-hidden">
                  <SayfaAyariPanel sayfa={sayfa} onChange={(p) => formGuncelle((f) => ({ ...f, sayfa: { ...f.sayfa, ...p } }))} />
                  <div className="!flex-1 !min-h-0 !flex">
                    <div className="!flex-1 !min-h-0 !overflow-auto !bg-[#e2e5ea] !p-4">
                      <div
                        className="!mx-auto !bg-white"
                        style={{
                          width: kagitGenislik,
                          minHeight: kagitYukseklik,
                          padding: `${sayfa.kenarUst * OLCU}px ${sayfa.kenarSag * OLCU}px ${sayfa.kenarAlt * OLCU}px ${sayfa.kenarSol * OLCU}px`,
                          boxShadow: '0 0 0 1px #cbd5e1, 0 4px 12px rgba(0,0,0,0.08)',
                        }}
                      >
                        <div className="!flex !flex-col !gap-1.5">
                          {form.layout.map((b, i) => (
                            <BandSection
                              key={b.id}
                              band={b}
                              index={i}
                              total={form.layout.length}
                              secili={secili}
                              onSec={() => setSecili({ tur: 'band', bandId: b.id })}
                              onSeciliHucre={(bandId, satirId, hucreId) => setSecili({ tur: 'hucre', bandId, satirId, hucreId })}
                              onYukari={() => bandTasi(b.id, -1)}
                              onAsagi={() => bandTasi(b.id, 1)}
                              onSil={() => bandSil(b.id)}
                              onSelectKolon={(kolonId) => setSecili({ tur: 'kolon', bandId: b.id, kolonId })}
                              onDropKolon={(e, kolonId) => kolonDrop(e, b.id, kolonId)}
                            />
                          ))}
                          {kullanilabilirBandTipleri.length > 0 && (
                            <div className="!flex !items-center !gap-1 !py-1">
                              <span className="!text-[10px] !text-[#6b7280]">Band ekle:</span>
                              {kullanilabilirBandTipleri.map((t) => (
                                <Button key={t} size="small" className="!h-5 !text-[10px]" onClick={() => bandEkle(t)}>
                                  + {bandTipiAdlari[t]}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="!w-64 !border-l !border-gray-300 !bg-[#f7f7f7] !flex !flex-col !overflow-hidden">
                      <div className="!flex-1 !overflow-y-auto">
                        <div className="!px-2 !py-1.5 !text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
                          Alanlar (sürükle)
                        </div>
                        <div className="!px-1.5 !pb-2">
                          {alanSecenekler.length === 0 ? (
                            <div className="!text-[10px] !text-[#9ca3af] !p-1.5">
                              Sorgu kolonları buraya düşecek (backend fazında).
                            </div>
                          ) : (
                            <div className="!flex !flex-col !gap-1">
                              {alanSecenekler.map((a) => (
                                <div
                                  key={a.value}
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('text/plain', a.value)
                                    e.dataTransfer.effectAllowed = 'copy'
                                  }}
                                  className="!px-1.5 !py-1 !bg-white !border !border-gray-200 !rounded-sm !text-[10px] !cursor-grab !active:cursor-grabbing hover:!border-[#FF9933]"
                                >
                                  <Tag color="orange" className="!m-0">
                                    {a.label}
                                  </Tag>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="!border-t !border-gray-200 !my-2" />

                        <div className="!px-2 !py-1.5 !text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
                          Özellikler
                        </div>
                        <Ozellikler
                          form={form}
                          secili={secili}
                          alanSecenekler={alanSecenekler}
                          onHucrePatch={hucrePatch}
                          onStilPatch={stilPatch}
                          onKolonPatch={kolonGuncelle}
                          onKolonEkleAlan={kolonEkleAlan}
                          onKolonSil={kolonSil}
                          onSorguSec={sorguSec}
                          onSeciliKolon={(bandId, kolonId) => setSecili({ tur: 'kolon', bandId, kolonId })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}
