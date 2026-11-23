import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common'
import { Izin } from '../auth/izin.decorator'
import { CariHesapFisService } from './cari-hesap-fis.service'
import { CreateCariHesapFisDto } from './dto/create-cari-hesap-fis.dto'
import { UpdateCariHesapFisDto } from './dto/update-cari-hesap-fis.dto'

@Controller('cari-hesap-fis')
@Izin('muhasebe.goruntule')
export class CariHesapFisController {
  constructor(private readonly service: CariHesapFisService) {}

  @Get()
  findAll(@Query('tip') tip?: string) {
    return this.service.findAll(tip)
  }

  @Get('sonraki-no')
  sonrakiNo(@Query('tip') tip: string) {
    return this.service.sonrakiNo(tip)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  @Izin('muhasebe.kaydet')
  create(@Body() dto: CreateCariHesapFisDto) {
    return this.service.create(dto)
  }

  @Put(':id')
  @Izin('muhasebe.kaydet')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCariHesapFisDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @Izin('muhasebe.sil')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}
