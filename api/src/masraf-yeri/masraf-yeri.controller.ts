import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common'
import { Izin } from '../auth/izin.decorator'
import { MasrafYeriService } from './masraf-yeri.service'
import { CreateMasrafYeriDto } from './dto/create-masraf-yeri.dto'
import { UpdateMasrafYeriDto } from './dto/update-masraf-yeri.dto'

@Controller('masraf-yeri')
@Izin('muhasebe.goruntule')
export class MasrafYeriController {
  constructor(private readonly service: MasrafYeriService) {}

  @Get()
  findAll() {
    return this.service.findAll()
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
  create(@Body() dto: CreateMasrafYeriDto) {
    return this.service.create(dto)
  }

  @Put(':id')
  @Izin('muhasebe.kaydet')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMasrafYeriDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @Izin('muhasebe.sil')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}