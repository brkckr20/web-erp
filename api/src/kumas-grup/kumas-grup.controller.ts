import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common'
import { KumasGrupService } from './kumas-grup.service'
import { CreateKumasGrupDto } from './dto/create-kumas-grup.dto'
import { UpdateKumasGrupDto } from './dto/update-kumas-grup.dto'

@Controller('kumas-grup')
export class KumasGrupController {
  constructor(private readonly service: KumasGrupService) {}

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateKumasGrupDto) {
    return this.service.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateKumasGrupDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}
