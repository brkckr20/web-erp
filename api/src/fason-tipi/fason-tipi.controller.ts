import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common'
import { FasonTipiService } from './fason-tipi.service'
import { CreateFasonTipiDto } from './dto/create-fason-tipi.dto'
import { UpdateFasonTipiDto } from './dto/update-fason-tipi.dto'

@Controller('fason-tipi')
export class FasonTipiController {
  constructor(private readonly service: FasonTipiService) {}

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateFasonTipiDto) {
    return this.service.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFasonTipiDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}
