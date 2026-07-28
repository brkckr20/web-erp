import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common'
import { AksesuarTipiService } from './aksesuar-tipi.service'
import { CreateAksesuarTipiDto } from './dto/create-aksesuar-tipi.dto'
import { UpdateAksesuarTipiDto } from './dto/update-aksesuar-tipi.dto'

@Controller('aksesuar-tipi')
export class AksesuarTipiController {
  constructor(private readonly service: AksesuarTipiService) {}

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateAksesuarTipiDto) {
    return this.service.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAksesuarTipiDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}