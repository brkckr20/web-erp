export function extractApiMessage(e: unknown, fallback = 'Silme sırasında hata oluştu'): string {
  const raw = e instanceof Error ? e.message : String(e ?? '')
  try {
    const parsed = JSON.parse(raw)
    const m = (parsed as any)?.message
    if (Array.isArray(m)) return m.join(', ')
    if (typeof m === 'string' && m) return m
  } catch {
    // JSON değilse ham metin
  }
  return raw || fallback
}
