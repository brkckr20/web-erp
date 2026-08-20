import { Controller, Post, Body } from '@nestjs/common'
import { CariTransferService, CariTransferSatir, CariTransferSonuc } from './cari-transfer.service'

@Controller('cari-transfer')
export class CariTransferController {
  constructor(private readonly cariTransferService: CariTransferService) {}

  @Post('import')
  importCariler(@Body() body: { satirlar: CariTransferSatir[] }): Promise<CariTransferSonuc> {
    return this.cariTransferService.importCariler(body.satirlar ?? [])
  }
}