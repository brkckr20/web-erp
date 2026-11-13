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
import { TahsisSatirDto } from './dto/tahsis.dto'

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

  @Post('guncelle-bayatlar')
  guncelleBayatlar(@Query('limit') limit?: string) {
    return this.service.guncelleBayatlar(limit ? Number(limit) : undefined)
  }

  @Get('ozet')
  ozet(@Query('siparisId', ParseIntPipe) siparisId: number) {
    return this.service.ozet(siparisId)
  }

  @Post('siparis-hesapla')
  siparisHesapla(@Query('siparisId', ParseIntPipe) siparisId: number) {
    return this.service.siparisHesapla(siparisId)
  }

  @Get('planlama/iplik')
  planlamaIplik() {
    return this.service.planlamaIplik()
  }

  @Get('planlama/kumas/hareketler')
  planlamaKumasHareketler(
    @Query('siparisNo') siparisNo: string,
    @Query('malzemeKod') malzemeKod: string,
    @Query('siparisKalemId') siparisKalemId?: string,
    @Query('renkId') renkId?: string,
  ) {
    return this.service.planlamaKumasHareketler(
      siparisNo,
      malzemeKod,
      siparisKalemId ? Number(siparisKalemId) : undefined,
      renkId ? Number(renkId) : undefined,
    )
  }

  @Post('planlama/tahsis')
  tahsisEt(@Body() dto: { satirlar: TahsisSatirDto[] }) {
    return this.service.tahsisEt(dto?.satirlar ?? [])
  }

  @Delete('planlama/tahsis')
  tahsisKaldir(
    @Query('siparisKalemId', ParseIntPipe) siparisKalemId: number,
    @Query('malzemeId', ParseIntPipe) malzemeId: number,
    @Query('renkId') renkId?: string,
  ) {
    return this.service.tahsisKaldir(siparisKalemId, malzemeId, renkId ? Number(renkId) : null)
  }

  @Get('planlama/kumas/depo-stok')
  karsilamaDepo(@Query('malzemeKod') malzemeKod: string, @Query('renkKod') renkKod?: string, @Query('malzemeId') malzemeId?: string) {
    return this.service.karsilamaDepo(malzemeKod, renkKod, malzemeId ? Number(malzemeId) : undefined)
  }

  @Get('planlama/iplik/hareketler')
  planlamaIplikHareketler(
    @Query('siparisNo') siparisNo: string,
    @Query('malzemeKod') malzemeKod: string,
  ) {
    return this.service.planlamaIplikHareketler(siparisNo, malzemeKod)
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
