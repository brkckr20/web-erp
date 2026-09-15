import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common'
import { RotaService } from './rota.service'
import { CreateRotaDto } from './dto/create-rota.dto'
import { UpdateRotaDto } from './dto/update-rota.dto'

@Controller('rota')
export class RotaController {
  constructor(private readonly rotaService: RotaService) {}

  @Get()
  findAll() {
    return this.rotaService.findAll()
  }

  @Get('by-kod/:kod')
  findByKod(@Param('kod') kod: string) {
    return this.rotaService.findByKod(kod)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rotaService.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateRotaDto) {
    return this.rotaService.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRotaDto) {
    return this.rotaService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rotaService.remove(id)
  }
}
