import type { MetadataRoute } from 'next'

const ikon = (src: string, sizes: string, purpose: 'any' | 'maskable') => ({
  src,
  sizes,
  type: 'image/png',
  purpose,
})

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Tekstil ERP',
    short_name: 'Tekstil ERP',
    description: 'Tekstil Malzeme ve Üretim Yönetim Sistemi',
    lang: 'tr',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'any',
    background_color: '#121820',
    theme_color: '#121820',
    categories: ['business', 'productivity', 'inventory'],
    icons: [
      ikon('/icons/icon-192.png', '192x192', 'any'),
      ikon('/icons/icon-512.png', '512x512', 'any'),
      ikon('/icons/icon-maskable-192.png', '192x192', 'maskable'),
      ikon('/icons/icon-maskable-512.png', '512x512', 'maskable'),
    ],
  }
}
