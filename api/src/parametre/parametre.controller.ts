import { Controller, Get, Put, Param, Body, Query } from '@nestjs/common'
import { ParametreService } from './parametre.service'
import { Izin } from '../auth/izin.decorator'

@Controller('parametre')
@Izin('ayarlar.goruntule')
export class ParametreController {
  constructor(private readonly service: ParametreService) {}

  // Parametre okuma sipariş/model gibi operasyon ekranlarında da gerekli.
  @Get()
  @Izin()
  findAll(@Query('grup') grup?: string) {
    return this.service.findAll(grup)
  }

  @Get(':grup/:anahtar')
  @Izin()
  findOne(@Param('grup') grup: string, @Param('anahtar') anahtar: string) {
    return this.service.findOne(grup, anahtar)
  }

  @Put(':grup/:anahtar')
  @Izin('ayarlar.kaydet')
  set(@Param('grup') grup: string, @Param('anahtar') anahtar: string, @Body() body: { deger: string; guncelleyen?: string }) {
    return this.service.set(grup, anahtar, body.deger, body.guncelleyen)
  }
}
