import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { SiparisService } from './siparis.service';
import { CreateSiparisDto } from './dto/create-siparis.dto';
import { UpdateSiparisDto } from './dto/create-siparis.dto';

@Controller('siparis')
export class SiparisController {
  constructor(private readonly service: SiparisService) {}

  @Get('next-no')
  nextSiparisNo(@Query('numaratorId', ParseIntPipe) numaratorId: number) {
    return this.service.nextSiparisNo(numaratorId);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('by-siparis-no/:siparisNo')
  findBySiparisNo(@Param('siparisNo') siparisNo: string) {
    return this.service.findBySiparisNo(siparisNo);
  }

  @Get('model/:malzemeId')
  findByModel(@Param('malzemeId', ParseIntPipe) malzemeId: number) {
    return this.service.findByModel(malzemeId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSiparisDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSiparisDto) {
    return this.service.update(id, dto);
  }

  // Toplu durum statik yolda: ':id/durum' ile çakışmaması için önce tanımlı.
  @Patch('durum')
  durumToplu(@Body() body: { idler: number[]; durum: string }) {
    return this.service.setDurumToplu(body?.idler, body?.durum);
  }

  @Patch(':id/durum')
  durum(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { durum: string },
  ) {
    return this.service.setDurum(id, body?.durum);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
