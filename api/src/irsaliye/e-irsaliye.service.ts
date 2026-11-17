import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { PrismaService } from '../prisma/prisma.service'

// e-İrsaliye yalnızca çıkış tipli fişlerde oluşturulur (kullanıcı tarafıyla aynı liste).
const CIKIS_TIPLERI = new Set(['130', '131', '132', '135', '136', '137', '140', '99'])

const BELGE_TURU = 'E_IRSALIYE'
const VARSAYILAN_XSLT = 'Default.xslt'
const DURUM_OLUSTURULDU = 'Dosya Oluşturuldu'
const DURUM_ONAYLANDI = 'Onaylandı'

interface AktifKullanici {
  id: number
  kod: string
  ad: string
}

// XML 1.0'da geçersiz kontrol karakterlerini atar, metni kaçışlar.
function x(v: unknown): string {
  if (v == null) return ''
  return String(v)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function tarihMetni(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const g = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${g}`
}

function saatMetni(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

function sayiYaz(v: unknown): string {
  const n = Number(v)
  if (!Number.isFinite(n) || n === 0) return '0'
  return String(Math.round(n * 10000) / 10000)
}

// İlk dolu/geçerli sayıyı döner; boş ya da 0 ise null (satırda '-' gösterilir).
function ilkSayi(...degerler: unknown[]): number | null {
  for (const d of degerler) {
    if (d === null || d === undefined || String(d).trim() === '') continue
    const n = Number(d)
    if (Number.isFinite(n) && n !== 0) return n
  }
  return null
}

// Kalem bazlı ek alanlar UBL'de AdditionalItemIdentification ile taşınır;
// XSLT şablonları cbc:ID/@schemeID üzerinden okur.
function ekKimlik(sema: string, deger: unknown): string | null {
  if (deger === null || deger === undefined) return null
  const metin = String(deger).trim()
  if (!metin) return null
  return [
    '          <cac:AdditionalItemIdentification>',
    `            <cbc:ID schemeID="${sema}">${x(metin)}</cbc:ID>`,
    '          </cac:AdditionalItemIdentification>',
  ].join('\n')
}

// Ölçü birimi kodu UBL'de UN/ECE birim listesiyle taşınır.
function birimKodu(birim: string): string {
  const b = birim.toLowerCase()
  if (b.includes('kg')) return 'KGM'
  if (b.includes('mt')) return 'MTR'
  if (b.includes('ton') || b === 't') return 'TNE'
  return 'C62'
}

// Kalemin e-İrsaliyedeki miktarı: hesap birimi neyse o ölçü, yoksa ilk dolu ölçü.
function kalemMiktar(k: any): { miktar: number; birim: string } {
  const birim = String(k.olcuBirimi ?? '').toLowerCase()
  if (birim.includes('kg')) {
    return { miktar: Number(k.netAgirlik) || Number(k.brutAgirlik) || 0, birim }
  }
  if (birim.includes('mt')) {
    return { miktar: Number(k.netMetre) || Number(k.brutMetre) || 0, birim }
  }
  if (birim.includes('adet') || birim === 'ad') {
    return { miktar: Number(k.adet) || Number(k.miktar) || 0, birim: 'adet' }
  }
  const miktar = Number(k.netAgirlik) || Number(k.netMetre) || Number(k.adet) || Number(k.miktar) || 0
  return { miktar, birim }
}

function adresXml(adres: any, ulkeVarsayilan = 'Türkiye'): string {
  if (!adres) return ''
  const sokak = [adres.adres1, adres.adres2].filter(Boolean).join(' ')
  return [
    '        <cac:PostalAddress>',
    sokak ? `          <cbc:StreetName>${x(sokak)}</cbc:StreetName>` : null,
    adres.ilce ? `          <cbc:CitySubdivisionName>${x(adres.ilce)}</cbc:CitySubdivisionName>` : null,
    `          <cbc:CityName>${x(adres.sehir || '')}</cbc:CityName>`,
    adres.postaKodu ? `          <cbc:PostalZone>${x(adres.postaKodu)}</cbc:PostalZone>` : null,
    '          <cac:Country>',
    `            <cbc:Name>${x(adres.ulke || ulkeVarsayilan)}</cbc:Name>`,
    '          </cac:Country>',
    '        </cac:PostalAddress>',
  ]
    .filter(Boolean)
    .join('\n')
}

function vergiKimligi(vergiNo?: string | null): string {
  const no = String(vergiNo ?? '').trim()
  if (!no) return ''
  const sema = no.length === 11 ? 'TCKN' : 'VKN'
  return [
    '        <cac:PartyIdentification>',
    `          <cbc:ID schemeID="${sema}">${x(no)}</cbc:ID>`,
    '        </cac:PartyIdentification>',
  ].join('\n')
}

// UBL-TR DespatchAdvice (e-İrsaliye) belgesi. Simülasyon olduğu için imza
// (UBLExtensions / cac:Signature) eklenmez; şema yapısı korunur.
function xmlOlustur(params: {
  fis: any
  sirket: any
  cari: any
  eIrsaliyeNo: string
  ettn: string
  olusturma: Date
}): string {
  const { fis, sirket, cari, eIrsaliyeNo, ettn, olusturma } = params
  const sirketAdres = sirket?.adresler?.[0]
  const cariAdres = cari?.adresler?.find((a: any) => a.varsayilan) ?? cari?.adresler?.[0]
  const satirlar: string[] = []
  const kalemler = Array.isArray(fis.kalemler) ? fis.kalemler : []

  kalemler.forEach((k: any, i: number) => {
    const { miktar, birim } = kalemMiktar(k)
    const renk = k.varyant1Renk
    const renkBilgi = renk ? `Renk: ${renk.kod}${renk.ad ? ' - ' + renk.ad : ''}` : ''
    const aciklama = [k.aciklama, renkBilgi].filter(Boolean).join(' | ')
    satirlar.push(
      [
        '  <cac:DespatchLine>',
        `    <cbc:ID>${i + 1}</cbc:ID>`,
        (k.takipNo || k.partiNo) ? `    <cbc:Note>${x(k.takipNo || k.partiNo)}</cbc:Note>` : null,
        `    <cbc:DeliveredQuantity unitCode="${birimKodu(birim)}">${sayiYaz(miktar)}</cbc:DeliveredQuantity>`,
        '    <cac:OrderLine>',
        '      <cac:LineItem>',
        k.malzeme?.kod ? `        <cbc:ID>${x(k.malzeme.kod)}</cbc:ID>` : null,
        `        <cbc:Quantity unitCode="${birimKodu(birim)}">${sayiYaz(miktar)}</cbc:Quantity>`,
        '        <cac:Item>',
        `          <cbc:Name>${x(k.malzeme?.ad || k.malzeme?.kod || 'Malzeme')}</cbc:Name>`,
        aciklama ? `          <cbc:Description>${x(aciklama)}</cbc:Description>` : null,
        k.malzeme?.kod
          ? [
              '          <cac:SellersItemIdentification>',
              `            <cbc:ID>${x(k.malzeme.kod)}</cbc:ID>`,
              '          </cac:SellersItemIdentification>',
            ].join('\n')
          : null,
        renk
          ? [
              '          <cac:AdditionalItemIdentification>',
              `            <cbc:ID schemeID="RENK">${x(renk.kod)}</cbc:ID>`,
              '          </cac:AdditionalItemIdentification>',
            ].join('\n')
          : null,
        ekKimlik('SIPARIS_NO', k.siparis?.siparisNo),
        ekKimlik('MUSTERI_SIPARIS_NO', k.siparis?.musteriOrderNo),
        ekKimlik('BOYAHANE_RENK', k.boyahaneRenk?.kod),
        ekKimlik('KG', ilkSayi(k.netAgirlik, k.brutAgirlik)),
        ekKimlik('MT', ilkSayi(k.netMetre, k.brutMetre)),
        ekKimlik('ADET', ilkSayi(k.adet)),
        ekKimlik('TOP', ilkSayi(k.topSayisi)),
        '        </cac:Item>',
        '      </cac:LineItem>',
        '    </cac:OrderLine>',
        '  </cac:DespatchLine>',
      ]
        .filter(Boolean)
        .join('\n'),
    )
  })

  const nakliyeciVar = Boolean(fis.nakliyeciId || fis.nakliyeciUnvan || fis.nakliyeciPlaka)
  const shipment = nakliyeciVar
    ? [
        '  <cac:Shipment>',
        '    <cbc:ID>1</cbc:ID>',
        '    <cbc:ShippingPriorityLevelCode>1</cbc:ShippingPriorityLevelCode>',
        '    <cac:ShipmentStage>',
        '      <cbc:TransportModeCode>1</cbc:TransportModeCode>',
        '      <cac:CarrierParty>',
        fis.nakliyeciUnvan
          ? [
              '        <cac:PartyName>',
              `          <cbc:Name>${x(fis.nakliyeciUnvan)}</cbc:Name>`,
              '        </cac:PartyName>',
            ].join('\n')
          : null,
        fis.nakliyeciAd || fis.nakliyeciSoyad
          ? [
              '        <cac:Person>',
              fis.nakliyeciAd ? `          <cbc:FirstName>${x(fis.nakliyeciAd)}</cbc:FirstName>` : null,
              fis.nakliyeciSoyad ? `          <cbc:FamilyName>${x(fis.nakliyeciSoyad)}</cbc:FamilyName>` : null,
              fis.nakliyeciTc ? `          <cbc:NationalID>${x(fis.nakliyeciTc)}</cbc:NationalID>` : null,
              '        </cac:Person>',
            ]
              .filter(Boolean)
              .join('\n')
          : null,
        '      </cac:CarrierParty>',
        fis.nakliyeciPlaka
          ? [
              '      <cac:TransportMeans>',
              '        <cac:RoadTransport>',
              `          <cbc:LicensePlateID>${x(fis.nakliyeciPlaka)}</cbc:LicensePlateID>`,
              '        </cac:RoadTransport>',
              '      </cac:TransportMeans>',
            ].join('\n')
          : null,
        '    </cac:ShipmentStage>',
        '  </cac:Shipment>',
      ]
        .filter(Boolean)
        .join('\n')
    : null

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<DespatchAdvice xmlns="urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2"',
    '  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"',
    '  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">',
    '  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>',
    '  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>',
    '  <cbc:ProfileID>TEMELIRSALIYE</cbc:ProfileID>',
    `  <cbc:ID>${x(eIrsaliyeNo)}</cbc:ID>`,
    '  <cbc:CopyIndicator>false</cbc:CopyIndicator>',
    `  <cbc:UUID>${x(ettn)}</cbc:UUID>`,
    `  <cbc:IssueDate>${tarihMetni(olusturma)}</cbc:IssueDate>`,
    `  <cbc:IssueTime>${saatMetni(olusturma)}</cbc:IssueTime>`,
    '  <cbc:DespatchAdviceTypeCode>SEVK</cbc:DespatchAdviceTypeCode>',
    fis.aciklama ? `  <cbc:Note>${x(fis.aciklama)}</cbc:Note>` : null,
    fis.sevkNo
      ? [
          '  <cac:OrderReference>',
          `    <cbc:ID>${x(fis.sevkNo)}</cbc:ID>`,
          '  </cac:OrderReference>',
        ].join('\n')
      : null,
    '  <cac:DespatchSupplierParty>',
    '    <cac:Party>',
    vergiKimligi(sirket?.vergiNo),
    sirket?.ad
      ? [
          '      <cac:PartyName>',
          `        <cbc:Name>${x(sirket.ad)}</cbc:Name>`,
          '      </cac:PartyName>',
        ].join('\n')
      : null,
    '      <cac:PartyLegalEntity>',
    `        <cbc:RegistrationName>${x(sirket?.ad || '')}</cbc:RegistrationName>`,
    sirketAdres ? adresXml(sirketAdres) : null,
    '      </cac:PartyLegalEntity>',
    '    </cac:Party>',
    '  </cac:DespatchSupplierParty>',
    '  <cac:DeliveryCustomerParty>',
    '    <cac:Party>',
    vergiKimligi(cari?.vergiNo),
    cari?.ad
      ? [
          '      <cac:PartyName>',
          `        <cbc:Name>${x(cari.ad)}</cbc:Name>`,
          '      </cac:PartyName>',
        ].join('\n')
      : null,
    '      <cac:PartyLegalEntity>',
    `        <cbc:RegistrationName>${x(cari?.ticariUnvani || cari?.ad || '')}</cbc:RegistrationName>`,
    cariAdres ? adresXml(cariAdres) : null,
    '      </cac:PartyLegalEntity>',
    '    </cac:Party>',
    '  </cac:DeliveryCustomerParty>',
    shipment,
    ...satirlar,
    '</DespatchAdvice>',
  ]
    .filter(Boolean)
    .join('\n')
}

@Injectable()
export class EIrsaliyeService {
  constructor(private prisma: PrismaService) {}

  private async kullaniciLog(kullanici: AktifKullanici): Promise<string> {
    return `${kullanici.kod} - ${kullanici.ad}`
  }

  private async varsayilanXslt(kullaniciId: number): Promise<string> {
    const tasarim = await this.prisma.kullaniciTasarim.findFirst({
      where: { kullaniciId, aktif: true },
      orderBy: [{ varsayilan: 'desc' }, { sira: 'asc' }, { ad: 'asc' }],
      select: { xsltDosyaAdi: true },
    })
    return tasarim?.xsltDosyaAdi || VARSAYILAN_XSLT
  }

  // Numara: seri(3) + yıl(4) + 9 haneli sıra = 16 hane. Sayaç seri başına
  // atomik artar; yıl değişince 1'den başlar.
  private async numaraAl(tx: any, seriId: number, seri: string, yil: number): Promise<string> {
    const rows = await tx.$queryRaw`
      UPDATE [dbo].[kullanici_seri]
      SET [son_sira] = CASE WHEN [son_yil] = ${yil} THEN [son_sira] + 1 ELSE 1 END,
          [son_yil] = ${yil},
          [updated_at] = SYSUTCDATETIME()
      OUTPUT INSERTED.[son_sira] AS [son_sira]
      WHERE [id] = ${seriId}
    `
    const sonSira = Number((rows as any[])?.[0]?.son_sira ?? 0)
    if (!sonSira) throw new BadRequestException('e-İrsaliye numarası üretilemedi')
    if (sonSira > 999999999) throw new BadRequestException('Seri numaratörü sınırına ulaştı')
    return `${seri}${yil}${String(sonSira).padStart(9, '0')}`
  }

  private async fisYukle(id: number) {
    const fis = await this.prisma.irsaliye.findUnique({
      where: { id },
      include: {
        cariHesap: { include: { adresler: { orderBy: [{ varsayilan: 'desc' }, { kod: 'asc' }] } } },
        depo: true,
        nakliyeci: true,
        kalemler: {
          include: { malzeme: true, varyant1Renk: true, varyant2Renk: true, boyahaneRenk: true },
        },
      },
    })
    if (!fis) throw new NotFoundException('İrsaliye bulunamadı')

    // Sipariş no ve müşteri sipariş no kalemden skaler siparisKalemId ile bağlıdır.
    const siparisKalemIds = [...new Set(fis.kalemler.map((k) => k.siparisKalemId).filter((v): v is number => v != null))]
    const siparisler = siparisKalemIds.length
      ? await this.prisma.siparisKalem.findMany({
          where: { id: { in: siparisKalemIds } },
          select: { id: true, siparis: { select: { siparisNo: true, musteriOrderNo: true } } },
        })
      : []
    const siparisByKalem = new Map(siparisler.map((s) => [s.id, s.siparis]))
    for (const k of fis.kalemler) {
      ;(k as any).siparis = k.siparisKalemId != null ? siparisByKalem.get(k.siparisKalemId) ?? null : null
    }
    return fis
  }

  async olustur(
    fisId: number,
    kullanici: AktifKullanici,
    body: { xsltDosyaAdi?: string; seriId?: number; yenile?: boolean },
  ) {
    const fis = await this.fisYukle(fisId)
    if (!CIKIS_TIPLERI.has(String(fis.irsaliyeTipi))) {
      throw new BadRequestException('e-İrsaliye yalnızca çıkış tipli fişlerde oluşturulur')
    }
    // yenile=true: gönderilmemiş belge, aynı belge no ve ETTN korunarak güncel fişten üretilir.
    const yenile = body?.yenile === true
    if (fis.eIrsaliyeNo && !yenile) {
      throw new BadRequestException(`Bu fiş için e-İrsaliye zaten oluşturulmuş: ${fis.eIrsaliyeNo}`)
    }
    if (fis.eIrsaliyeNo && fis.eIrsaliyeDurum === DURUM_ONAYLANDI) {
      throw new BadRequestException(
        'GİB onaylı e-İrsaliye yeniden oluşturulamaz; onaylı belgenin içeriği değiştirilemez',
      )
    }
    const mevcutNo = fis.eIrsaliyeNo
    if (!fis.cariHesapId || !fis.cariHesap) {
      throw new BadRequestException('Fişte cari hesap seçili değil')
    }
    if (!fis.kalemler.length) {
      throw new BadRequestException('Fişte e-İrsaliyeye aktarılacak kalem yok')
    }

    const seri = mevcutNo
      ? null
      : await this.prisma.kullaniciSeri.findFirst({
          where: {
            kullaniciId: kullanici.id,
            belgeTuru: BELGE_TURU,
            aktif: true,
            ...(body?.seriId ? { id: Number(body.seriId) } : {}),
          },
          orderBy: { seri: 'asc' },
        })
    if (!mevcutNo && !seri) {
      throw new BadRequestException(
        'Kullanıcıya e-İrsaliye serisi tanımlı değil. Kullanıcı kartındaki e-Belge Serileri bölümünden seri atayın.',
      )
    }

    const xslt =
      String(body?.xsltDosyaAdi ?? '').trim() ||
      fis.xsltDosyaAdi ||
      (await this.varsayilanXslt(kullanici.id))

    const sirket = await this.prisma.sirket.findFirst({
      include: { adresler: { orderBy: [{ sira: 'asc' }, { id: 'asc' }], take: 1 } },
    })

    const yil = new Date(fis.irsaliyeTarihi).getFullYear()
    const olusturma = new Date()
    const kullaniciAd = await this.kullaniciLog(kullanici)

    const sonuc = await this.prisma.$transaction(async (tx) => {
      let eIrsaliyeNo: string
      let ettn: string
      if (mevcutNo) {
        eIrsaliyeNo = mevcutNo
        ettn = fis.ettnNo || randomUUID()
      } else {
        eIrsaliyeNo = await this.numaraAl(tx, seri!.id, seri!.seri, yil)
        ettn = randomUUID()
      }
      const xml = xmlOlustur({ fis, sirket, cari: fis.cariHesap, eIrsaliyeNo, ettn, olusturma })

      const yazilan = await tx.irsaliye.updateMany({
        where: mevcutNo ? { id: fisId, eIrsaliyeNo: mevcutNo } : { id: fisId, eIrsaliyeNo: null },
        data: {
          eIrsaliyeDurum: DURUM_OLUSTURULDU,
          ettnNo: ettn,
          eIrsaliyeNo,
          xsltDosyaAdi: xslt,
          eIrsaliyeXml: xml,
        },
      })
      if (yazilan.count === 0) {
        throw new BadRequestException(
          mevcutNo
            ? 'e-İrsaliye bu sırada başka bir kullanıcı tarafından değiştirildi, listeyi yenileyip tekrar deneyin'
            : 'Bu fiş için e-İrsaliye başka bir kullanıcı tarafından oluşturulmuş',
        )
      }

      await tx.eIrsaliyeLog.create({
        data: {
          irsaliyeId: fisId,
          islem: mevcutNo ? 'YENIDEN_OLUSTUR' : 'OLUSTUR',
          durum: DURUM_OLUSTURULDU,
          ettnNo: ettn,
          eIrsaliyeNo,
          mesaj: mevcutNo
            ? 'e-İrsaliye güncel fiş bilgileriyle yeniden üretildi (aynı belge no ve ETTN)'
            : 'e-İrsaliye dosyası oluşturuldu (simülasyon)',
          kullaniciId: kullanici.id,
          kullaniciAd,
        },
      })

      return { eIrsaliyeNo }
    })

    if (!sonuc.eIrsaliyeNo) throw new BadRequestException('e-İrsaliye numarası üretilemedi')
    return this.payload(fisId, kullanici.id)
  }

  async gonder(fisId: number, kullanici: AktifKullanici) {
    const fis = await this.prisma.irsaliye.findUnique({
      where: { id: fisId },
      select: { id: true, eIrsaliyeNo: true, eIrsaliyeDurum: true, ettnNo: true },
    })
    if (!fis) throw new NotFoundException('İrsaliye bulunamadı')
    if (!fis.eIrsaliyeNo) throw new BadRequestException('Önce e-İrsaliye oluşturulmalı')
    if (fis.eIrsaliyeDurum === DURUM_ONAYLANDI) {
      throw new BadRequestException('e-İrsaliye zaten onaylandı')
    }

    const kullaniciAd = await this.kullaniciLog(kullanici)
    await this.prisma.$transaction([
      this.prisma.irsaliye.update({
        where: { id: fisId },
        data: { eIrsaliyeDurum: DURUM_ONAYLANDI },
      }),
      this.prisma.eIrsaliyeLog.create({
        data: {
          irsaliyeId: fisId,
          islem: 'GONDER',
          durum: DURUM_ONAYLANDI,
          ettnNo: fis.ettnNo,
          eIrsaliyeNo: fis.eIrsaliyeNo,
          mesaj: 'GİB onayı alındı (simülasyon)',
          kullaniciId: kullanici.id,
          kullaniciAd,
        },
      }),
    ])

    return this.payload(fisId, kullanici.id)
  }

  // Modal seçili tasarımı değiştirdiğinde fişteki XSLT adı güncellenir.
  // XML saklandığı için görüntü yalnızca tarayıcıda yeniden dönüştürülür.
  async tasarimSec(fisId: number, kullaniciId: number, xsltDosyaAdi: string) {
    const ad = String(xsltDosyaAdi ?? '').trim()
    if (!ad) throw new BadRequestException('XSLT dosya adı zorunludur')
    if (ad.length > 200) throw new BadRequestException('XSLT dosya adı en fazla 200 karakter olabilir')
    const fis = await this.prisma.irsaliye.findUnique({ where: { id: fisId }, select: { id: true, eIrsaliyeNo: true } })
    if (!fis) throw new NotFoundException('İrsaliye bulunamadı')
    if (!fis.eIrsaliyeNo) throw new BadRequestException('Önce e-İrsaliye oluşturulmalı')
    await this.prisma.irsaliye.update({ where: { id: fisId }, data: { xsltDosyaAdi: ad } })
    return this.payload(fisId, kullaniciId, { xsltDosyaAdi: ad })
  }

  async payload(fisId: number, kullaniciId?: number, override?: { xsltDosyaAdi: string }) {
    const fis = await this.prisma.irsaliye.findUnique({
      where: { id: fisId },
      select: {
        id: true,
        irsaliyeNo: true,
        irsaliyeTipi: true,
        irsaliyeTarihi: true,
        cariHesap: { select: { kod: true, ad: true } },
        depo: { select: { kod: true, ad: true } },
        nakliyeciUnvan: true,
        nakliyeciPlaka: true,
        eIrsaliyeDurum: true,
        ettnNo: true,
        eIrsaliyeNo: true,
        xsltDosyaAdi: true,
        eIrsaliyeXml: true,
        eIrsaliyeLoglari: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!fis) throw new NotFoundException('İrsaliye bulunamadı')

    const tasarimlar = kullaniciId
      ? await this.prisma.kullaniciTasarim.findMany({
          where: { kullaniciId, aktif: true },
          orderBy: [{ varsayilan: 'desc' }, { sira: 'asc' }, { ad: 'asc' }],
          select: { ad: true, xsltDosyaAdi: true, varsayilan: true },
        })
      : []

    return {
      fis: {
        id: fis.id,
        fisNo: fis.irsaliyeNo,
        fisTipi: fis.irsaliyeTipi,
        tarih: fis.irsaliyeTarihi,
        cariKod: fis.cariHesap?.kod ?? null,
        cariAd: fis.cariHesap?.ad ?? null,
        depo: fis.depo ? `${fis.depo.kod} - ${fis.depo.ad}` : null,
        nakliyeci: [fis.nakliyeciUnvan, fis.nakliyeciPlaka].filter(Boolean).join(' / ') || null,
      },
      eIrsaliye: {
        durum: fis.eIrsaliyeDurum,
        ettnNo: fis.ettnNo,
        eIrsaliyeNo: fis.eIrsaliyeNo,
        xsltDosyaAdi: override?.xsltDosyaAdi ?? fis.xsltDosyaAdi,
        xml: fis.eIrsaliyeXml,
      },
      loglar: fis.eIrsaliyeLoglari,
      tasarimlar,
      varsayilanXslt: tasarimlar.find((t) => t.varsayilan)?.xsltDosyaAdi ?? tasarimlar[0]?.xsltDosyaAdi ?? null,
    }
  }
}
