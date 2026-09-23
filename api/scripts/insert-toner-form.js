const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const sorgular = [
    {
      id: 'S1',
      sirano: 1,
      ad: 'İrsaliye Başlık',
      sorguMetni: `SELECT
        i.irsaliye_no,
        i.irsaliye_tarihi,
        i.aciklama,
        ch.ad AS cariAd,
        ch.ticari_unvani AS cariUnvan,
        d.ad AS depoAd
      FROM irsaliye i
      LEFT JOIN cari_hesap ch ON ch.id = i.cari_hesap_id
      LEFT JOIN depo d ON d.id = i.depo_id
      WHERE i.id = :id`,
      kolonlar: ['irsaliyeNo', 'irsaliyeTarihi', 'aciklama', 'cariAd', 'cariUnvan', 'depoAd'],
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
      yukseklik: 38,
      elemanlar: [
        // Logo
        {
          id: 'logo',
          x: 0,
          y: 2,
          genislik: 35,
          yukseklik: 22,
          bilesen: 'resim',
          deger: '', // base64 logo buraya eklenecek
          stil: {},
        },
        // "Toner Çıkış Formu" başlığı
        {
          id: 'baslik',
          x: 42,
          y: 8,
          genislik: 100,
          yukseklik: 12,
          bilesen: 'metin',
          deger: 'Toner Çıkış Formu',
          stil: { fontBoyutu: 16, kalin: true, hizalama: 'orta' },
        },
        // "Tarih:" etiketi
        {
          id: 'tarih-etiket',
          x: 148,
          y: 2,
          genislik: 20,
          yukseklik: 7,
          bilesen: 'metin',
          deger: 'Tarih:',
          stil: { fontBoyutu: 8, kalin: true, arkaPlan: '#d9d9d9' },
        },
        // Tarih değeri
        {
          id: 'tarih-deger',
          x: 168,
          y: 2,
          genislik: 22,
          yukseklik: 7,
          bilesen: 'veri',
          alan: 'S1.irsaliyeTarihi',
          stil: { fontBoyutu: 8, format: 'tarih-gun-ay-yil' },
        },
        // "İrs. No:" etiketi
        {
          id: 'irsno-etiket',
          x: 148,
          y: 9,
          genislik: 20,
          yukseklik: 7,
          bilesen: 'metin',
          deger: 'İrs. No:',
          stil: { fontBoyutu: 8, kalin: true, arkaPlan: '#d9d9d9' },
        },
        // İrs. No değeri
        {
          id: 'irsno-deger',
          x: 168,
          y: 9,
          genislik: 22,
          yukseklik: 7,
          bilesen: 'veri',
          alan: 'S1.irsaliyeNo',
          stil: { fontBoyutu: 8 },
        },
        // "Fiş No:" etiketi
        {
          id: 'fisno-etiket',
          x: 148,
          y: 16,
          genislik: 20,
          yukseklik: 7,
          bilesen: 'metin',
          deger: 'Fiş No :',
          stil: { fontBoyutu: 8, kalin: true, arkaPlan: '#d9d9d9' },
        },
        // Fiş No değeri
        {
          id: 'fisno-deger',
          x: 168,
          y: 16,
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
      yukseklik: 18,
      elemanlar: [
        // "Sayın" etiketi (turuncu arka plan)
        {
          id: 'sayin-etiket',
          x: 0,
          y: 0,
          genislik: 18,
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
          genislik: 180,
          yukseklik: 5,
          bilesen: 'veri',
          alan: 'S1.cariUnvan',
          stil: { fontBoyutu: 9 },
        },
        // Cari Ad (adres olarak kullanılıyor)
        {
          id: 'cari-ad',
          x: 0,
          y: 12,
          genislik: 180,
          yukseklik: 5,
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
      yukseklik: 80,
      sorguId: 'S2',
      baslikArkaPlan: 'gri',
      cizgiStili: 'yatay',
      tabloKolonlari: [
        {
          id: 'kol-malzeme-kod',
          alan: 'S2.malzemeKod',
          baslik: 'Malzeme Kodu',
          genislik: 35,
          hizalama: 'sol',
        },
        {
          id: 'kol-malzeme-ad',
          alan: 'S2.malzemeAd',
          baslik: 'Malzeme Adı',
          genislik: 85,
          hizalama: 'sol',
        },
        {
          id: 'kol-miktar',
          alan: 'S2.miktar',
          baslik: 'Miktar',
          genislik: 25,
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
      yukseklik: 30,
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
          yukseklik: 22,
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

  // Check if already exists
  const existing = await prisma.formSabloni.findFirst({ where: { kod: 'TONERCIKIS' } })
  if (existing) {
    console.log('Zaten mevcut, güncelleniyor... id:', existing.id)
    await prisma.formSabloni.update({
      where: { id: existing.id },
      data: {
        ad: 'Toner Çıkış Formu',
        ekranTuru: 'Satış İrsaliyeleri',
        layoutJson,
        aktif: true,
      },
    })
    console.log('Güncellendi!')
  } else {
    const result = await prisma.formSabloni.create({
      data: {
        kod: 'TONERCIKIS',
        ad: 'Toner Çıkış Formu',
        ekranTuru: 'Satış İrsaliyeleri',
        layoutJson,
        aktif: true,
      },
    })
    console.log('Oluşturuldu! id:', result.id)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
