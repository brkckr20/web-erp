import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common'
import { MakinaService } from './makina.service'
import { CreateMakinaDto } from './dto/create-makina.dto'
import { UpdateMakinaDto } from './dto/update-makina.dto'

@Controller('makina')
export class MakinaController {
  constructor(private readonly makinaService: MakinaService) {}

  @Get()
  findAll() {
    return this.makinaService.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.makinaService.findOne(id)
  }

  @Get('kod/:kod')
  findByKod(@Param('kod') kod: string) {
    return this.makinaService.findByKod(kod)
  }

  @Post()
  create(@Body() dto: CreateMakinaDto) {
    return this.makinaService.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMakinaDto) {
    return this.makinaService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.makinaService.remove(id)
  }
}
