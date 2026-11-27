import { Controller, Get, Post, Put, Delete, Param, Query, Body, ParseIntPipe, Res, UseInterceptors, UploadedFile } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import type { Response } from 'express'
import { Public } from '../auth/public.decorator'
import { FiyatTeklifService } from './fiyat-teklif.service'
import { CreateFiyatTeklifDto, UpdateFiyatTeklifDto } from './dto/create-fiyat-teklif.dto'

@Controller('fiyat-teklif')
export class FiyatTeklifController {
  constructor(private readonly service: FiyatTeklifService) {}

  @Get()
  findAll(@Query('cariKod') cariKod?: string) {
    return this.service.findAll(cariKod)
  }

  @Get('next-no')
  nextNo() {
    return this.service.nextNo()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateFiyatTeklifDto) {
    return this.service.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFiyatTeklifDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }

  @Post('dosya')
  @UseInterceptors(FileInterceptor('dosya', { limits: { fileSize: 10 * 1024 * 1024 } }))
  uploadDosya(
    @UploadedFile() file: Express.Multer.File,
    @Body('fiyatTeklifId', ParseIntPipe) fiyatTeklifId: number,
  ) {
    return this.service.uploadDosya(file, fiyatTeklifId)
  }

  @Public()
  @Get('dosya/:id')
  async getDosya(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const row = await this.service.getDosya(id)
    const ad = encodeURIComponent(row.dosyaAdi)
    res.set({
      'Content-Type': row.mimetype ?? 'application/octet-stream',
      'Content-Disposition': `inline; filename="${ad}"; filename*=UTF-8''${ad}`,
    })
    res.send(row.dosya)
  }

  @Delete('dosya/:id')
  removeDosya(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeDosya(id)
  }
}
