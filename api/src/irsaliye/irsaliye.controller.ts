import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common'
import { IrsaliyeService } from './irsaliye.service'
import { EIrsaliyeService } from './e-irsaliye.service'
import { CreateIrsaliyeDto } from './dto/create-irsaliye.dto'
import { UpdateIrsaliyeDto } from './dto/create-irsaliye.dto'
import { CreateIrsaliyeKalemDto } from './dto/create-irsaliye.dto'
import { UpdateIrsaliyeKalemDto } from './dto/create-irsaliye.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('irsaliye')
export class IrsaliyeController {
  constructor(
    private readonly service: IrsaliyeService,
    private readonly eIrsaliyeService: EIrsaliyeService,
  ) {}

  @Get('next-irsaliye-no')
  nextIrsaliyeNo(@Query('irsaliyeTipi') irsaliyeTipi: string) {
    return this.service.nextIrsaliyeNo(irsaliyeTipi)
  }

  @Get()
  findAll(@Query('irsaliyeTipi') irsaliyeTipi?: string) {
    return this.service.findAll(irsaliyeTipi)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateIrsaliyeDto) {
    return this.service.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIrsaliyeDto) {
    return this.service.update(id, dto)
  }

  @Put(':id/onay')
  setOnay(@Param('id', ParseIntPipe) id: number, @Body('onaylandi') onaylandi: boolean) {
    return this.service.setOnay(id, onaylandi === true)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }

  @Post(':id/e-irsaliye/olustur')
  @UseGuards(JwtAuthGuard)
  eIrsaliyeOlustur(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { xsltDosyaAdi?: string; seriId?: number; yenile?: boolean },
  ) {
    return this.eIrsaliyeService.olustur(id, req.user, body ?? {})
  }

  @Get(':id/e-irsaliye')
  @UseGuards(JwtAuthGuard)
  eIrsaliyeGetir(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.eIrsaliyeService.payload(id, req.user.id)
  }

  @Post(':id/e-irsaliye/gonder')
  @UseGuards(JwtAuthGuard)
  eIrsaliyeGonder(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.eIrsaliyeService.gonder(id, req.user)
  }

  @Put(':id/e-irsaliye/tasarim')
  @UseGuards(JwtAuthGuard)
  eIrsaliyeTasarimSec(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('xsltDosyaAdi') xsltDosyaAdi: string,
  ) {
    return this.eIrsaliyeService.tasarimSec(id, req.user.id, xsltDosyaAdi)
  }

  @Get(':id/kalemler')
  findKalemler(@Param('id', ParseIntPipe) id: number) {
    return this.service.findKalemler(id)
  }

  @Post('kalem')
  createKalem(@Body() dto: CreateIrsaliyeKalemDto) {
    return this.service.createKalem(dto)
  }

  @Put('kalem/:id')
  updateKalem(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIrsaliyeKalemDto) {
    return this.service.updateKalem(id, dto)
  }

  @Delete('kalem/:id')
  removeKalem(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeKalem(id)
  }
}
