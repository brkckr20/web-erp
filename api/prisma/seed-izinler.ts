import { loadEnvFile } from 'node:process'
import { PrismaClient } from '@prisma/client'
import {
  EKRAN_ISLEMLERI,
  EKRAN_TANIMLARI,
  ekranIzinKodu,
} from '../src/rol/ekran-tanimi'

try {
  loadEnvFile('.env')
} catch {
  // .env yoksa mevcut ortam değişkenleri kullanılır
}

const prisma = new PrismaClient()

const ISLEM_ADLARI: Record<string, string> = {
  goruntule: 'Görüntüle',
  kaydet: 'Kaydet',
  sil: 'Sil',
  iptal: 'İptal',
}

// Ekran izni yoksa ekler, adı değişmişse günceller. Tekrar çalıştırılabilir.
async function ekranIzinleriniYaz(): Promise<number> {
  let yazilan = 0
  for (const modul of EKRAN_TANIMLARI) {
    for (const ekran of modul.ekranlar) {
      for (const islem of EKRAN_ISLEMLERI) {
        const kod = ekranIzinKodu(modul.modul, ekran.key, islem)
        const ad = `${modul.ad} - ${ekran.ad} - ${ISLEM_ADLARI[islem]}`
        await prisma.izin.upsert({
          where: { kod },
          create: { kod, ad },
          update: { ad },
        })
        yazilan++
      }
    }
  }
  return yazilan
}

// Mevcut modül izinlerinden ekran izinlerine geçiş: rol "stok.goruntule" alıyorsa
// stok modülündeki tüm ekranların "goruntule" iznini de alır (mevcut yetki korunur).
async function rolGecisiniUygula(): Promise<{ rol: string; eklenen: number }[]> {
  const sonuc: { rol: string; eklenen: number }[] = []
  const ekranIzinleri = await prisma.izin.findMany({
    where: { kod: { startsWith: 'ekran.' } },
    select: { id: true, kod: true },
  })
  const idByKod = new Map(ekranIzinleri.map((i) => [i.kod, i.id]))

  const roller = await prisma.rol.findMany({
    include: { izinler: { select: { izin: { select: { kod: true } } } } },
  })

  for (const rol of roller) {
    const mevcut = new Set(rol.izinler.map((r) => r.izin.kod))
    const eklenecek: number[] = []
    for (const kod of mevcut) {
      if (kod.startsWith('ekran.')) continue
      const [modul, islem] = kod.split('.')
      if (!modul || !islem || !(EKRAN_ISLEMLERI as readonly string[]).includes(islem)) continue
      for (const tanim of EKRAN_TANIMLARI.filter((t) => t.modul === modul)) {
        for (const ekran of tanim.ekranlar) {
          const ekranKod = ekranIzinKodu(modul, ekran.key, islem)
          const id = idByKod.get(ekranKod)
          if (id && !mevcut.has(ekranKod)) {
            mevcut.add(ekranKod)
            eklenecek.push(id)
          }
        }
      }
    }
    if (eklenecek.length > 0) {
      await prisma.rolIzin.createMany({
        data: eklenecek.map((izinId) => ({ rolId: rol.id, izinId })),
      })
    }
    sonuc.push({ rol: rol.ad, eklenen: eklenecek.length })
  }
  return sonuc
}

async function main() {
  const yazilan = await ekranIzinleriniYaz()
  const rolSonuc = await rolGecisiniUygula()
  const toplam = await prisma.izin.count()
  console.log(`Ekran izinleri yazıldı: ${yazilan} | tablodaki toplam izin: ${toplam}`)
  for (const r of rolSonuc) {
    console.log(`  ${r.rol}: +${r.eklenen} ekran izni`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
