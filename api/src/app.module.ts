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
import { NumaratorModule } from './numarator/numarator.module';
import { OzellikKodlamaModule } from './ozellik-kodlama/ozellik-kodlama.module';
import { RenkModule } from './renk/renk.module';
import { MarkaModule } from './marka/marka.module';
import { GrupModule } from './grup/grup.module';
import { BedenModule } from './beden/beden.module';
import { ModelReceteModule } from './model-recete/model-recete.module';
import { ModelBedenModule } from './model-bedens/model-beden.module';
import { KumasGrupModule } from './kumas-grup/kumas-grup.module';
import { ModelKumasGrupModule } from './model-kumas-grup/model-kumas-grup.module';
import { GtipModule } from './gtip/gtip.module';
import { AksesuarTipiModule } from './aksesuar-tipi/aksesuar-tipi.module';
import { MalzemeEkModule } from './malzeme-ek/malzeme-ek.module';
import { DovizModule } from './doviz/doviz.module';
import { MalzemeFiyatModule } from './malzeme-fiyat/malzeme-fiyat.module';
import { IrsaliyeModule } from './irsaliye/irsaliye.module';
import { FasonTipiModule } from './fason-tipi/fason-tipi.module';
import { FormSabloniModule } from './form-sabloni/form-sabloni.module';
import { SiparisModule } from './siparis/siparis.module';
import { TedarikModule } from './tedarik/tedarik.module';
import { ParametreModule } from './parametre/parametre.module';

@Module({
  imports: [PrismaModule, DepoModule, KullaniciModule, AuthModule, MalzemeModule, MakinaModule, CariHesapModule, StokHareketFisiModule, RaporModule, KolonSecimiModule, KaliteKontrolModule, HataTanimModule, IsEmriModule, NumaratorModule, OzellikKodlamaModule, RenkModule, MarkaModule, GrupModule, BedenModule, ModelReceteModule, ModelBedenModule, KumasGrupModule, ModelKumasGrupModule, GtipModule, AksesuarTipiModule, MalzemeEkModule, DovizModule, MalzemeFiyatModule, IrsaliyeModule, FasonTipiModule, FormSabloniModule, SiparisModule, TedarikModule, ParametreModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
