import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common'
import { Izin } from '../auth/izin.decorator'
import { OdemePlanService } from './odeme-plan.service'
import { CreateOdemePlanDto } from './dto/create-odeme-plan.dto'
import { UpdateOdemePlanDto } from './dto/update-odeme-plan.dto'

@Controller('odeme-plan')
@Izin('muhasebe.goruntule')
export class OdemePlanController {
  constructor(private readonly service: OdemePlanService) {}

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
  create(@Body() dto: CreateOdemePlanDto) {
    return this.service.create(dto)
  }

  @Put(':id')
  @Izin('muhasebe.kaydet')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOdemePlanDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @Izin('muhasebe.sil')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}
