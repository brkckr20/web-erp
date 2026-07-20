import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common'
import { KullaniciService } from './kullanici.service'
import { CreateKullaniciDto } from './dto/create-kullanici.dto'
import { UpdateKullaniciDto } from './dto/update-kullanici.dto'

@Controller('kullanici')
export class KullaniciController {
  constructor(private readonly kullaniciService: KullaniciService) {}

  @Get()
  findAll() {
    return this.kullaniciService.findAll()
  }

  @Get('by-kod/:kod')
  findByKod(@Param('kod') kod: string) {
    return this.kullaniciService.findByKod(kod)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.kullaniciService.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateKullaniciDto) {
    return this.kullaniciService.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateKullaniciDto) {
    return this.kullaniciService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.kullaniciService.remove(id)
  }
}
