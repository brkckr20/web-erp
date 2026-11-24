import { Module } from '@nestjs/common'
import { MuhasebeFisController } from './muhasebe-fis.controller'
import { MuhasebeFisService } from './muhasebe-fis.service'

@Module({
  controllers: [MuhasebeFisController],
  providers: [MuhasebeFisService],
  exports: [MuhasebeFisService],
})
export class MuhasebeFisModule {}
