import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Query,
  Request,
} from '@nestjs/common'
import { IrsaliyeService } from './irsaliye.service'
import { EIrsaliyeService } from './e-irsaliye.service'
import { CreateIrsaliyeDto } from './dto/create-irsaliye.dto'
import { UpdateIrsaliyeDto } from './dto/create-irsaliye.dto'
import { CreateIrsaliyeKalemDto } from './dto/create-irsaliye.dto'
import { UpdateIrsaliyeKalemDto } from './dto/create-irsaliye.dto'
import { Izin } from '../auth/izin.decorator'

@Controller('irsaliye')
@Izin('satis.goruntule', 'satinalma.goruntule', 'stok.goruntule')
export class IrsaliyeController {
  constructor(
    private readonly service: IrsaliyeService,
    private readonly eIrsaliyeService: EIrsaliyeService,
  ) {}

  @Get('next-irsaliye-no')
  nextIrsaliyeNo(@Query('irsaliyeTipi') irsaliyeTipi: string) {
    return this.service.nextIrsaliyeNo(irsaliyeTipi)
  }

  @Get()
  findAll(@Query('irsaliyeTipi') irsaliyeTipi?: string) {
    return this.service.findAll(irsaliyeTipi)
  }

  // :id rotasından ÖNCE tanımlı olmalı; aksi halde ParseIntPipe 400 döndürür.
  @Get('e-irsaliye-listesi')
  eIrsaliyeListesi() {
    return this.service.eIrsaliyeListesi()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  @Izin('satis.kaydet', 'satinalma.kaydet', 'stok.kaydet')
  create(@Body() dto: CreateIrsaliyeDto) {
    return this.service.create(dto)
  }

  @Put(':id')
  @Izin('satis.kaydet', 'satinalma.kaydet', 'stok.kaydet')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIrsaliyeDto) {
    return this.service.update(id, dto)
  }

  @Put(':id/onay')
  @Izin('satis.kaydet', 'satinalma.kaydet', 'stok.kaydet')
  setOnay(@Param('id', ParseIntPipe) id: number, @Body('onaylandi') onaylandi: boolean) {
    return this.service.setOnay(id, onaylandi === true)
  }

  @Delete(':id')
  @Izin('satis.sil', 'satinalma.sil', 'stok.sil')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }

  @Post(':id/e-irsaliye/olustur')
  @Izin('satis.kaydet', 'satinalma.kaydet')
  eIrsaliyeOlustur(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { xsltDosyaAdi?: string; seriId?: number; yenile?: boolean },
  ) {
    return this.eIrsaliyeService.olustur(id, req.user, body ?? {})
  }

  @Get(':id/e-irsaliye')
  eIrsaliyeGetir(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.eIrsaliyeService.payload(id, req.user.id)
  }

  @Post(':id/e-irsaliye/gonder')
  @Izin('satis.kaydet', 'satinalma.kaydet')
  eIrsaliyeGonder(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.eIrsaliyeService.gonder(id, req.user)
  }

  @Post(':id/e-irsaliye/iptal')
  @Izin('satis.iptal', 'satinalma.iptal')
  eIrsaliyeIptal(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.eIrsaliyeService.iptal(id, req.user)
  }

  @Post(':id/e-irsaliye/belge-no-sifirla')
  @Izin('satis.iptal', 'satinalma.iptal')
  eIrsaliyeBelgeNoSifirla(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.eIrsaliyeService.belgeNoSifirla(id, req.user)
  }

  @Put(':id/e-irsaliye/tasarim')
  @Izin('satis.kaydet', 'satinalma.kaydet')
  eIrsaliyeTasarimSec(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('xsltDosyaAdi') xsltDosyaAdi: string,
  ) {
    return this.eIrsaliyeService.tasarimSec(id, req.user.id, xsltDosyaAdi)
  }

  @Get(':id/kalemler')
  findKalemler(@Param('id', ParseIntPipe) id: number) {
    return this.service.findKalemler(id)
  }

  @Post('kalem')
  @Izin('satis.kaydet', 'satinalma.kaydet', 'stok.kaydet')
  createKalem(@Body() dto: CreateIrsaliyeKalemDto) {
    return this.service.createKalem(dto)
  }

  @Put('kalem/:id')
  @Izin('satis.kaydet', 'satinalma.kaydet', 'stok.kaydet')
  updateKalem(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIrsaliyeKalemDto) {
    return this.service.updateKalem(id, dto)
  }

  @Delete('kalem/:id')
  @Izin('satis.sil', 'satinalma.sil', 'stok.sil')
  removeKalem(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeKalem(id)
  }
}
