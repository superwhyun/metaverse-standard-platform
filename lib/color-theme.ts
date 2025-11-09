// 색상 테마 설정 타입 및 유틸리티 함수

export interface ColorThemeConfig {
  light: {
    cardBackground: string;
    cardBorder: string;
  };
  dark: {
    cardBackground: string;
    cardBorder: string;
  };
}

// 깔끔하고 모던하며 대비가 명확한 디폴트 색상
export const DEFAULT_COLOR_THEME: ColorThemeConfig = {
  light: {
    cardBackground: '#ffffff',    // 순수 흰색 배경
    cardBorder: '#d1d5db',         // 명확한 회색 테두리 (gray-300)
  },
  dark: {
    cardBackground: '#1e293b',     // 진한 청회색 배경 (slate-800)
    cardBorder: '#475569',         // 밝은 회색 테두리 (slate-600)
  },
};

const STORAGE_KEY = 'color-theme-config';

// 로컬 스토리지에서 색상 테마 설정 로드
export function loadColorTheme(): ColorThemeConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_COLOR_THEME;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // 필수 필드 검증
      if (
        parsed.light?.cardBackground &&
        parsed.light?.cardBorder &&
        parsed.dark?.cardBackground &&
        parsed.dark?.cardBorder
      ) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to load color theme:', error);
  }

  return DEFAULT_COLOR_THEME;
}

// 로컬 스토리지에 색상 테마 설정 저장
export function saveColorTheme(config: ColorThemeConfig): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save color theme:', error);
  }
}

// CSS 변수에 색상 적용
export function applyColorTheme(config: ColorThemeConfig, theme: 'light' | 'dark'): void {
  if (typeof window === 'undefined') {
    return;
  }

  const root = document.documentElement;
  const colors = config[theme];

  root.style.setProperty('--card', colors.cardBackground);
  root.style.setProperty('--border', colors.cardBorder);
}

// 디폴트 색상으로 리셋
export function resetColorTheme(): void {
  saveColorTheme(DEFAULT_COLOR_THEME);

  const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  applyColorTheme(DEFAULT_COLOR_THEME, theme);
}
