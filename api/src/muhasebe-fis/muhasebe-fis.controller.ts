import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common'
import { Izin } from '../auth/izin.decorator'
import { MuhasebeFisService } from './muhasebe-fis.service'
import { CreateMuhasebeFisDto } from './dto/create-muhasebe-fis.dto'
import { UpdateMuhasebeFisDto } from './dto/update-muhasebe-fis.dto'

@Controller('muhasebe-fis')
@Izin('muhasebe.goruntule')
export class MuhasebeFisController {
  constructor(private readonly service: MuhasebeFisService) {}

  @Get()
  findAll(@Query('fisTipi') fisTipi?: string) {
    return this.service.findAll(fisTipi)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  @Izin('muhasebe.kaydet')
  create(@Body() dto: CreateMuhasebeFisDto) {
    return this.service.create(dto)
  }

  @Put(':id')
  @Izin('muhasebe.kaydet')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMuhasebeFisDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @Izin('muhasebe.sil')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}
