import { Module } from '@nestjs/common'
import { BankaFisController } from './banka-fis.controller'
import { BankaFisService } from './banka-fis.service'

@Module({
  controllers: [BankaFisController],
  providers: [BankaFisService],
})
export class BankaFisModule {}
