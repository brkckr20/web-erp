import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSiparisDto } from './dto/create-siparis.dto';
import { UpdateSiparisDto } from './dto/create-siparis.dto';
import { BAYAT } from '../tedarik/tedarik.constants';

interface KalemImzali {
  id: number;
  malzemeId: number | null;
  sira: number;
  miktar?: unknown;
  renkler?: {
    kumasGruplari?: { kumasGrupId: number; renkId: number | null }[];
    bedenler?: { bedenId: number; miktar?: unknown }[];
  }[];
}

/** Prisma Decimal / string / number farkını gidermek için sayıyı normalize eder */
function imzaSayi(v: unknown): string {
  if (v === null || v === undefined || v === '') return ''
  const n = Number(v)
  return Number.isFinite(n) ? String(n) : String(v)
}

/**
 * Tedarik hesabını etkileyen kalem içeriğinin kısa imzası.
 * Sipariş kaydedildiğinde eski/yeni imza karşılaştırılıp tedarik kayıtlarının
 * bayat olup olmadığına karar veriliyor.
 */
export function kalemImzasi(kalem: KalemImzali): string {
  const renkler = (kalem.renkler ?? [])
    .map((r) => {
      const gruplar = (r.kumasGruplari ?? [])
        .map((g) => `${g.kumasGrupId}:${g.renkId ?? ''}`)
        .sort()
        .join(',')
      const bedenler = (r.bedenler ?? [])
        .map((b) => `${b.bedenId}:${imzaSayi(b.miktar)}`)
        .sort()
        .join(',')
      return `${gruplar}|${bedenler}`
    })
    .sort()
    .join(';')
  return `${kalem.malzemeId ?? ''}:${imzaSayi(kalem.miktar)}#${renkler}`
}

const FULL_INCLUDE = {
  cariHesap: true,
  numarator: true,
  kalemler: {
    orderBy: { sira: 'asc' },
    include: {
      malzeme: true,
      renkler: {
        orderBy: { sira: 'asc' },
        include: {
          kumasGruplari: { include: { kumasGrup: true, renk: true } },
          bedenler: {
            orderBy: { sira: 'asc' },
            include: { beden: true, stickerler: { orderBy: { sira: 'asc' } } },
          },
        },
      },
    },
  },
  aciklamalar: true,
} satisfies Prisma.SiparisInclude;

@Injectable()
export class SiparisService {
  constructor(private prisma: PrismaService) {}

  async nextSiparisNo(numaratorId: number): Promise<{ siparisNo: string }> {
    const numarator = await this.prisma.numarator.findUnique({
      where: { id: numaratorId },
    });
    if (!numarator) throw new NotFoundException('Numaratör bulunamadı');
    const year = new Date().getFullYear().toString().slice(-2);
    const prefix = `${numarator.onEk}${year}-`;
    // numaratorId filtresi kullanma: eski kayıtlarda numaratorId boş kalmış olabilir;
    // ön ek zaten numaratörü tanımlıyor
    const last = await this.prisma.siparis.findFirst({
      where: { siparisNo: { startsWith: prefix } },
      orderBy: { siparisNo: 'desc' },
      select: { siparisNo: true },
    });
    let sonNo: number | null = null;
    if (last?.siparisNo) {
      const m = last.siparisNo.match(/(\d+)\s*$/);
      if (m) sonNo = parseInt(m[1], 10);
    }
    // Bu ön ekte hiç sipariş yoksa 1'den başla (numarator.sonNo'ya bakma;
    // tüm siparişler silinmişse numara baştan başlamalı)
    if (sonNo === null) sonNo = 0;
    const yeniNo = sonNo + 1;
    await this.prisma.numarator.update({
      where: { id: numaratorId },
      data: { sonNo: yeniNo },
    });
    return {
      siparisNo: `${prefix}${String(yeniNo).padStart(4, '0')}`,
    };
  }

  findAll() {
    return this.prisma.siparis.findMany({
      orderBy: { siparisNo: 'desc' },
      include: {
        cariHesap: true,
        numarator: true,
        kalemler: true,
        aciklamalar: true,
      },
    });
  }

  async findOne(id: number) {
    const siparis = await this.prisma.siparis.findUnique({
      where: { id },
      include: FULL_INCLUDE,
    });
    if (!siparis) throw new NotFoundException('Sipariş bulunamadı');
    return siparis;
  }

  async findBySiparisNo(siparisNo: string) {
    const siparis = await this.prisma.siparis.findUnique({
      where: { siparisNo },
      include: FULL_INCLUDE,
    });
    if (!siparis) throw new NotFoundException('Sipariş bulunamadı');
    return siparis;
  }

  async create(dto: CreateSiparisDto) {
    const { kalemler, aciklamalar, numaratorId, ...rest } = dto as any;
    const data: any = { ...rest };
    if (dto.tarih) data.tarih = new Date(dto.tarih);
    if (dto.istemeTarihi) data.istemeTarihi = new Date(dto.istemeTarihi);
    if (dto.mIstemeTarihi) data.mIstemeTarihi = new Date(dto.mIstemeTarihi);
    if (dto.kayitTarihi) data.kayitTarihi = new Date(dto.kayitTarihi);
    if (dto.guncellemeTarihi)
      data.guncellemeTarihi = new Date(dto.guncellemeTarihi);
    if (numaratorId) {
      data.numaratorId = numaratorId;
      if (!dto.siparisNo) {
        const { siparisNo } = await this.nextSiparisNo(numaratorId);
        data.siparisNo = siparisNo;
      }
    }

    const kaydet = () =>
      this.prisma.$transaction(async (tx) => {
        const siparis = await tx.siparis.create({ data });
        await this.createChildren(tx, siparis.id, kalemler, aciklamalar);
        return this.findOneTx(tx, siparis.id);
      });

    try {
      return await kaydet();
    } catch (e) {
      // Önden alınan numara bu arada başka kayıtta tüketildiyse taze numara üret ve bir kez daha dene
      if ((e as any)?.code === 'P2002' && numaratorId) {
        const { siparisNo } = await this.nextSiparisNo(numaratorId);
        data.siparisNo = siparisNo;
        return kaydet();
      }
      throw e;
    }
  }

  async update(id: number, dto: UpdateSiparisDto) {
    const mevcut = await this.findOne(id);
    const { kalemler, aciklamalar, ...rest } = dto as any;
    const data: any = { ...rest };
    delete data.siparisNo;
    delete data.numaratorId;
    if (dto.tarih) data.tarih = new Date(dto.tarih);
    if (dto.istemeTarihi) data.istemeTarihi = new Date(dto.istemeTarihi);
    if (dto.mIstemeTarihi) data.mIstemeTarihi = new Date(dto.mIstemeTarihi);
    if (dto.kayitTarihi) data.kayitTarihi = new Date(dto.kayitTarihi);
    if (dto.guncellemeTarihi)
      data.guncellemeTarihi = new Date(dto.guncellemeTarihi);

    // kesim fazlası net (fire) miktarını doğrudan etkiliyor: değiştiyse
    // siparişe bağlı tüm tedarik hesapları bayat sayılır
    const kesimFazlasiDegisti =
      (data.kesimFazlasi ?? null) !== (mevcut.kesimFazlasi ?? null);

    return this.prisma.$transaction(async (tx) => {
      await tx.siparis.update({ where: { id }, data });
      if (Array.isArray(kalemler)) {
        const eskiKalemler = await tx.siparisKalem.findMany({
          where: { siparisId: id },
          orderBy: { sira: 'asc' },
          include: {
            renkler: { include: { kumasGruplari: true, bedenler: true } },
          },
        });

        await tx.siparisKalem.deleteMany({ where: { siparisId: id } });
        await tx.siparisAciklama.deleteMany({ where: { siparisId: id } });
        await this.createChildren(tx, id, kalemler, aciklamalar);

        // Kalemler silinip yeni id'lerle yaratıldığı için tedarik kayıtlarını
        // eski kalemlerden yeni kalemlere taşıyoruz. Siparişten kaldırılan
        // kalemlerin tedarik kayıtları anlamsız kalacağı için siliniyor.
        const yeniKalemler = await tx.siparisKalem.findMany({
          where: { siparisId: id },
          orderBy: { sira: 'asc' },
          include: {
            renkler: { include: { kumasGruplari: true, bedenler: true } },
          },
        });

        await this.tedarikKalemleriBagla(tx, id, eskiKalemler, yeniKalemler, kesimFazlasiDegisti);
      }
      return this.findOneTx(tx, id);
    });
  }

  private async tedarikKalemleriBagla(
    tx: Prisma.TransactionClient,
    siparisId: number,
    eskiKalemler: KalemImzali[],
    yeniKalemler: KalemImzali[],
    tumunuBayatla: boolean,
  ) {
    const eski = eskiKalemler.map((k) => ({ id: k.id, malzemeId: k.malzemeId, sira: k.sira, imza: kalemImzasi(k) }));
    const yeni = yeniKalemler.map((k) => ({ id: k.id, malzemeId: k.malzemeId, sira: k.sira, imza: kalemImzasi(k) }));

    // Aynı model siparişte birden fazla kez geçebiliyor: önce aynı sıradaki
    // eşleşmeyi dene, kalmayanları aynı modelin sırasıyla eşleştir.
    const kullanilan = new Set<number>();
    const eslesme = new Map<number, number>(); // eskiKalemId -> yeniKalemId
    for (const e of eski) {
      const aday = yeni.find((y) => !kullanilan.has(y.id) && y.malzemeId === e.malzemeId && y.sira === e.sira)
        ?? yeni.find((y) => !kullanilan.has(y.id) && y.malzemeId === e.malzemeId);
      if (!aday) continue;
      kullanilan.add(aday.id);
      eslesme.set(e.id, aday.id);
    }

    const yeniIdler = yeni.map((y) => y.id);
    if (yeniIdler.length) {
      // Siparişten çıkmış kalemlerin tedarik kayıtlarını temizle
      await tx.tedarikIhtiyac.deleteMany({
        where: { siparisId, siparisKalemId: { notIn: yeniIdler } },
      });
    } else {
      await tx.tedarikIhtiyac.deleteMany({ where: { siparisId } });
    }

    for (const [eskiId, yeniId] of eslesme) {
      const degisti = eski.find((e) => e.id === eskiId)!.imza !== yeni.find((y) => y.id === yeniId)!.imza;
      await tx.tedarikIhtiyac.updateMany({
        where: { siparisId, siparisKalemId: eskiId },
        data: { siparisKalemId: yeniId, ...(degisti ? { durum: BAYAT } : {}) },
      });
    }

    if (tumunuBayatla) {
      await tx.tedarikIhtiyac.updateMany({
        where: { siparisId },
        data: { durum: BAYAT },
      });
    }
  }

  async remove(id: number) {
    const siparis = await this.findOne(id);
    // Siparişe bağlı satın alma siparişi / mal alım irsaliyesi varsa silmeye izin verme
    // (bağlantı şu aşamada kalem açıklamasındaki sipariş numarası üzerinden kuruluyor)
    const bagliBelge = await this.prisma.irsaliyeKalem.count({
      where: {
        irsaliye: { irsaliyeTipi: { in: ['1', '201'] } },
        aciklama: { contains: siparis.siparisNo },
      },
    });
    if (bagliBelge > 0) {
      throw new ConflictException(
        `"${siparis.siparisNo}" siparişine bağlı ${bagliBelge} adet satın alma/alım belgesi bulunduğu için silinemez. Önce ilgili belgeleri silmelisiniz.`,
      );
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.tedarikIhtiyac.deleteMany({ where: { siparisId: id } });
      await tx.siparisKalem.deleteMany({ where: { siparisId: id } });
      await tx.siparisAciklama.deleteMany({ where: { siparisId: id } });
      return tx.siparis.delete({ where: { id } });
    });
  }

  private async createChildren(
    tx: Prisma.TransactionClient,
    siparisId: number,
    kalemler?: any[],
    aciklamalar?: any[],
  ) {
    if (Array.isArray(kalemler)) {
      for (const k of kalemler) {
        const { id: _id, renkler, malzeme: _malzeme, ...kalemData } = k;
        const kalem = await tx.siparisKalem.create({
          data: { ...kalemData, siparisId },
        });
        if (Array.isArray(renkler)) {
          for (const r of renkler) {
            const { id: _rid, kumasGruplari, bedenler, ...renkData } = r;
            if (renkData.istemeTarihi)
              renkData.istemeTarihi = new Date(renkData.istemeTarihi);
            const renk = await tx.siparisRenk.create({
              data: { ...renkData, siparisKalemId: kalem.id },
            });
            if (Array.isArray(kumasGruplari)) {
              for (const g of kumasGruplari) {
                const { id: _gid, kumasGrup: _kg, renk: _rk, ...grupData } = g;
                await tx.siparisRenkKumasGrup.create({
                  data: { ...grupData, siparisRenkId: renk.id },
                });
              }
            }
            if (Array.isArray(bedenler)) {
              for (const b of bedenler) {
                const { id: _bid, stickerler, beden: _bd, ...bedenData } = b;
                const beden = await tx.siparisRenkBeden.create({
                  data: { ...bedenData, siparisRenkId: renk.id },
                });
                if (Array.isArray(stickerler)) {
                  for (const s of stickerler) {
                    const { id: _sid, ...stickerData } = s;
                    await tx.siparisSticker.create({
                      data: {
                        ...stickerData,
                        siparisRenkBedenId: beden.id,
                      },
                    });
                  }
                }
              }
            }
          }
        }
      }
    }
    if (Array.isArray(aciklamalar)) {
      for (const a of aciklamalar) {
        const { id: _aid, ...aciklamaData } = a;
        await tx.siparisAciklama.create({
          data: { ...aciklamaData, siparisId },
        });
      }
    }
  }

  private findOneTx(tx: Prisma.TransactionClient, id: number) {
    return tx.siparis.findUnique({
      where: { id },
      include: FULL_INCLUDE,
    });
  }
}
