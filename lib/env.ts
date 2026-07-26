// Cloudflare Pages/Workers 환경 호환을 위한 환경변수 접근 헬퍼
//
// Next.js Edge 런타임에서는 process.env가 없을 수 있음. 일부 배포 환경에서는
// globalThis 혹은 __env__에 바인딩되므로 가능한 모든 위치를 점검한다.
export function getEnv(name: string): string | undefined {
  if (typeof process !== 'undefined' && process.env?.[name]) {
    return process.env[name];
  }

  const global = globalThis as Record<string, unknown> & { __env__?: Record<string, unknown> };
  const fromGlobal = global[name];
  if (typeof fromGlobal === 'string') {
    return fromGlobal;
  }

  const fromEnvBinding = global.__env__?.[name];
  return typeof fromEnvBinding === 'string' ? fromEnvBinding : undefined;
}
