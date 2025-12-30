'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
  useTheme,
} from 'next-themes'
import { loadColorTheme, applyColorTheme } from '@/lib/color-theme'

function ColorThemeApplier() {
  const { theme, resolvedTheme } = useTheme()

  React.useEffect(() => {
    // 테마가 로드되면 색상 테마 적용
    const currentTheme = (resolvedTheme || theme) as 'light' | 'dark'
    if (currentTheme === 'light' || currentTheme === 'dark') {
      const colorConfig = loadColorTheme()
      applyColorTheme(colorConfig, currentTheme)
    }
  }, [theme, resolvedTheme])

  return null
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ColorThemeApplier />
      {children}
    </NextThemesProvider>
  )
}
