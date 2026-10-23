import { useCallback, useEffect, useMemo, useState } from 'react'
import { ThemeContext } from './theme'

const initialTheme = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#09090b' : '#fafafa')
    try {
      localStorage.setItem('theme', theme)
    } catch {
      // ignoré
    }
  }, [theme])

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])
  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
