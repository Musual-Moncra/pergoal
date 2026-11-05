/**
 * Bộ phận xử lý mật khẩu an toàn theo quy tắc BR01:
 * - Mật khẩu >= 8 ký tự
 * - Băm PBKDF2 bằng WebCrypto API có salt ngẫu nhiên
 * - Tuyệt đối không lưu mật khẩu rõ
 */

export async function taoMuoiNgauNhien(): Promise<string> {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

export async function bamMatKhauPBKDF2(matKhau: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(matKhau),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const saltBuffer = new Uint8Array(
    saltHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const rawKey = await crypto.subtle.exportKey('raw', derivedKey);
  return Array.from(new Uint8Array(rawKey), b => b.toString(16).padStart(2, '0')).join('');
}
