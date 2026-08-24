import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common'
import { TedarikService } from './tedarik.service'
import { HesaplaParamsDto } from './dto/hesapla.dto'
import { TedarikIhtiyacCreateDto } from './dto/create.dto'
import { TedarikIhtiyacUpdateDto } from './dto/update.dto'

@Controller('tedarik')
export class TedarikController {
  constructor(private readonly service: TedarikService) {}

  @Post('hesapla')
  hesapla(
    @Query('siparisId', ParseIntPipe) siparisId: number,
    @Query('kalemId') kalemId?: string,
    @Query('tip') tip?: string,
  ) {
    const params: HesaplaParamsDto = {
      siparisId,
      kalemId: kalemId ? Number(kalemId) : null,
      tip: tip ?? 'kumas',
    }
    return this.service.hesapla(params)
  }

  @Get('planlama/kumas')
  planlamaKumas() {
    return this.service.planlamaKumas()
  }

  @Get('planlama/kumas/hareketler')
  planlamaKumasHareketler(
    @Query('siparisNo') siparisNo: string,
    @Query('malzemeKod') malzemeKod: string,
  ) {
    return this.service.planlamaKumasHareketler(siparisNo, malzemeKod)
  }

  @Get()
  findBySiparis(
    @Query('siparisId', ParseIntPipe) siparisId: number,
    @Query('tip') tip?: string,
    @Query('siparisKalemId') siparisKalemId?: string,
  ) {
    return this.service.findBySiparis(
      siparisId,
      tip,
      siparisKalemId ? Number(siparisKalemId) : undefined,
    )
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: TedarikIhtiyacCreateDto) {
    return this.service.create(dto)
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: TedarikIhtiyacUpdateDto) {
    return this.service.update(id, dto)
  }

  @Delete()
  removeAll(
    @Query('siparisId', ParseIntPipe) siparisId: number,
    @Query('tip') tip?: string,
    @Query('siparisKalemId') siparisKalemId?: string,
  ) {
    return this.service.removeAll(
      siparisId,
      tip,
      siparisKalemId ? Number(siparisKalemId) : undefined,
    )
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}
