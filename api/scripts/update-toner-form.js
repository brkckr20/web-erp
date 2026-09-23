const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const prisma = new PrismaClient()

async function main() {
  const logoPath = path.join(__dirname, '..', '..', 'report_templates', 'NakosanLogoBase64.txt')
  const logoBase64 = fs.readFileSync(logoPath, 'utf8').trim()

  const sorgular = [
    {
      id: 'S1',
      sirano: 1,
      ad: 'İrsaliye Başlık',
      sorguMetni: `SELECT
        i.irsaliye_no AS irsaliyeNo,
        i.irsaliye_tarihi AS irsaliyeTarihi,
        i.aciklama,
        ch.ad AS cariAd,
        ch.ticari_unvani AS cariUnvan
      FROM irsaliye i
      LEFT JOIN cari_hesap ch ON ch.id = i.cari_hesap_id
      WHERE i.id = :id`,
      kolonlar: ['irsaliyeNo', 'irsaliyeTarihi', 'aciklama', 'cariAd', 'cariUnvan'],
      satirlar: [],
    },
    {
      id: 'S2',
      sirano: 2,
      ad: 'İrsaliye Kalemleri',
      sorguMetni: `SELECT
        m.kod AS malzemeKod,
        m.ad AS malzemeAd,
        ik.miktar,
        ik.adet,
        ik.aciklama
      FROM irsaliye_kalem ik
      LEFT JOIN malzeme m ON m.id = ik.malzeme_id
      WHERE ik.irsaliye_id = :id`,
      kolonlar: ['malzemeKod', 'malzemeAd', 'miktar', 'adet', 'aciklama'],
      satirlar: [],
    },
  ]

  const layout = [
    {
      id: 'band-header',
      tip: 'ust-bilgi',
      ad: 'Başlık',
      yukseklik: 42,
      elemanlar: [
        // Logo - sol üst
        {
          id: 'logo',
          x: 0,
          y: 0,
          genislik: 30,
          yukseklik: 20,
          bilesen: 'resim',
          deger: logoBase64,
          stil: {},
        },
        // "Toner Çıkış Formu" başlığı - orta
        {
          id: 'baslik',
          x: 38,
          y: 5,
          genislik: 110,
          yukseklik: 12,
          bilesen: 'metin',
          deger: 'Toner Çıkış Formu',
          stil: { fontBoyutu: 18, kalin: true, hizalama: 'orta' },
        },
        // Bilgi kutusu - sağ üst (tablo şeklinde)
        // Tarih etiket
        {
          id: 'tarih-etiket',
          x: 155,
          y: 0,
          genislik: 18,
          yukseklik: 7,
          bilesen: 'metin',
          deger: 'Tarih:',
          stil: { fontBoyutu: 8, kalin: true, arkaPlan: '#e0e0e0' },
        },
        // Tarih değer
        {
          id: 'tarih-deger',
          x: 173,
          y: 0,
          genislik: 22,
          yukseklik: 7,
          bilesen: 'veri',
          alan: 'S1.irsaliyeTarihi',
          stil: { fontBoyutu: 8, format: 'tarih-gun-ay-yil' },
        },
        // İrs. No etiket
        {
          id: 'irsno-etiket',
          x: 155,
          y: 7,
          genislik: 18,
          yukseklik: 7,
          bilesen: 'metin',
          deger: 'İrs. No:',
          stil: { fontBoyutu: 8, kalin: true, arkaPlan: '#e0e0e0' },
        },
        // İrs. No değer
        {
          id: 'irsno-deger',
          x: 173,
          y: 7,
          genislik: 22,
          yukseklik: 7,
          bilesen: 'veri',
          alan: 'S1.irsaliyeNo',
          stil: { fontBoyutu: 8 },
        },
        // Fiş No etiket
        {
          id: 'fisno-etiket',
          x: 155,
          y: 14,
          genislik: 18,
          yukseklik: 7,
          bilesen: 'metin',
          deger: 'Fiş No :',
          stil: { fontBoyutu: 8, kalin: true, arkaPlan: '#e0e0e0' },
        },
        // Fiş No değer
        {
          id: 'fisno-deger',
          x: 173,
          y: 14,
          genislik: 22,
          yukseklik: 7,
          bilesen: 'veri',
          alan: 'S1.irsaliyeNo',
          stil: { fontBoyutu: 8 },
        },
      ],
    },
    {
      id: 'band-sayin',
      tip: 'alanlar',
      ad: 'Sayın Bölümü',
      yukseklik: 16,
      elemanlar: [
        // "Sayın" etiketi (turuncu arka plan)
        {
          id: 'sayin-etiket',
          x: 0,
          y: 0,
          genislik: 16,
          yukseklik: 6,
          bilesen: 'metin',
          deger: 'Sayın',
          stil: { fontBoyutu: 9, kalin: true, arkaPlan: '#c47a32' },
        },
        // Cari Ticari Ünvanı
        {
          id: 'cari-unvan',
          x: 0,
          y: 7,
          genislik: 190,
          yukseklik: 4,
          bilesen: 'veri',
          alan: 'S1.cariUnvan',
          stil: { fontBoyutu: 9 },
        },
        // Cari Ad
        {
          id: 'cari-ad',
          x: 0,
          y: 11,
          genislik: 190,
          yukseklik: 4,
          bilesen: 'veri',
          alan: 'S1.cariAd',
          stil: { fontBoyutu: 9 },
        },
      ],
    },
    {
      id: 'band-tablo',
      tip: 'kalem-tablo',
      ad: 'Ürünler Tablosu',
      yukseklik: 70,
      sorguId: 'S2',
      baslikArkaPlan: '#c47a32',
      cizgiStili: 'yatay',
      tabloKolonlari: [
        {
          id: 'kol-malzeme-kod',
          alan: 'S2.malzemeKod',
          baslik: 'Malzeme Kodu',
          genislik: 30,
          hizalama: 'sol',
        },
        {
          id: 'kol-malzeme-ad',
          alan: 'S2.malzemeAd',
          baslik: 'Malzeme Adı',
          genislik: 95,
          hizalama: 'sol',
        },
        {
          id: 'kol-miktar',
          alan: 'S2.miktar',
          baslik: 'Miktar',
          genislik: 20,
          hizalama: 'sag',
          format: 'sayi-2',
        },
        {
          id: 'kol-aciklama',
          alan: 'S2.aciklama',
          baslik: 'Açıklama',
          genislik: 45,
          hizalama: 'sol',
        },
      ],
      elemanlar: [],
    },
    {
      id: 'band-aciklama',
      tip: 'alanlar',
      ad: 'Genel Açıklamalar',
      yukseklik: 28,
      elemanlar: [
        // "Genel Açıklamalar" etiketi (turuncu arka plan)
        {
          id: 'genel-aciklama-etiket',
          x: 0,
          y: 0,
          genislik: 40,
          yukseklik: 6,
          bilesen: 'metin',
          deger: 'Genel Açıklamalar',
          stil: { fontBoyutu: 9, kalin: true, arkaPlan: '#c47a32' },
        },
        // Açıklama alanı
        {
          id: 'genel-aciklama-deger',
          x: 0,
          y: 7,
          genislik: 190,
          yukseklik: 20,
          bilesen: 'veri',
          alan: 'S1.aciklama',
          stil: { fontBoyutu: 9 },
        },
      ],
    },
    {
      id: 'band-footer',
      tip: 'alanlar',
      ad: 'Footer',
      yukseklik: 6,
      elemanlar: [
        // Sol alt: Şirket adı
        {
          id: 'footer-sirket',
          x: 0,
          y: 0,
          genislik: 150,
          yukseklik: 5,
          bilesen: 'metin',
          deger: 'NAKOSAN NAKIŞ KONFEKSİYON TEKSTİL SAN. VE TİC. A.S',
          stil: { fontBoyutu: 7 },
        },
        // Sağ alt: Tarih
        {
          id: 'footer-tarih',
          x: 155,
          y: 0,
          genislik: 35,
          yukseklik: 5,
          bilesen: 'metin',
          deger: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          stil: { fontBoyutu: 7, hizalama: 'sag' },
        },
      ],
    },
  ]

  const sayfa = {
    boyut: 'A5',
    yon: 'yatay',
    kenarUst: 10,
    kenarAlt: 10,
    kenarSol: 10,
    kenarSag: 10,
  }

  const layoutJson = JSON.stringify({ sorgular, layout, sayfa })

  await prisma.formSabloni.update({
    where: { id: 2004 },
    data: { layoutJson },
  })

  console.log('Layout güncellendi!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
