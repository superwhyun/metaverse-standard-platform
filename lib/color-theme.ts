// 색상 테마 설정 타입 및 유틸리티 함수

export interface ColorThemeConfig {
  light: {
    cardBackground: string;
    cardBorder: string;
    cardForeground?: string; // 자동 계산됨
  };
  dark: {
    cardBackground: string;
    cardBorder: string;
    cardForeground?: string; // 자동 계산됨
  };
}

// 색상의 밝기를 계산하여 적절한 텍스트 색상 반환
export function getContrastColor(hexColor: string): string {
  // # 제거
  const hex = hexColor.replace('#', '');

  // RGB 값 추출
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // 상대적 밝기 계산 (WCAG 공식)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // 밝기가 0.5 이상이면 검은색, 미만이면 흰색
  // 더 부드러운 그라데이션을 위해 회색 톤 사용
  if (luminance > 0.5) {
    // 밝은 배경 -> 어두운 텍스트
    return '#1f2937'; // gray-800
  } else {
    // 어두운 배경 -> 밝은 텍스트
    return '#f9fafb'; // gray-50
  }
}

// 깔끔하고 모던하며 대비가 명확한 디폴트 색상
export const DEFAULT_COLOR_THEME: ColorThemeConfig = {
  light: {
    cardBackground: '#ffffff',    // 순수 흰색 배경
    cardBorder: '#d1d5db',         // 명확한 회색 테두리 (gray-300)
  },
  dark: {
    cardBackground: 'hsl(224 60% 9%)',     // 원래의 아주 어두운 네이비 배경 (Original Dark)
    cardBorder: 'hsl(216 34% 17%)',         // 원래의 어두운 테두리
  },
};

const STORAGE_KEY = 'color-theme-config-v2'; // Key changed to force reset user cache

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

  // 배경색과 테두리색 적용
  root.style.setProperty('--card', colors.cardBackground);
  root.style.setProperty('--border', colors.cardBorder);

  // 텍스트 색상 자동 계산 및 적용
  const foregroundColor = colors.cardForeground || getContrastColor(colors.cardBackground);
  root.style.setProperty('--card-foreground', foregroundColor);
}

// 디폴트 색상으로 리셋
export function resetColorTheme(): void {
  saveColorTheme(DEFAULT_COLOR_THEME);

  const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  applyColorTheme(DEFAULT_COLOR_THEME, theme);
}
