import { Module } from '@nestjs/common'
import { BarkodController } from './barkod.controller'
import { BarkodService } from './barkod.service'

@Module({
  controllers: [BarkodController],
  providers: [BarkodService],
  exports: [BarkodService],
})
export class BarkodModule {}
