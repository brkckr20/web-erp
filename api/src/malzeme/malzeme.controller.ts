import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common'
import { MalzemeService } from './malzeme.service'
import { CreateMalzemeDto } from './dto/create-malzeme.dto'
import { UpdateMalzemeDto } from './dto/update-malzeme.dto'

@Controller('malzeme')
export class MalzemeController {
  constructor(private readonly malzemeService: MalzemeService) {}

  @Get()
  findAll() {
    return this.malzemeService.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.malzemeService.findOne(id)
  }

  @Get('kod/:kod')
  findByKod(@Param('kod') kod: string) {
    return this.malzemeService.findByKod(kod)
  }

  @Post()
  create(@Body() dto: CreateMalzemeDto) {
    return this.malzemeService.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMalzemeDto) {
    return this.malzemeService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.malzemeService.remove(id)
  }
}
