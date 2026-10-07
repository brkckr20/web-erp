import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common'
import { IslemService } from './islem.service'
import { CreateIslemDto } from './dto/create-islem.dto'
import { UpdateIslemDto } from './dto/update-islem.dto'

@Controller('islem')
export class IslemController {
  constructor(private readonly islemService: IslemService) {}

  @Get()
  findAll(@Query('tip') tip?: string) {
    return this.islemService.findAll(tip != null ? Number(tip) : undefined)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.islemService.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateIslemDto) {
    return this.islemService.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIslemDto) {
    return this.islemService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.islemService.remove(id)
  }
}
