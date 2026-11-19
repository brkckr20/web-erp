import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common'
import { KesimService } from './kesim.service'
import { CreateKesimDto, TopluKesimDto, UpdateKesimDto } from './dto/create-kesim.dto'

@Controller('kesim')
export class KesimController {
  constructor(private readonly service: KesimService) {}

  @Get()
  findAll(@Query('siparisNo') siparisNo?: string) {
    return this.service.findAll(siparisNo)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateKesimDto) {
    return this.service.create(dto)
  }

  @Post('toplu')
  toplu(@Body() dto: TopluKesimDto) {
    return this.service.topluOlustur(dto?.kayitlar ?? [])
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateKesimDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}
