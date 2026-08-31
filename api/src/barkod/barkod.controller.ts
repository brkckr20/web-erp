import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Query,
} from '@nestjs/common'
import { BarkodService } from './barkod.service'
import { CreateBarkodDto } from './dto/create-barkod.dto'

@Controller('barkod')
export class BarkodController {
  constructor(private readonly service: BarkodService) {}

  @Get()
  findAll(@Query('siparisNo') siparisNo?: string) {
    return this.service.findAll(siparisNo)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Get('ara/:kod')
  findByKod(@Param('kod') kod: string) {
    return this.service.findByKod(kod)
  }

  @Post('tar')
  parseAndLookup(@Body() body: { barkod: string }) {
    return this.service.parseAndLookup(body.barkod)
  }

  @Post()
  create(@Body() dto: CreateBarkodDto) {
    return this.service.create(dto)
  }

  @Post('toplu')
  createBatch(@Body() dtos: CreateBarkodDto[]) {
    return this.service.createBatch(dtos)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }

  @Delete('siparis/:siparisNo')
  removeBySiparis(@Param('siparisNo') siparisNo: string) {
    return this.service.removeBySiparis(siparisNo)
  }

  @Post('uret/:siparisId')
  uret(@Param('siparisId', ParseIntPipe) siparisId: number) {
    return this.service.uret(siparisId)
  }
}
