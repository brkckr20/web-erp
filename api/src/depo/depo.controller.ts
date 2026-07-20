import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common'
import { DepoService } from './depo.service'
import { CreateDepoDto } from './dto/create-depo.dto'
import { UpdateDepoDto } from './dto/update-depo.dto'

@Controller('depo')
export class DepoController {
  constructor(private readonly depoService: DepoService) {}

  @Get()
  findAll() {
    return this.depoService.findAll()
  }

  @Get('by-kod/:kod')
  findByKod(@Param('kod') kod: string) {
    return this.depoService.findByKod(kod)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.depoService.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateDepoDto) {
    return this.depoService.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDepoDto) {
    return this.depoService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.depoService.remove(id)
  }
}
