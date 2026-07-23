import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe, Query } from '@nestjs/common'
import { ModelReceteService } from './model-recete.service'
import { CreateKalemDto } from './dto/create-kalem.dto'
import { UpdateKalemDto } from './dto/update-kalem.dto'
import { CreateOlcuDto } from './dto/create-olcu.dto'

@Controller('model-recete')
export class ModelReceteController {
  constructor(private readonly service: ModelReceteService) {}

  @Get()
  findByMalzeme(@Query('malzemeId') malzemeId: string) {
    return this.service.findByMalzeme(Number(malzemeId))
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post('kalem')
  createKalem(@Body() dto: CreateKalemDto) {
    return this.service.createKalem(dto.receteId, dto)
  }

  @Put('kalem/:id')
  updateKalem(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateKalemDto) {
    return this.service.updateKalem(id, dto)
  }

  @Delete('kalem/:id')
  removeKalem(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeKalem(id)
  }

  @Post('olcu')
  upsertOlcu(@Body() dto: CreateOlcuDto) {
    return this.service.upsertOlcu(dto.kalemId, dto)
  }

  @Delete('olcu/:id')
  removeOlcu(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeOlcu(id)
  }
}
