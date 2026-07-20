import { Module } from '@nestjs/common'
import { KullaniciController } from './kullanici.controller'
import { KullaniciService } from './kullanici.service'

@Module({
  controllers: [KullaniciController],
  providers: [KullaniciService],
})
export class KullaniciModule {}
