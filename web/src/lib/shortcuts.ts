import { modules } from '@/data/modules'

export interface ShortcutItem {
  key: string
  label: string
  moduleKey: string
  isForm?: boolean
}

function storageKey(userCode: string): string {
  return `shortcuts_${userCode}`
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

export function getShortcuts(userCode: string): ShortcutItem[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(storageKey(userCode))
  if (!raw) return getDefaultShortcuts()
  try {
    return JSON.parse(raw)
  } catch {
    return getDefaultShortcuts()
  }
}

export function setShortcuts(userCode: string, items: ShortcutItem[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(storageKey(userCode), JSON.stringify(items))
}

export function toggleShortcut(userCode: string, item: ShortcutItem): ShortcutItem[] {
  const current = getShortcuts(userCode)
  const exists = current.find((s) => s.key === item.key)
  let next: ShortcutItem[]
  if (exists) {
    next = current.filter((s) => s.key !== item.key)
  } else {
    next = [...current, item]
  }
  setShortcuts(userCode, next)
  return next
}

export function isShortcut(userCode: string, itemKey: string): boolean {
  return getShortcuts(userCode).some((s) => s.key === itemKey)
}
