import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common'
import { HataTanimService } from './hata-tanim.service'
import { CreateHataTanimDto } from './dto/create-hata-tanim.dto'
import { UpdateHataTanimDto } from './dto/update-hata-tanim.dto'

@Controller('hata-tanim')
export class HataTanimController {
  constructor(private readonly hataTanimService: HataTanimService) {}

  @Get()
  findAll() {
    return this.hataTanimService.findAll()
  }

  @Get('by-kod/:kod')
  findByKod(@Param('kod') kod: string) {
    return this.hataTanimService.findByKod(kod)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.hataTanimService.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateHataTanimDto) {
    return this.hataTanimService.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateHataTanimDto) {
    return this.hataTanimService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.hataTanimService.remove(id)
  }
}
