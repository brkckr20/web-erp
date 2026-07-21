import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common'
import { Response } from 'express'
import * as fs from 'fs'
import * as path from 'path'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalException')

  private logDir = path.join(process.cwd(), 'logs')

  private writeToFile(message: string) {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true })
      }
      const tarih = new Date()
      const gun = tarih.toISOString().slice(0, 10) // YYYY-MM-DD
      const dosya = path.join(this.logDir, `${gun}.txt`)
      const zaman = tarih.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
      const satir = `[${zaman}] ${message}\n`
      fs.appendFileSync(dosya, satir, 'utf-8')
    } catch (e) {
      this.logger.error('Log dosyasına yazılamadı: ' + e)
    }
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    let status = 500
    let mesaj: any = exception

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      mesaj = exception.getResponse()
    } else if (exception instanceof Error && (exception as any).code === 'P2002') {
      status = 409
      const meta = (exception as any).meta
      const target = Array.isArray(meta?.target) ? meta.target : []
      const field = target.includes('kod') ? 'kod' : target[0] ?? 'kod'
      mesaj = { statusCode: 409, message: `Bu ${field} ile kayıtlı bir malzeme zaten mevcut` }
    } else if (exception instanceof Error) {
      mesaj = { statusCode: 500, message: exception.message }
    }

    const detay =
      exception instanceof Error
        ? `${exception.message}\n${exception.stack ?? ''}`
        : JSON.stringify(exception, null, 2)

    const logMesaji = `STATUS: ${status}\nBODY: ${JSON.stringify(mesaj)}\nDETAY:\n${detay}\n${'='.repeat(60)}`

    this.logger.error(logMesaji)
    this.writeToFile(logMesaji)

    if (response && typeof response.status === 'function') {
      response.status(status).json(
        typeof mesaj === 'object' && mesaj !== null
          ? mesaj
          : { statusCode: status, message: String(mesaj) },
      )
    }
  }
}
