import { Controller, Get, Post, Put, Delete, Body, Query } from '@nestjs/common'
import { ModelBedenService } from './model-beden.service'
import { CreateModelBedenDto } from './dto/create-model-beden.dto'
import { SiralamaModelBedenDto } from './dto/siralama-model-beden.dto'

@Controller('model-beden')
export class ModelBedenController {
  constructor(private service: ModelBedenService) {}

  @Get()
  findByMalzeme(@Query('malzemeId') malzemeId: string) {
    return this.service.findByMalzeme(Number(malzemeId))
  }

  @Post()
  add(@Body() dto: CreateModelBedenDto) {
    return this.service.add(dto)
  }

  @Put('sira')
  sirala(@Body() dto: SiralamaModelBedenDto) {
    return this.service.sirala(dto)
  }

  @Delete()
  remove(@Query('malzemeId') malzemeId: string, @Query('bedenId') bedenId: string) {
    return this.service.remove(Number(malzemeId), Number(bedenId))
  }
}
