import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../store/store'
import { chartTheme, type ChartTheme, type Mode } from './palette'

/**
 * Résout le thème effectif (clair/sombre), applique l'attribut `data-theme`
 * sur la racine et fournit les couleurs de graphiques correspondantes.
 */
export function useAppTheme(): { mode: Mode; theme: ChartTheme } {
  const { state } = useStore()
  const preference = state.settings.theme
  const [systemDark, setSystemDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const mode: Mode = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  useEffect(() => {
    const root = document.documentElement
    if (preference === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', preference)
  }, [preference])

  const theme = useMemo(() => chartTheme(mode), [mode])
  return { mode, theme }
}
