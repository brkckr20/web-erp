import { Controller, Get, Param } from '@nestjs/common';
import { RaporService } from './rapor.service';

@Controller('rapor')
export class RaporController {
  constructor(private readonly raporService: RaporService) {}

  @Get('depo-bazli-stok')
  depoBazliStok() {
    return this.raporService.depoBazliStok();
  }

  @Get('malzeme-stok-ekstresi/:malzemeKod')
  malzemeStokEkstresi(@Param('malzemeKod') malzemeKod: string) {
    return this.raporService.malzemeStokEkstresi(malzemeKod);
  }
}
