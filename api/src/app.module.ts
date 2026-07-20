import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { DepoModule } from './depo/depo.module';
import { KullaniciModule } from './kullanici/kullanici.module';
import { AuthModule } from './auth/auth.module';
import { MalzemeModule } from './malzeme/malzeme.module';
import { MakinaModule } from './makina/makina.module';
import { CariHesapModule } from './cari-hesap/cari-hesap.module';
import { StokHareketFisiModule } from './stok-hareket-fisi/stok-hareket-fisi.module';
import { RaporModule } from './rapor/rapor.module';
import { KolonSecimiModule } from './kolon-secimi/kolon-secimi.module';
import { KaliteKontrolModule } from './kalite-kontrol/kalite-kontrol.module';
import { HataTanimModule } from './hata-tanim/hata-tanim.module';
import { IsEmriModule } from './is-emri/is-emri.module';

@Module({
  imports: [PrismaModule, DepoModule, KullaniciModule, AuthModule, MalzemeModule, MakinaModule, CariHesapModule, StokHareketFisiModule, RaporModule, KolonSecimiModule, KaliteKontrolModule, HataTanimModule, IsEmriModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
