import { Body, Controller, Get, Put } from '@nestjs/common'
import { Izin } from '../auth/izin.decorator'
import { MuhasebeEntegrasyonService } from './muhasebe-entegrasyon.service'
import { UpsertMuhasebeEntegrasyonDto } from './dto/upsert-muhasebe-entegrasyon.dto'

@Controller('muhasebe-entegrasyon')
@Izin('muhasebe.goruntule')
export class MuhasebeEntegrasyonController {
  constructor(private readonly service: MuhasebeEntegrasyonService) {}

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Put()
  @Izin('muhasebe.kaydet')
  replaceAll(@Body() dto: UpsertMuhasebeEntegrasyonDto) {
    return this.service.replaceAll(dto.items ?? [])
  }
}
