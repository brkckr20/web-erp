import { Controller, Get, Put, Param, Body, Query } from '@nestjs/common'
import { ParametreService } from './parametre.service'

@Controller('parametre')
export class ParametreController {
  constructor(private readonly service: ParametreService) {}

  @Get()
  findAll(@Query('grup') grup?: string) {
    return this.service.findAll(grup)
  }

  @Get(':grup/:anahtar')
  findOne(@Param('grup') grup: string, @Param('anahtar') anahtar: string) {
    return this.service.findOne(grup, anahtar)
  }

  @Put(':grup/:anahtar')
  set(@Param('grup') grup: string, @Param('anahtar') anahtar: string, @Body() body: { deger: string; guncelleyen?: string }) {
    return this.service.set(grup, anahtar, body.deger, body.guncelleyen)
  }
}
