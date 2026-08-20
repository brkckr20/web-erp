import { Controller, Post, Body } from '@nestjs/common'
import { RenkTransferService, TransferSatir, TransferSonuc } from './renk-transfer.service'

@Controller('renk-transfer')
export class RenkTransferController {
  constructor(private readonly renkTransferService: RenkTransferService) {}

  @Post('import')
  importRenkler(@Body() body: { satirlar: TransferSatir[] }): Promise<TransferSonuc> {
    return this.renkTransferService.importRenkler(body.satirlar ?? [])
  }
}