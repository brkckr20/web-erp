import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common'
import { UretimHareketService } from './uretim-hareket.service'
import { CreateUretimHareketDto, TopluUretimHareketDto, UpdateUretimHareketDto } from './dto/create-uretim-hareket.dto'

@Controller('uretim-hareket')
export class UretimHareketController {
  constructor(private readonly service: UretimHareketService) {}

  @Get()
  findAll(@Query('siparisNo') siparisNo?: string) {
    return this.service.findAll(siparisNo)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateUretimHareketDto) {
    return this.service.create(dto)
  }

  @Post('toplu')
  toplu(@Body() dto: TopluUretimHareketDto) {
    return this.service.topluOlustur(dto?.kayitlar ?? [])
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUretimHareketDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}
