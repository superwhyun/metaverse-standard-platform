// Edge Runtime 호환 암호화 유틸리티 (Web Crypto API 사용)

// 비밀번호 해싱을 위한 salt
const SALT = 'metaverse-standards-platform-salt-2025';

// 비밀번호 해시 생성
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + SALT);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

// 비밀번호 검증
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === hash;
}

// 테스트용 함수 - admin123의 해시 생성
export async function getAdmin123Hash(): Promise<string> {
  return await hashPassword('admin123');
}