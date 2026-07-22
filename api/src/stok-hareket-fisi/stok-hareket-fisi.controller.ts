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
} from '@nestjs/common'
import { StokHareketFisiService } from './stok-hareket-fisi.service'
import { CreateStokHareketFisiDto } from './dto/create-stok-hareket-fisi.dto'
import { UpdateStokHareketFisiDto } from './dto/create-stok-hareket-fisi.dto'
import { CreateStokHareketFisiKalemDto } from './dto/create-stok-hareket-fisi-kalem.dto'
import { UpdateStokHareketFisiKalemDto } from './dto/create-stok-hareket-fisi-kalem.dto'

@Controller('stok-hareket-fisi')
export class StokHareketFisiController {
  constructor(private readonly service: StokHareketFisiService) {}

  @Get('next-fis-no')
  nextFisNo(@Query('fisTipi') fisTipi: string) {
    return this.service.nextFisNo(fisTipi)
  }

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get('by-fis-no/:fisNo')
  findByFisNo(@Param('fisNo') fisNo: string) {
    return this.service.findByFisNo(fisNo)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateStokHareketFisiDto) {
    return this.service.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStokHareketFisiDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }

  @Get(':id/kalemler')
  findKalemler(@Param('id', ParseIntPipe) id: number) {
    return this.service.findKalemler(id)
  }

  @Post(':id/kk-kalem-ekle')
  kkKalemEkle(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { kkKalemIds: number[] },
  ) {
    return this.service.kkKalemEkle(id, body.kkKalemIds)
  }

  @Post(':id/kk-isaretle')
  kkIsaretle(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { kkKalemIds: number[] },
  ) {
    return this.service.kkIsaretle(id, body.kkKalemIds)
  }

  @Post('kalem')
  createKalem(@Body() dto: CreateStokHareketFisiKalemDto) {
    return this.service.createKalem(dto)
  }

  @Put('kalem/:id')
  updateKalem(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStokHareketFisiKalemDto) {
    return this.service.updateKalem(id, dto)
  }

  @Delete('kalem/:id')
  removeKalem(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeKalem(id)
  }
}
