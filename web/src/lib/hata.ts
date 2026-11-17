// Nest hata gövdesi JSON metni olarak gelir; kullanıcıya mesajı göster.
export function hataMetni(e: unknown, varsayilan = 'İşlem sırasında hata oluştu'): string {
  const ham = e instanceof Error ? e.message : ''
  try {
    const body = JSON.parse(ham)
    if (Array.isArray(body?.message)) return body.message.join(', ')
    if (body?.message) return String(body.message)
  } catch {
    // JSON değil: ham metni göster
  }
  return ham || varsayilan
}
