'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Select, Button, Spin, Typography, App, Modal, Input } from 'antd'
import { SaveOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { htmlRaporApi, type HtmlRaporTemplate } from '@/lib/html-rapor-api'

function formatDateTR(date: Date): string {
  const gun = String(date.getDate()).padStart(2, '0')
  const ay = String(date.getMonth() + 1).padStart(2, '0')
  const yil = date.getFullYear()
  return `${gun}.${ay}.${yil}`
}

function replacePlaceholders(html: string, data: Record<string, unknown>): string {
  let result = html
  for (const [key, value] of Object.entries(data)) {
    if (key === 'kalemler') continue
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    const display = value === null || value === undefined ? '' : String(value)
    result = result.replace(regex, display)
  }
  return result
}

function buildKalemRows(kalemler: Record<string, string>[]): string {
  return kalemler
    .map(
      (k) => `<tr>
        <td>${k.malzemeKod ?? ''}</td>
        <td>${k.malzemeAd ?? ''}</td>
        <td class="right">${k.miktar ?? ''}</td>
        <td>${k.aciklama ?? ''}</td>
      </tr>`,
    )
    .join('')
}

function extractPlaceholders(html: string): string[] {
  const matches = html.match(/\{\{(\w+)\}\}/g) ?? []
  const unique = [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))]
  return unique.filter((p) => p !== 'kalemler')
}

export default function HtmlSablonEditor() {
  const { message } = App.useApp()
  const [templates, setTemplates] = useState<HtmlRaporTemplate[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [logoBase64, setLogoBase64] = useState('')
  const previewRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [yeniModalAcik, setYeniModalAcik] = useState(false)
  const [yeniForm, setYeniForm] = useState({
    id: '',
    ad: '',
    ekranTuru: '',
    aciklama: '',
    sayfaBoyut: 'A5',
    sayfaYon: 'yatay',
    genislik: 190,
    yukseklik: 128,
  })

  const placeholders = extractPlaceholders(html)
  const placeholderValuesRef = useRef<Record<string, string>>({})
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({})
  const [sorgular, setSorgular] = useState<Array<{ sirano: number; ad: string; sorguMetni: string }>>([])
  const [kalemSample, setKalemSample] = useState<Record<string, string>[]>(
    Array(5).fill({ malzemeKod: '', malzemeAd: '', miktar: '', aciklama: '' }),
  )

  const loadTemplates = useCallback(async () => {
    try {
      const list = await htmlRaporApi.list()
      setTemplates(list)
      if (list.length > 0 && !selectedId) {
        setSelectedId(list[0].id)
      }
    } catch {
      message.error('Şablonlar yüklenemedi')
    }
  }, [selectedId])

  const loadTemplate = useCallback(async (id: string) => {
    if (!id) return
    setLoading(true)
    try {
      const tmpl = await htmlRaporApi.getById(id)
      setHtml(tmpl.html)
      setLogoBase64(tmpl.logoBase64 || '')
      setSorgular(tmpl.sorgular || [])
      const phs = extractPlaceholders(tmpl.html)
      const vals: Record<string, string> = {}
      phs.forEach((p) => {
        vals[p] = placeholderValuesRef.current[p] ?? ''
      })
      placeholderValuesRef.current = vals
      setPlaceholderValues(vals)
    } catch {
      message.error('Şablon yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  useEffect(() => {
    if (selectedId) loadTemplate(selectedId)
  }, [selectedId, loadTemplate])

  const updatePreview = useCallback(() => {
    if (!previewRef.current) return
    const logoSrc = logoBase64 || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    const dataWithLogo = { ...placeholderValues, logo: logoSrc, bugun: formatDateTR(new Date()) }
    let rendered = replacePlaceholders(html, dataWithLogo)
    rendered = rendered.replace(/\{\{kalemler\}\}/g, buildKalemRows(kalemSample))
    previewRef.current.innerHTML = rendered
  }, [html, placeholderValues, kalemSample, logoBase64])

  useEffect(() => {
    updatePreview()
  }, [updatePreview])

  const handleSave = async () => {
    if (!selectedId) return
    setSaving(true)
    try {
      await Promise.all([
        htmlRaporApi.update(selectedId, html),
        htmlRaporApi.updateQueries(selectedId, sorgular),
      ])
      message.success('Şablon kaydedildi')
    } catch {
      message.error('Kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  const handleSorguChange = (index: number, field: 'ad' | 'sorguMetni', value: string) => {
    setSorgular((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const addSorgu = () => {
    setSorgular((prev) => [...prev, { sirano: prev.length + 1, ad: '', sorguMetni: '' }])
  }

  const removeSorgu = (index: number) => {
    setSorgular((prev) => prev.filter((_, i) => i !== index))
  }

  const handleYeniSablon = async () => {
    if (!yeniForm.id || !yeniForm.ad || !yeniForm.ekranTuru) {
      message.warning('ID, Ad ve Ekran Turu zorunludur')
      return
    }
    setLoading(true)
    try {
      const res = await htmlRaporApi.create(yeniForm)
      setYeniModalAcik(false)
      setYeniForm({ id: '', ad: '', ekranTuru: '', aciklama: '', sayfaBoyut: 'A5', sayfaYon: 'yatay', genislik: 190, yukseklik: 128 })
      await loadTemplates()
      setSelectedId(res.template.id)
      message.success('Şablon oluşturuldu')
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Oluşturulamadı')
    } finally {
      setLoading(false)
    }
  }

  const handlePlaceholderChange = (key: string, value: string) => {
    setPlaceholderValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleKalemChange = (index: number, field: string, value: string) => {
    setKalemSample((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const addKalemRow = () => {
    setKalemSample((prev) => [...prev, { malzemeKod: '', malzemeAd: '', miktar: '', aciklama: '' }])
  }

  const removeKalemRow = (index: number) => {
    setKalemSample((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <Spin spinning={loading || saving}>
      <div className="!px-3 !py-2 !flex !flex-col !h-full !overflow-hidden" style={{ height: 'calc(100vh - 45px)' }}>
        {/* Üst Bar */}
        <div className="!flex !items-center !gap-2 !mb-2 !flex-shrink-0">
          <span className="!text-[12px] !text-[#6b7280]">Şablon:</span>
          <Select
            size="small"
            value={selectedId || undefined}
            onChange={setSelectedId}
            className="!w-64 !text-[12px]"
            options={templates.map((t) => ({ value: t.id, label: `${t.ad} (${t.ekranTuru})` }))}
          />
          <Button size="small" icon={<SaveOutlined />} type="primary" onClick={handleSave} className="!text-[12px]">
            Kaydet
          </Button>
          <Button size="small" icon={<EyeOutlined />} onClick={updatePreview} className="!text-[12px]">
            Önizle
          </Button>
          <Button size="small" icon={<PlusOutlined />} onClick={() => setYeniModalAcik(true)} className="!text-[12px]">
            Yeni Şablon
          </Button>
        </div>

        {/* Ana İçerik */}
        <div className="!flex !gap-2 !flex-1 !min-h-0">
          {/* Sol: Kod Editörü */}
          <div className="!flex-1 !flex !flex-col !min-w-0">
            <Typography.Text className="!text-[11px] !text-[#6b7280] !mb-1">HTML Kodu</Typography.Text>
            <textarea
              ref={textareaRef}
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="!flex-1 !font-mono !text-[11px] !p-2 !border !border-gray-300 !rounded !bg-[#1e1e1e] !text-[#d4d4d4] !resize-none !outline-none focus:!border-blue-500"
              spellCheck={false}
            />
          </div>

          {/* Sağ: Önizleme */}
          <div className="!flex-1 !flex !flex-col !min-w-0">
            <Typography.Text className="!text-[11px] !text-[#6b7280] !mb-1">Önizleme</Typography.Text>
            <div className="!flex-1 !border !border-gray-300 !rounded !bg-white !overflow-auto">
              <div ref={previewRef} className="!p-2" />
            </div>
          </div>

          {/* En Sağ: Placeholder Paneli */}
          <div className="!w-64 !flex !flex-col !min-w-0">
            <Typography.Text className="!text-[11px] !text-[#6b7280] !mb-1">Veri Alanları</Typography.Text>
            <div className="!flex-1 !border !border-gray-300 !rounded !p-2 !overflow-auto !space-y-1.5">
              {placeholders.length === 0 && (
                <Typography.Text type="secondary" className="!text-[11px]">
                  Placeholder bulunamadı
                </Typography.Text>
              )}
              {placeholders.map((ph) => (
                <div key={ph} className="!flex !items-center !gap-1">
                  <span className="!text-[10px] !text-[#6b7280] !w-24 !shrink-0 !truncate" title={ph}>
                    {ph}
                  </span>
                  <input
                    type="text"
                    value={placeholderValues[ph] ?? ''}
                    onChange={(e) => handlePlaceholderChange(ph, e.target.value)}
                    className="!flex-1 !text-[11px] !border !border-gray-300 !rounded !px-1 !py-0.5 !outline-none focus:!border-blue-500"
                    placeholder={`Değer gir: {{${ph}}}`}
                  />
                </div>
              ))}

              {/* Kalemler Tablosu */}
              <div className="!mt-2 !border-t !pt-2">
                <div className="!flex !items-center !justify-between !mb-1">
                  <Typography.Text className="!text-[11px] !font-semibold">Kalemler</Typography.Text>
                  <Button size="small" className="!text-[10px]" onClick={addKalemRow}>
                    + Satır
                  </Button>
                </div>
                {kalemSample.map((k, idx) => (
                  <div key={idx} className="!flex !gap-1 !mb-1 !items-center">
                    <input
                      type="text"
                      value={k.malzemeKod}
                      onChange={(e) => handleKalemChange(idx, 'malzemeKod', e.target.value)}
                      className="!w-16 !text-[10px] !border !border-gray-300 !rounded !px-1 !py-0.5 !outline-none"
                      placeholder="Kod"
                    />
                    <input
                      type="text"
                      value={k.malzemeAd}
                      onChange={(e) => handleKalemChange(idx, 'malzemeAd', e.target.value)}
                      className="!flex-1 !text-[10px] !border !border-gray-300 !rounded !px-1 !py-0.5 !outline-none"
                      placeholder="Ad"
                    />
                    <input
                      type="text"
                      value={k.miktar}
                      onChange={(e) => handleKalemChange(idx, 'miktar', e.target.value)}
                      className="!w-14 !text-[10px] !border !border-gray-300 !rounded !px-1 !py-0.5 !outline-none"
                      placeholder="Miktar"
                    />
                    <button
                      onClick={() => removeKalemRow(idx)}
                      className="!text-[10px] !text-red-500 hover:!text-red-700 !cursor-pointer"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Alt: SQL Sorguları */}
        <div className="!flex-shrink-0 !mt-2">
          <div className="!flex !items-center !gap-2 !mb-1">
            <Typography.Text className="!text-[11px] !text-[#6b7280]">SQL Sorguları</Typography.Text>
            <Button size="small" className="!text-[10px]" onClick={addSorgu}>+ Sorgu Ekle</Button>
          </div>
          <div className="!flex !gap-2 !mt-1 max-h-48 !overflow-auto">
            {sorgular.map((s, i) => (
              <div key={i} className="!flex-1 !border !border-gray-300 !rounded !p-1.5 !bg-gray-50 !flex !flex-col !min-w-64">
                <div className="!flex !items-center !gap-1 !mb-1">
                  <input
                    type="text"
                    value={s.ad}
                    onChange={(e) => handleSorguChange(i, 'ad', e.target.value)}
                    className="!flex-1 !text-[10px] !font-semibold !border !border-gray-300 !rounded !px-1 !py-0.5 !outline-none"
                    placeholder="Sorgu adı (ör: Başlık)"
                  />
                  <button
                    onClick={() => removeSorgu(i)}
                    className="!text-[10px] !text-red-500 hover:!text-red-700 !cursor-pointer"
                  >
                    x
                  </button>
                </div>
                <textarea
                  value={s.sorguMetni}
                  onChange={(e) => handleSorguChange(i, 'sorguMetni', e.target.value)}
                  className="!flex-1 !text-[9px] !font-mono !whitespace-pre-wrap !break-all !border !border-gray-300 !rounded !p-1 !outline-none focus:!border-blue-500 !min-h-[60px] !resize-y"
                  placeholder="SELECT ... FROM ... WHERE id = :id"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Yeni Şablon Modalı */}
      <Modal
        title="Yeni HTML Şablonu"
        open={yeniModalAcik}
        onOk={handleYeniSablon}
        onCancel={() => setYeniModalAcik(false)}
        okText="Oluştur"
        cancelText="İptal"
        width={500}
        destroyOnHidden
      >
        <div className="!flex !flex-col !gap-3 !mt-2">
          <div className="!flex !gap-2">
            <div className="!flex-1">
              <div className="!text-[11px] !text-[#6b7280] !mb-0.5">ID (benzersiz)</div>
              <Input size="small" value={yeniForm.id} onChange={(e) => setYeniForm((p) => ({ ...p, id: e.target.value }))} placeholder="ör: toner-cikis-2" />
            </div>
            <div className="!flex-1">
              <div className="!text-[11px] !text-[#6b7280] !mb-0.5">Şablon Adı</div>
              <Input size="small" value={yeniForm.ad} onChange={(e) => setYeniForm((p) => ({ ...p, ad: e.target.value }))} placeholder="ör: Toner Çıkış Formu 2" />
            </div>
          </div>
          <div>
            <div className="!text-[11px] !text-[#6b7280] !mb-0.5">Ekran Turu</div>
            <Input size="small" value={yeniForm.ekranTuru} onChange={(e) => setYeniForm((p) => ({ ...p, ekranTuru: e.target.value }))} placeholder="ör: Satış İrsaliyeleri" />
          </div>
          <div>
            <div className="!text-[11px] !text-[#6b7280] !mb-0.5">Açıklama</div>
            <Input size="small" value={yeniForm.aciklama} onChange={(e) => setYeniForm((p) => ({ ...p, aciklama: e.target.value }))} placeholder="Opsiyonel açıklama" />
          </div>
          <div className="!flex !gap-2">
            <div className="!flex-1">
              <div className="!text-[11px] !text-[#6b7280] !mb-0.5">Sayfa Boyutu</div>
              <Select
                size="small"
                value={yeniForm.sayfaBoyut}
                onChange={(v) => {
                  const dims: Record<string, { w: number; h: number }> = {
                    A4: { w: 297, h: 210 },
                    A5: { w: 210, h: 148 },
                    A6: { w: 148, h: 105 },
                    ozel: { w: yeniForm.genislik, h: yeniForm.yukseklik },
                  }
                  const d = dims[v] || dims.A5
                  setYeniForm((p) => ({ ...p, sayfaBoyut: v, genislik: d.w, yukseklik: d.h }))
                }}
                className="!w-full"
                options={[
                  { value: 'A4', label: 'A4 (297×210)' },
                  { value: 'A5', label: 'A5 (210×148)' },
                  { value: 'A6', label: 'A6 (148×105)' },
                  { value: 'ozel', label: 'Özel' },
                ]}
              />
            </div>
            <div className="!flex-1">
              <div className="!text-[11px] !text-[#6b7280] !mb-0.5">Yönlendirme</div>
              <Select
                size="small"
                value={yeniForm.sayfaYon}
                onChange={(v) => setYeniForm((p) => ({ ...p, sayfaYon: v }))}
                className="!w-full"
                options={[
                  { value: 'yatay', label: 'Yatay' },
                  { value: 'dikey', label: 'Dikey' },
                ]}
              />
            </div>
          </div>
          {yeniForm.sayfaBoyut === 'ozel' && (
            <div className="!flex !gap-2">
              <div className="!flex-1">
                <div className="!text-[11px] !text-[#6b7280] !mb-0.5">Genişlik (mm)</div>
                <Input size="small" type="number" value={yeniForm.genislik} onChange={(e) => setYeniForm((p) => ({ ...p, genislik: Number(e.target.value) }))} />
              </div>
              <div className="!flex-1">
                <div className="!text-[11px] !text-[#6b7280] !mb-0.5">Yükseklik (mm)</div>
                <Input size="small" type="number" value={yeniForm.yukseklik} onChange={(e) => setYeniForm((p) => ({ ...p, yukseklik: Number(e.target.value) }))} />
              </div>
            </div>
          )}
        </div>
      </Modal>
    </Spin>
  )
}
