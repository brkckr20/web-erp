import { Module } from '@nestjs/common'
import { SirketController } from './sirket.controller'
import { SirketService } from './sirket.service'

@Module({
  controllers: [SirketController],
  providers: [SirketService],
})
export class SirketModule {}
