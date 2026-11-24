import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common'
import { Izin } from '../auth/izin.decorator'
import { MuhasebeHesapService, MuhasebeHesapTransferSatir, MuhasebeHesapTransferSonuc } from './muhasebe-hesap.service'
import { CreateMuhasebeHesapDto } from './dto/create-muhasebe-hesap.dto'
import { UpdateMuhasebeHesapDto } from './dto/update-muhasebe-hesap.dto'

@Controller('muhasebe-hesap')
@Izin('muhasebe.goruntule')
export class MuhasebeHesapController {
  constructor(private readonly service: MuhasebeHesapService) {}

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  @Izin('muhasebe.kaydet')
  create(@Body() dto: CreateMuhasebeHesapDto) {
    return this.service.create(dto)
  }

  @Post('import')
  @Izin('muhasebe.kaydet')
  importHesaplar(@Body() body: { satirlar: MuhasebeHesapTransferSatir[] }): Promise<MuhasebeHesapTransferSonuc> {
    return this.service.importHesaplar(body.satirlar ?? [])
  }

  @Put(':id')
  @Izin('muhasebe.kaydet')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMuhasebeHesapDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @Izin('muhasebe.sil')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}
