import { Controller, Get, Post, Put, Delete, Query, Param, Body, ParseIntPipe } from '@nestjs/common'
import { CariHesapService } from './cari-hesap.service'
import { CreateCariHesapDto } from './dto/create-cari-hesap.dto'
import { UpdateCariHesapDto } from './dto/update-cari-hesap.dto'
import { CreateCariHesapAdresDto } from './dto/create-cari-hesap-adres.dto'
import { UpdateCariHesapAdresDto } from './dto/update-cari-hesap-adres.dto'

@Controller('cari-hesap')
export class CariHesapController {
  constructor(private readonly cariHesapService: CariHesapService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('prefix') prefix?: string
  ) {
    return this.cariHesapService.findAll(search, page, limit, prefix)
  }

  @Get('by-kod/:kod')
  findByKod(@Param('kod') kod: string) {
    return this.cariHesapService.findByKod(kod)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cariHesapService.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateCariHesapDto) {
    return this.cariHesapService.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCariHesapDto) {
    return this.cariHesapService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cariHesapService.remove(id)
  }

  @Get(':id/adresler')
  adresleriGetir(@Param('id', ParseIntPipe) id: number) {
    return this.cariHesapService.adresleriGetir(id)
  }

  @Post(':id/adresler')
  adresEkle(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateCariHesapAdresDto) {
    return this.cariHesapService.adresEkle(id, dto)
  }

  @Put('adresler/:adresId')
  adresGuncelle(@Param('adresId', ParseIntPipe) adresId: number, @Body() dto: UpdateCariHesapAdresDto) {
    return this.cariHesapService.adresGuncelle(adresId, dto)
  }

  @Delete('adresler/:adresId')
  adresSil(@Param('adresId', ParseIntPipe) adresId: number) {
    return this.cariHesapService.adresSil(adresId)
  }
}
