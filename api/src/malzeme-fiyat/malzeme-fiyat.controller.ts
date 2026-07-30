import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common'
import { MalzemeFiyatService } from './malzeme-fiyat.service'
import { CreateMalzemeFiyatDto } from './dto/create-malzeme-fiyat.dto'
import { UpdateMalzemeFiyatDto } from './dto/update-malzeme-fiyat.dto'

@Controller('malzeme-fiyat')
export class MalzemeFiyatController {
  constructor(private readonly malzemeFiyatService: MalzemeFiyatService) {}

  @Get()
  findByMalzeme(@Query('malzemeId', ParseIntPipe) malzemeId: number) {
    return this.malzemeFiyatService.findByMalzeme(malzemeId)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.malzemeFiyatService.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateMalzemeFiyatDto) {
    return this.malzemeFiyatService.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMalzemeFiyatDto) {
    return this.malzemeFiyatService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.malzemeFiyatService.remove(id)
  }
}
