import { Module } from '@nestjs/common'
import { KumasTalepController } from './kumas-talep.controller'
import { KumasTalepService } from './kumas-talep.service'

@Module({
  controllers: [KumasTalepController],
  providers: [KumasTalepService],
  exports: [KumasTalepService],
})
export class KumasTalepModule {}
