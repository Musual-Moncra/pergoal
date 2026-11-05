import { KhoDuLieu } from '../domain/KhoDuLieu';

export class DuLieuController {
  /**
   * UC13: xuatDuLieu()
   */
  public static xuatDuLieu(tenDangNhap: string): string {
    return KhoDuLieu.xuatDuLieuJSON(tenDangNhap);
  }

  /**
   * UC13: nhapDuLieu(tepJson)
   * BR16: Kiểm tra cấu trúc tệp; tệp sai từ chối, dữ liệu cũ giữ nguyên; nhập hợp lệ thay thế sau khi xác nhận.
   */
  public static nhapDuLieu(
    tenDangNhap: string,
    noiDungJson: string
  ): { success: boolean; message: string } {
    const res = KhoDuLieu.nhapDuLieuJSON(tenDangNhap, noiDungJson);
    return {
      success: res.success,
      message: res.thongBao
    };
  }
}
