'use client'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface KullaniciOption {
  id: number
  kod: string
  girisKodu: string | null
  ad: string
}

export interface LoginResult {
  accessToken: string
  kullanici: {
    id: number
    kod: string
    girisKodu: string | null
    ad: string
  }
}

export const authApi = {
  async kullanicilar(): Promise<KullaniciOption[]> {
    const res = await fetch(`${BASE_URL}/auth/kullanicilar`)
    if (!res.ok) throw new Error('Kullanıcı listesi alınamadı')
    return res.json()
  },

  async login(kullaniciAdi: string, sifre: string, beniHatirlat?: boolean): Promise<LoginResult> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kullaniciAdi, sifre, beniHatirlat }),
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(body || 'Giriş başarısız')
    }
    return res.json()
  },
}
