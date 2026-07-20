import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common'
import { KolonSecimiService } from './kolon-secimi.service'
import { SaveKolonSecimiDto } from './dto/save-kolon-secimi.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('kolon-secimi')
@UseGuards(JwtAuthGuard)
export class KolonSecimiController {
  constructor(private readonly kolonSecimiService: KolonSecimiService) {}

  @Get(':ekranAdi')
  findByEkranAdi(@Request() req: any, @Param('ekranAdi') ekranAdi: string) {
    const kullaniciId = req.user.id
    return this.kolonSecimiService.findByEkranAdi(kullaniciId, ekranAdi)
  }

  @Post()
  save(@Request() req: any, @Body() dto: SaveKolonSecimiDto) {
    const kullaniciId = req.user.id
    return this.kolonSecimiService.saveBatch(kullaniciId, dto)
  }
}
