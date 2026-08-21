import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSiparisDto } from './dto/create-siparis.dto';
import { UpdateSiparisDto } from './dto/create-siparis.dto';

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
    const last = await this.prisma.siparis.findFirst({
      where: { numaratorId, siparisNo: { startsWith: prefix } },
      orderBy: { siparisNo: 'desc' },
      select: { siparisNo: true },
    });
    let sonNo: number | null = null;
    if (last?.siparisNo) {
      const m = last.siparisNo.match(/(\d+)\s*$/);
      if (m) sonNo = parseInt(m[1], 10);
    }
    if (sonNo === null) sonNo = numarator.sonNo;
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

  async create(dto: CreateSiparisDto) {
    const { kalemler, aciklamalar, numaratorId, ...rest } = dto as any;
    const data: any = { ...rest };
    if (dto.tarih) data.tarih = new Date(dto.tarih);
    if (dto.istemeTarihi) data.istemeTarihi = new Date(dto.istemeTarihi);
    if (dto.mIstemeTarihi) data.mIstemeTarihi = new Date(dto.mIstemeTarihi);
    if (dto.kayitTarihi) data.kayitTarihi = new Date(dto.kayitTarihi);
    if (dto.guncellemeTarihi)
      data.guncellemeTarihi = new Date(dto.guncellemeTarihi);
    if (numaratorId && !dto.siparisNo) {
      const { siparisNo } = await this.nextSiparisNo(numaratorId);
      data.siparisNo = siparisNo;
      data.numaratorId = numaratorId;
    }

    return this.prisma.$transaction(async (tx) => {
      const siparis = await tx.siparis.create({ data });
      await this.createChildren(tx, siparis.id, kalemler, aciklamalar);
      return this.findOneTx(tx, siparis.id);
    });
  }

  async update(id: number, dto: UpdateSiparisDto) {
    await this.findOne(id);
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

    return this.prisma.$transaction(async (tx) => {
      await tx.siparis.update({ where: { id }, data });
      if (Array.isArray(kalemler)) {
        await tx.tedarikIhtiyac.deleteMany({ where: { siparisId: id } });
        await tx.siparisKalem.deleteMany({ where: { siparisId: id } });
        await tx.siparisAciklama.deleteMany({ where: { siparisId: id } });
        await this.createChildren(tx, id, kalemler, aciklamalar);
      }
      return this.findOneTx(tx, id);
    });
  }

  async remove(id: number) {
    await this.findOne(id);
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
