import { Controller, Get } from '@nestjs/common'
import { RaporService } from './rapor.service'

@Controller('rapor')
export class RaporController {
  constructor(private readonly service: RaporService) {}

  @Get('depo-bazli-stok')
  depoBazliStok() {
    return this.service.depoBazliStok()
  }
}
