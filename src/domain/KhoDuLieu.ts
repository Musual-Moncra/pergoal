import {
  NguoiDung,
  DanhMuc,
  MucTieu,
  NhiemVu,
  HanMuc,
  BanGhiTienDo,
  NhacNho
} from './types';

export interface DuLieuNguoiDung {
  danhMuc: DanhMuc[];
  mucTieu: MucTieu[];
  nhiemVu: NhiemVu[];
  hanMuc: HanMuc[];
  banGhiTienDo: BanGhiTienDo[];
  nhacNho: NhacNho[];
}

export class KhoDuLieu {
  private static readonly KEY_USERS = 'pergoal_users';
  private static readonly KEY_SESSION = 'pergoal_session_user';
  private static readonly PREFIX_DATA = 'pergoal_data_';

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

  // --- QUẢN LÝ DỮ LIỆU CỦA NGƯỜI DÙNG HIỆN TẠI ---
  private static getKeyData(tenDangNhap: string): string {
    return `${this.PREFIX_DATA}${tenDangNhap}`;
  }

  public static layDuLieu(tenDangNhap: string): DuLieuNguoiDung {
    try {
      const raw = localStorage.getItem(this.getKeyData(tenDangNhap));
      if (!raw) {
        return {
          danhMuc: [],
          mucTieu: [],
          nhiemVu: [],
          hanMuc: [],
          banGhiTienDo: [],
          nhacNho: []
        };
      }
      const parsed = JSON.parse(raw);
      return {
        danhMuc: Array.isArray(parsed.danhMuc) ? parsed.danhMuc : [],
        mucTieu: Array.isArray(parsed.mucTieu) ? parsed.mucTieu : [],
        nhiemVu: Array.isArray(parsed.nhiemVu) ? parsed.nhiemVu : [],
        hanMuc: Array.isArray(parsed.hanMuc) ? parsed.hanMuc : [],
        banGhiTienDo: Array.isArray(parsed.banGhiTienDo) ? parsed.banGhiTienDo : [],
        nhacNho: Array.isArray(parsed.nhacNho) ? parsed.nhacNho : []
      };
    } catch {
      return {
        danhMuc: [],
        mucTieu: [],
        nhiemVu: [],
        hanMuc: [],
        banGhiTienDo: [],
        nhacNho: []
      };
    }
  }

  public static luuDuLieu(tenDangNhap: string, data: DuLieuNguoiDung): void {
    localStorage.setItem(this.getKeyData(tenDangNhap), JSON.stringify(data));
  }

  // --- XUẤT / NHẬP JSON (UC13, BR16) ---
  public static xuatDuLieuJSON(tenDangNhap: string): string {
    const data = this.layDuLieu(tenDangNhap);
    const goiDuLieu = {
      app: 'Pergoal',
      version: '1.0.0',
      tenDangNhap,
      thoiDiemXuat: new Date().toISOString(),
      duLieu: data
    };
    return JSON.stringify(goiDuLieu, null, 2);
  }

  public static kiemTraCauTrucDuLieu(jsonString: string): { hopLe: boolean; duLieu?: DuLieuNguoiDung; loi?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { hopLe: false, loi: 'Tệp không phải là đối tượng JSON hợp lệ.' };
      }
      const data = parsed.duLieu || parsed; // Hỗ trợ cả gói có metadata hoặc trực tiếp
      if (!data || typeof data !== 'object') {
        return { hopLe: false, loi: 'Không tìm thấy cấu trúc dữ liệu Pergoal.' };
      }

      // Kiểm tra các mảng cần thiết
      const requiredArrays = ['mucTieu', 'nhiemVu', 'hanMuc'];
      for (const key of requiredArrays) {
        if (!Array.isArray(data[key])) {
          return { hopLe: false, loi: `Thiếu hoặc sai định dạng trường bắt buộc: ${key}` };
        }
      }

      const duLieuChuan: DuLieuNguoiDung = {
        danhMuc: Array.isArray(data.danhMuc) ? data.danhMuc : [],
        mucTieu: data.mucTieu,
        nhiemVu: data.nhiemVu,
        hanMuc: data.hanMuc,
        banGhiTienDo: Array.isArray(data.banGhiTienDo) ? data.banGhiTienDo : [],
        nhacNho: Array.isArray(data.nhacNho) ? data.nhacNho : []
      };

      return { hopLe: true, duLieu: duLieuChuan };
    } catch (e: any) {
      return { hopLe: false, loi: `Lỗi đọc JSON: ${e.message}` };
    }
  }

  public static nhapDuLieuJSON(tenDangNhap: string, jsonString: string): { success: boolean; thongBao: string } {
    const kt = this.kiemTraCauTrucDuLieu(jsonString);
    if (!kt.hopLe || !kt.duLieu) {
      return { success: false, thongBao: kt.loi || 'Cấu trúc tệp không đúng, dữ liệu cũ được giữ nguyên.' };
    }

    // Đảm bảo dữ liệu gắn đúng với user đang đăng nhập
    const data = kt.duLieu;
    data.mucTieu.forEach(mt => mt.tenDangNhap = tenDangNhap);
    data.danhMuc.forEach(dm => dm.tenDangNhap = tenDangNhap);
    data.nhacNho.forEach(nn => nn.tenDangNhap = tenDangNhap);

    this.luuDuLieu(tenDangNhap, data);
    return { success: true, thongBao: 'Nhập dữ liệu thành công!' };
  }
}
