import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common'
import { KumasTalepService } from './kumas-talep.service'
import { CreateKumasTalepDto, UpdateKumasTalepDto } from './dto/create-kumas-talep.dto'

@Controller('kumas-talep')
export class KumasTalepController {
  constructor(private readonly service: KumasTalepService) {}

  @Get()
  findAll(@Query('siparisNo') siparisNo?: string) {
    return this.service.findAll(siparisNo)
  }

  @Get('next-no')
  nextNo() {
    return this.service.nextNo()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateKumasTalepDto) {
    return this.service.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateKumasTalepDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}
