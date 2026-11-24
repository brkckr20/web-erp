import { Module } from '@nestjs/common'
import { MuhasebeEntegrasyonController } from './muhasebe-entegrasyon.controller'
import { MuhasebeEntegrasyonService } from './muhasebe-entegrasyon.service'

@Module({
  controllers: [MuhasebeEntegrasyonController],
  providers: [MuhasebeEntegrasyonService],
  exports: [MuhasebeEntegrasyonService],
})
export class MuhasebeEntegrasyonModule {}
