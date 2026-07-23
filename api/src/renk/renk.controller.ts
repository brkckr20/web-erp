import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common'
import { RenkService } from './renk.service'
import { CreateRenkDto } from './dto/create-renk.dto'
import { UpdateRenkDto } from './dto/update-renk.dto'

@Controller('renk')
export class RenkController {
  constructor(private readonly renkService: RenkService) {}

  @Get()
  findAll(@Query('tip') tip?: string) {
    return this.renkService.findAll(tip != null ? Number(tip) : undefined)
  }

  @Get('by-kod/:kod')
  findByKod(@Param('kod') kod: string) {
    return this.renkService.findByKod(kod)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.renkService.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateRenkDto) {
    return this.renkService.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRenkDto) {
    return this.renkService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.renkService.remove(id)
  }
}