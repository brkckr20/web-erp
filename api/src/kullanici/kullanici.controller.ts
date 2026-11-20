import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common'
import { KullaniciService } from './kullanici.service'
import { CreateKullaniciDto } from './dto/create-kullanici.dto'
import { UpdateKullaniciDto } from './dto/update-kullanici.dto'
import { Izin } from '../auth/izin.decorator'

@Controller('kullanici')
@Izin('ayarlar.goruntule')
export class KullaniciController {
  constructor(private readonly kullaniciService: KullaniciService) {}

  // Personel listesi tüm operasyon ekranlarının seçim kutularında kullanılıyor.
  @Get()
  @Izin()
  findAll() {
    return this.kullaniciService.findAll()
  }

  @Get('by-kod/:kod')
  @Izin()
  findByKod(@Param('kod') kod: string) {
    return this.kullaniciService.findByKod(kod)
  }

  @Get(':id/favoriler')
  @Izin()
  getFavoriler(@Param('id', ParseIntPipe) id: number) {
    return this.kullaniciService.getFavoriler(id)
  }

  @Put(':id/favoriler')
  @Izin()
  toggleFavori(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { favoriKey: string }
  ) {
    return this.kullaniciService.toggleFavori(id, body.favoriKey)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.kullaniciService.findOne(id)
  }

  @Post()
  @Izin('ayarlar.kaydet')
  create(@Body() dto: CreateKullaniciDto) {
    return this.kullaniciService.create(dto)
  }

  @Put(':id')
  @Izin('ayarlar.kaydet')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateKullaniciDto) {
    return this.kullaniciService.update(id, dto)
  }

  @Delete(':id')
  @Izin('ayarlar.sil')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.kullaniciService.remove(id)
  }
}
