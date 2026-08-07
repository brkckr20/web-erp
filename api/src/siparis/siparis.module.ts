import { Module } from '@nestjs/common';
import { SiparisController } from './siparis.controller';
import { SiparisService } from './siparis.service';

@Module({
  controllers: [SiparisController],
  providers: [SiparisService],
  exports: [SiparisService],
})
export class SiparisModule {}
