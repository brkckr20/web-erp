const secret = process.env.JWT_SECRET

if (!secret) {
  throw new Error('JWT_SECRET tanımlı değil (.env). Uygulama zayıf anahtarla açılmayacak.')
}

export const JWT_SECRET = secret
