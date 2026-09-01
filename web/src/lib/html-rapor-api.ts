const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface HtmlRaporTemplate {
  id: string
  ad: string
  dosya: string
  ekranTuru: string
  aciklama?: string
  sayfaBoyut: string
  sayfaYon: string
  sorgular: Array<{ sirano: number; ad: string; sorguMetni: string }>
  html?: string
}

export const htmlRaporApi = {
  async list(ekranTuru?: string): Promise<HtmlRaporTemplate[]> {
    const params = ekranTuru ? `?ekranTuru=${encodeURIComponent(ekranTuru)}` : ''
    const res = await fetch(`${API_BASE}/rapor/html-templates${params}`)
    if (!res.ok) throw new Error('HTML şablonları yüklenemedi')
    return res.json()
  },

  async create(input: {
    id: string; ad: string; ekranTuru: string; aciklama?: string;
    sayfaBoyut: string; sayfaYon: string; genislik: number; yukseklik: number;
  }): Promise<{ success: boolean; template: HtmlRaporTemplate }> {
    const res = await fetch(`${API_BASE}/rapor/html-templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Şablon oluşturulamadı' }))
      throw new Error(err.message || 'Şablon oluşturulamadı')
    }
    return res.json()
  },

  async getById(id: string): Promise<HtmlRaporTemplate & { html: string; logoBase64: string }> {
    const res = await fetch(`${API_BASE}/rapor/html-template/${id}`)
    if (!res.ok) throw new Error('HTML şablonu yüklenemedi')
    return res.json()
  },

  async getData(templateId: string, kayitId: number): Promise<Record<string, unknown>[]> {
    const res = await fetch(`${API_BASE}/rapor/html-template-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId, kayitId }),
    })
    if (!res.ok) throw new Error('Rapor verisi yüklenemedi')
    return res.json()
  },

  async update(id: string, html: string): Promise<{ success: boolean; dosya: string }> {
    const res = await fetch(`${API_BASE}/rapor/html-template/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html }),
    })
    if (!res.ok) throw new Error('HTML şablonu kaydedilemedi')
    return res.json()
  },

  async updateQueries(id: string, sorgular: Array<{ sirano: number; ad: string; sorguMetni: string }>): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/rapor/html-template/${id}/queries`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sorgular }),
    })
    if (!res.ok) throw new Error('SQL sorguları kaydedilemedi')
    return res.json()
  },
}
