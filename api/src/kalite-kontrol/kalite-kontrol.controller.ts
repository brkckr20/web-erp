import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common'
import { KaliteKontrolService } from './kalite-kontrol.service'
import { CreateKaliteKontrolDto, UpdateKaliteKontrolDto } from './dto/create-kalite-kontrol.dto'

@Controller('kalite-kontrol')
export class KaliteKontrolController {
  constructor(private readonly service: KaliteKontrolService) {}

  @Get('next-fis-no')
  nextFisNo() {
    return this.service.nextFisNo()
  }

  @Get('stoga-alinmamis')
  stogaAlinmamis() {
    return this.service.stogaAlinmamisListe()
  }

  @Get('next-barkod')
  nextBarkod(@Query('depoKod') depoKod: string) {
    return this.service.nextBarkod(depoKod)
  }

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateKaliteKontrolDto) {
    return this.service.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateKaliteKontrolDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }

  @Post(':id/stoga-al')
  stogaAl(@Param('id', ParseIntPipe) id: number) {
    return this.service.stogaAl(id)
  }

  // Hata endpoints
  @Get('kalem/:kalemId/hata')
  getHatalar(@Param('kalemId', ParseIntPipe) kalemId: number) {
    return this.service.getHatalar(kalemId)
  }

  @Post('kalem/:kalemId/hata')
  createHata(
    @Param('kalemId', ParseIntPipe) kalemId: number,
    @Body() dto: { hataKodu: string; hataAdi: string; aciklama?: string },
  ) {
    return this.service.createHata(kalemId, dto)
  }

  @Put('hata/:id')
  updateHata(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { hataKodu?: string; hataAdi?: string; aciklama?: string },
  ) {
    return this.service.updateHata(id, dto)
  }

  @Delete('hata/:id')
  removeHata(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeHata(id)
  }
}
