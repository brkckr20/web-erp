import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common'
import { Izin } from '../auth/izin.decorator'
import { BankaFisService } from './banka-fis.service'
import { CreateBankaFisDto } from './dto/create-banka-fis.dto'
import { UpdateBankaFisDto } from './dto/update-banka-fis.dto'

@Controller('banka-fis')
@Izin('muhasebe.goruntule')
export class BankaFisController {
  constructor(private readonly service: BankaFisService) {}

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
  create(@Body() dto: CreateBankaFisDto) {
    return this.service.create(dto)
  }

  @Put(':id')
  @Izin('muhasebe.kaydet')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBankaFisDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @Izin('muhasebe.sil')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}
