import { SetMetadata } from '@nestjs/common'

export const IZIN_KEY = 'izinler'

/** Gerekli izin kodları; birden fazla verilirse herhangi biri yeterlidir. */
export const Izin = (...kodlar: string[]) => SetMetadata(IZIN_KEY, kodlar)
