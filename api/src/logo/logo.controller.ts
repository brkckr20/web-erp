import { Controller, Get, Post, Delete, Param, Body, UploadedFile, UseInterceptors, Res, Query } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { LogoService } from './logo.service'
import type { Response } from 'express'
import * as path from 'path'

@Controller('logo')
export class LogoController {
  constructor(private readonly service: LogoService) {}

  @Get()
  list(@Query('ad') ad?: string) {
    if (ad) return this.service.getByAd(ad)
    return this.service.list()
  }

  @Get('dosya/:ad')
  async getDosya(@Param('ad') ad: string, @Res() res: Response) {
    const logo = await this.service.getByAd(ad)
    const filePath = this.service.getFilePath(logo.dosyaYolu)
    res.setHeader('Content-Type', logo.mimetype)
    res.sendFile(filePath)
  }

  @Post()
  @UseInterceptors(FileInterceptor('dosya'))
  upload(@UploadedFile() file: Express.Multer.File, @Body('ad') ad: string) {
    return this.service.upload(file, ad)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id))
  }
}
