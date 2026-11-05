import { NguoiDung, MucTieu, NhiemVu, BanGhiTienDo } from './types';

export interface DuLieuNguoiDung {
  mucTieu: MucTieu[];
  nhiemVu: NhiemVu[];
  banGhiTienDo: BanGhiTienDo[];
}

export class KhoDuLieu {
  private static readonly KEY_USERS = 'pergoal_v2_users';
  private static readonly KEY_SESSION = 'pergoal_v2_session_user';
  private static readonly PREFIX_DATA = 'pergoal_v2_data_';

  // --- QUẢN LÝ TÀI KHOẢN ---
  public static layTatCaNguoiDung(): NguoiDung[] {
    try {
      const raw = localStorage.getItem(this.KEY_USERS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public static luuNguoiDung(nguoiDung: NguoiDung): void {
    const list = this.layTatCaNguoiDung();
    const idx = list.findIndex(u => u.tenDangNhap === nguoiDung.tenDangNhap);
    if (idx >= 0) {
      list[idx] = nguoiDung;
    } else {
      list.push(nguoiDung);
    }
    localStorage.setItem(this.KEY_USERS, JSON.stringify(list));
  }

  public static timNguoiDung(tenDangNhap: string): NguoiDung | null {
    const list = this.layTatCaNguoiDung();
    return list.find(u => u.tenDangNhap === tenDangNhap) || null;
  }

  public static layPhienDangNhap(): string | null {
    return localStorage.getItem(this.KEY_SESSION);
  }

  public static luuPhienDangNhap(tenDangNhap: string): void {
    localStorage.setItem(this.KEY_SESSION, tenDangNhap);
  }

  public static xoaPhienDangNhap(): void {
    localStorage.removeItem(this.KEY_SESSION);
  }

  // --- QUẢN LÝ DỮ LIỆU ---
  private static getKeyData(tenDangNhap: string): string {
    return `${this.PREFIX_DATA}${tenDangNhap}`;
  }

  public static layDuLieu(tenDangNhap: string): DuLieuNguoiDung {
    try {
      const raw = localStorage.getItem(this.getKeyData(tenDangNhap));
      if (!raw) {
        return {
          mucTieu: [],
          nhiemVu: [],
          banGhiTienDo: []
        };
      }
      const parsed = JSON.parse(raw);
      return {
        mucTieu: Array.isArray(parsed.mucTieu) ? parsed.mucTieu : [],
        nhiemVu: Array.isArray(parsed.nhiemVu) ? parsed.nhiemVu : [],
        banGhiTienDo: Array.isArray(parsed.banGhiTienDo) ? parsed.banGhiTienDo : []
      };
    } catch {
      return {
        mucTieu: [],
        nhiemVu: [],
        banGhiTienDo: []
      };
    }
  }

  public static luuDuLieu(tenDangNhap: string, data: DuLieuNguoiDung): void {
    localStorage.setItem(this.getKeyData(tenDangNhap), JSON.stringify(data));
  }
}
