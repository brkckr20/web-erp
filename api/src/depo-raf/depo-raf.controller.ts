import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common'
import { DepoRafService } from './depo-raf.service'
import { CreateDepoRafDto } from './dto/create-depo-raf.dto'
import { UpdateDepoRafDto } from './dto/update-depo-raf.dto'

@Controller('depo-raf')
export class DepoRafController {
  constructor(private readonly service: DepoRafService) {}

  @Get()
  findAll(@Query('depoId') depoId?: string, @Query('aktif') aktif?: string) {
    return this.service.findAll(depoId, aktif)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateDepoRafDto) {
    return this.service.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDepoRafDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}
