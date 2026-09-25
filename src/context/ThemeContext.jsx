import { useCallback, useEffect, useMemo, useState } from 'react'
import { ThemeContext } from './theme-context.js'

export const THEME_KEY = 'shreeastro-theme'

function isTheme(value) {
  return value === 'light' || value === 'dark'
}

/** Stored choice wins; with nothing stored, follow the OS once; default light. */
function readInitialTheme() {
  if (typeof document !== 'undefined' && isTheme(document.documentElement.dataset.theme)) {
    return document.documentElement.dataset.theme
  }
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (isTheme(stored)) return stored
  } catch {
    /* storage unavailable */
  }
  try {
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark'
  } catch {
    /* matchMedia unavailable */
  }
  return 'light'
}

function applyTheme(theme) {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readInitialTheme)

  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      /* storage unavailable */
    }
  }, [theme])

  // keep several open tabs in sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === THEME_KEY && isTheme(e.newValue)) setThemeState(e.newValue)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setTheme = useCallback((next) => {
    if (isTheme(next)) setThemeState(next)
  }, [])

  const toggle = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme, setTheme, toggle])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
