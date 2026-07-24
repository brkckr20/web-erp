import { Controller, Get, Post, Delete, Body, Query } from '@nestjs/common'
import { ModelKumasGrupService } from './model-kumas-grup.service'
import { CreateModelKumasGrupDto } from './dto/create-model-kumas-grup.dto'

@Controller('model-kumas-grup')
export class ModelKumasGrupController {
  constructor(private service: ModelKumasGrupService) {}

  @Get()
  findByMalzeme(@Query('malzemeId') malzemeId: string) {
    return this.service.findByMalzeme(Number(malzemeId))
  }

  @Post()
  add(@Body() dto: CreateModelKumasGrupDto) {
    return this.service.add(dto)
  }

  @Delete()
  remove(@Query('malzemeId') malzemeId: string, @Query('kumasGrupId') kumasGrupId: string) {
    return this.service.remove(Number(malzemeId), Number(kumasGrupId))
  }
}
