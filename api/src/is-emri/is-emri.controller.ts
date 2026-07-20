import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common'
import { IsEmriService } from './is-emri.service'
import { CreateIsEmriDto } from './dto/create-is-emri.dto'
import { UpdateIsEmriDto } from './dto/update-is-emri.dto'

@Controller('is-emri')
export class IsEmriController {
  constructor(private readonly isEmriService: IsEmriService) {}

  @Get()
  findAll() {
    return this.isEmriService.findAll()
  }

  @Get('by-kod/:kod')
  findByKod(@Param('kod') kod: string) {
    return this.isEmriService.findByKod(kod)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.isEmriService.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateIsEmriDto) {
    return this.isEmriService.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIsEmriDto) {
    return this.isEmriService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.isEmriService.remove(id)
  }
}
