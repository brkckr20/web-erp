import { modules } from '@/data/modules'
import { api } from '@/lib/api'

export interface ShortcutItem {
  key: string
  label: string
  moduleKey: string
  isForm?: boolean
}

function getDefaultShortcuts(): ShortcutItem[] {
  const result: ShortcutItem[] = []
  for (const mod of modules) {
    for (const cat of mod.categories) {
      for (const item of cat.items) {
        if (item.isFavorite) {
          result.push({
            key: item.key,
            label: item.label,
            moduleKey: mod.key,
            isForm: item.isForm,
          })
        }
      }
    }
  }
  return result
}

function findModuleKeyForItem(itemKey: string): { modKey: string; item: { key: string; label: string; isForm?: boolean } } | null {
  for (const mod of modules) {
    for (const cat of mod.categories) {
      const found = cat.items.find((i) => i.key === itemKey)
      if (found) {
        return { modKey: mod.key, item: found }
      }
    }
  }
  return null
}

export async function getShortcuts(kullaniciId: number): Promise<ShortcutItem[]> {
  try {
    const favoriler: string[] = await api.get(`/kullanici/${kullaniciId}/favoriler`)
    return favoriler.map((key) => {
      const found = findModuleKeyForItem(key)
      if (found) {
        return {
          key: found.item.key,
          label: found.item.label,
          moduleKey: found.modKey,
          isForm: found.item.isForm,
        }
      }
      return null
    }).filter((x): x is ShortcutItem => x !== null)
  } catch {
    return getDefaultShortcuts()
  }
}

export async function toggleShortcut(kullaniciId: number, item: ShortcutItem): Promise<ShortcutItem[]> {
  await api.put(`/kullanici/${kullaniciId}/favoriler`, { favoriKey: item.key })
  return getShortcuts(kullaniciId)
}

export async function isShortcut(kullaniciId: number, itemKey: string): Promise<boolean> {
  const shortcuts = await getShortcuts(kullaniciId)
  return shortcuts.some((s) => s.key === itemKey)
}
