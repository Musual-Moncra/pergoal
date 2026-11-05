import { KhoDuLieu } from '../domain/KhoDuLieu';
import { taoMuoiNgauNhien, bamMatKhauPBKDF2 } from '../domain/BaoMat';
import { NguoiDung } from '../domain/types';

export class TaiKhoanController {
  /**
   * UC01: dangKy(tenDangNhap, matKhau, tenHienThi)
   * Ràng buộc BR01: tenDangNhap duy nhất; matKhau >= 8 ký tự.
   * Băm PBKDF2 bằng WebCrypto có salt.
   */
  public static async dangKy(
    tenDangNhap: string,
    matKhau: string,
    tenHienThi: string
  ): Promise<{ success: boolean; message: string }> {
    const cleanUser = tenDangNhap.trim().toLowerCase();
    if (!cleanUser) {
      return { success: false, message: 'Tên đăng nhập không được để trống.' };
    }
    if (matKhau.length < 8) {
      return { success: false, message: 'Mật khẩu phải có độ dài tối thiểu 8 ký tự (BR01).' };
    }

    const daTonTai = KhoDuLieu.timNguoiDung(cleanUser);
    if (daTonTai) {
      return { success: false, message: 'Tên đăng nhập đã tồn tại trên thiết bị (BR01).' };
    }

    const salt = await taoMuoiNgauNhien();
    const matKhauBam = await bamMatKhauPBKDF2(matKhau, salt);

    const nguoiDungMoi: NguoiDung = {
      tenDangNhap: cleanUser,
      tenHienThi: tenHienThi.trim() || cleanUser,
      ngayTao: new Date().toISOString(),
      matKhauBam,
      salt
    };

    KhoDuLieu.luuNguoiDung(nguoiDungMoi);
    return { success: true, message: 'Đăng ký tài khoản cục bộ thành công!' };
  }

  /**
   * UC02: dangNhap(tenDangNhap, matKhau)
   * Ràng buộc BR01, BR02: xác thực băm PBKDF2, lưu phiên cục bộ.
   */
  public static async dangNhap(
    tenDangNhap: string,
    matKhau: string
  ): Promise<{ success: boolean; message: string; user?: NguoiDung }> {
    const cleanUser = tenDangNhap.trim().toLowerCase();
    const user = KhoDuLieu.timNguoiDung(cleanUser);
    if (!user) {
      return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' };
    }

    const matKhauBam = await bamMatKhauPBKDF2(matKhau, user.salt);
    if (matKhauBam !== user.matKhauBam) {
      return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' };
    }

    KhoDuLieu.luuPhienDangNhap(user.tenDangNhap);
    return { success: true, message: 'Đăng nhập thành công!', user };
  }

  /**
   * UC03: dangXuat()
   */
  public static dangXuat(): void {
    KhoDuLieu.xoaPhienDangNhap();
  }

  public static layNguoiDungHienTai(): NguoiDung | null {
    const username = KhoDuLieu.layPhienDangNhap();
    if (!username) return null;
    return KhoDuLieu.timNguoiDung(username);
  }
}
