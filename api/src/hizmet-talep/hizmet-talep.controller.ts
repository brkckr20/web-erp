import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe, Res, UseInterceptors, UploadedFile } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import type { Response } from 'express'
import { HizmetTalepService } from './hizmet-talep.service'
import {
  CreateHizmetTalepDto,
  UpdateHizmetTalepDto,
  CreateHizmetTalepNotDto,
} from './dto/create-hizmet-talep.dto'

@Controller('hizmet-talep')
export class HizmetTalepController {
  constructor(private readonly service: HizmetTalepService) {}

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateHizmetTalepDto) {
    return this.service.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateHizmetTalepDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }

  @Post('not')
  addNot(@Body() dto: CreateHizmetTalepNotDto) {
    return this.service.addNot(dto)
  }

  @Delete('not/:id')
  removeNot(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeNot(id)
  }

  @Post('dosya')
  @UseInterceptors(FileInterceptor('dosya', { limits: { fileSize: 10 * 1024 * 1024 } }))
  uploadDosya(
    @UploadedFile() file: Express.Multer.File,
    @Body('hizmetTalepId', ParseIntPipe) hizmetTalepId: number,
    @Body('hizmetTalepNotId') hizmetTalepNotId?: string,
  ) {
    const notId = hizmetTalepNotId ? Number(hizmetTalepNotId) : undefined
    return this.service.uploadDosya(file, hizmetTalepId, notId)
  }

  @Get('dosya/:id')
  async getDosya(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const row = await this.service.getDosya(id)
    res.set({ 'Content-Type': row.mimetype ?? 'application/octet-stream', 'Content-Disposition': `inline; filename="${row.dosyaAdi}"` })
    res.send(row.dosya)
  }

  @Delete('dosya/:id')
  removeDosya(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeDosya(id)
  }
}
