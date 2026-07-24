export type ThemeMode = 'dark' | 'light'
export type AnimationSpeed = 'normal' | 'reduced' | 'none'

export interface CustomAccent {
  hue: number
}

export interface ThemePreferences {
  glassOpacity: number
  animationSpeed: AnimationSpeed
}

export const ACCENT_PRESETS = [
  { hue: 200, label: 'Sky' },
  { hue: 160, label: 'Teal' },
  { hue: 120, label: 'Green' },
  { hue: 50, label: 'Gold' },
  { hue: 320, label: 'Pink' },
  { hue: 270, label: 'Purple' },
  { hue: 0, label: 'Red' },
  { hue: 30, label: 'Orange' },
]

const STORAGE_KEY = 'cs2-bot-improver.accent'
const PREFS_KEY = 'cs2-bot-improver.theme-prefs'

export function loadAccent(): CustomAccent {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { hue: 200 }
}

export function saveAccent(accent: CustomAccent) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accent))
}

export function loadThemePreferences(): ThemePreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { glassOpacity: 1, animationSpeed: 'normal' }
}

export function saveThemePreferences(prefs: ThemePreferences) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

function glassAlpha(value: number): number {
  return 0.35 + 0.65 * value
}

export function applyAccentToDocument(hue: number, mode: ThemeMode, prefs?: ThemePreferences) {
  const sat = 85
  const light = mode === 'dark' ? 55 : 45
  const accent = `hsl(${hue}, ${sat}%, ${light}%)`
  const accentLight = `hsl(${hue}, ${sat}%, ${light + 10}%)`
  const accentAlpha = (a: number) => `hsla(${hue}, ${sat}%, ${light}%, ${a})`
  
  const root = document.documentElement.style
  root.setProperty('--color-accent', accent)
  root.setProperty('--color-info', accent)
  root.setProperty('--active-border', accentAlpha(0.4))
  root.setProperty('--active-bg', accentAlpha(0.1))
  root.setProperty('--nav-indicator', accent)
  root.setProperty('--primary-bg', `linear-gradient(135deg, hsl(${hue},90%,35%), hsl(${hue},85%,${light}%))`)
  root.setProperty('--primary-shadow', `0 6px 24px ${accentAlpha(0.3)}`)
  root.setProperty('--eyebrow-color', accentLight)

  if (prefs) {
    root.setProperty('--anim-speed', prefs.animationSpeed === 'normal' ? '1' : prefs.animationSpeed === 'reduced' ? '0.4' : '0')
    const ga = glassAlpha(prefs.glassOpacity)
    if (mode === 'dark') {
      root.setProperty('--glass-bg', `rgba(15, 23, 42, ${(0.58 * ga).toFixed(3)})`)
    } else {
      root.setProperty('--glass-bg', `rgba(255, 255, 255, ${(0.70 * ga).toFixed(3)})`)
    }
  }

  if (mode === 'dark') {
    root.setProperty('--app-bg', `radial-gradient(circle at 18% 0%, ${accentAlpha(0.14)}, transparent 30%), linear-gradient(180deg, #020617, #07111f 54%, #020617)`)
    root.setProperty('--titlebar-bg', `linear-gradient(90deg, ${accentAlpha(0.1)}, rgba(56,189,248,0.05), transparent 66%), rgba(2,6,23,0.88)`)
    root.setProperty('--hero-bg', `linear-gradient(135deg, ${accentAlpha(0.12)}, rgba(56,189,248,0.08)), rgba(15,23,42,0.72)`)
  } else {
    root.setProperty('--app-bg', '')
    root.setProperty('--titlebar-bg', '')
    root.setProperty('--hero-bg', '')
  }
}
