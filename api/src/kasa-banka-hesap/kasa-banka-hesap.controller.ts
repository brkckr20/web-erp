import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common'
import { Izin } from '../auth/izin.decorator'
import { KasaBankaHesapService } from './kasa-banka-hesap.service'
import { CreateKasaBankaHesapDto } from './dto/create-kasa-banka-hesap.dto'
import { UpdateKasaBankaHesapDto } from './dto/update-kasa-banka-hesap.dto'

@Controller('kasa-banka-hesap')
@Izin('muhasebe.goruntule')
export class KasaBankaHesapController {
  constructor(private readonly service: KasaBankaHesapService) {}

  @Get()
  findAll(@Query('tip') tip?: string) {
    return this.service.findAll(tip)
  }

  @Get('by-kod/:kod')
  findByKod(@Param('kod') kod: string) {
    return this.service.findByKod(kod)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  @Izin('muhasebe.kaydet')
  create(@Body() dto: CreateKasaBankaHesapDto) {
    return this.service.create(dto)
  }

  @Put(':id')
  @Izin('muhasebe.kaydet')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateKasaBankaHesapDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @Izin('muhasebe.sil')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}
