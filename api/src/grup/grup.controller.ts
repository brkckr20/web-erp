import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common'
import { GrupService } from './grup.service'
import { CreateGrupDto } from './dto/create-grup.dto'
import { UpdateGrupDto } from './dto/update-grup.dto'

@Controller('grup')
export class GrupController {
  constructor(private readonly grupService: GrupService) {}

  @Get()
  findAll() {
    return this.grupService.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.grupService.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateGrupDto) {
    return this.grupService.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGrupDto) {
    return this.grupService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.grupService.remove(id)
  }
}
