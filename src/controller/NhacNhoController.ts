import { KhoDuLieu } from '../domain/KhoDuLieu';
import { NhacNho } from '../domain/types';

export class NhacNhoController {
  /**
   * Tính số ngày chênh lệch: ngayA - ngayB
   */
  private static chenhLechNgay(ngayA: string, ngayB: string): number {
    const da = new Date(ngayA).getTime();
    const db = new Date(ngayB).getTime();
    return Math.round((da - db) / (1000 * 60 * 60 * 24));
  }

  /**
   * UC12: kiemTraNhacNho(homNay)
   * BR14:
   * - SAP_DEN_HAN khi NV chưa xong và 0 ≤ hanChot − homNay ≤ 1 ngày.
   * - QUA_HAN khi NV chưa xong và hanChot < homNay.
   * - Mỗi NV tối đa một nhắc mỗi loại mỗi ngày.
   * BR15: Luôn hiển thị trong app; gửi Notification API nếu được cấp quyền.
   */
  public static kiemTraNhacNho(tenDangNhap: string, homNay: string): NhacNho[] {
    const data = KhoDuLieu.layDuLieu(tenDangNhap);
    const nhacNhoMoi: NhacNho[] = [];

    // Lọc các nhiệm vụ chưa xong và không bị hủy
    const nvChuaXong = data.nhiemVu.filter(
      nv => nv.trangThai === 'CHUA_LAM' || nv.trangThai === 'DANG_LAM'
    );

    for (const nv of nvChuaXong) {
      const diff = this.chenhLechNgay(nv.hanChot, homNay);

      // 1. Kiểm tra SAP_DEN_HAN (0 <= diff <= 1)
      if (diff >= 0 && diff <= 1) {
        // Kiểm tra xem hôm nay đã tạo nhắc SAP_DEN_HAN cho NV này chưa
        const daCoHomNay = data.nhacNho.some(
          nn =>
            nn.maNhiemVu === nv.id &&
            nn.loai === 'SAP_DEN_HAN' &&
            nn.thoiDiemTao.startsWith(homNay)
        );
        if (!daCoHomNay) {
          const nn: NhacNho = {
            id: 'nn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            tenDangNhap,
            loai: 'SAP_DEN_HAN',
            noiDung: `Nhiệm vụ "${nv.ten}" sắp đến hạn hoàn thành (${nv.hanChot}).`,
            thoiDiemTao: new Date().toISOString(),
            daDoc: false,
            maNhiemVu: nv.id
          };
          data.nhacNho.unshift(nn);
          nhacNhoMoi.push(nn);
        }
      }

      // 2. Kiểm tra QUA_HAN (diff < 0)
      if (diff < 0) {
        const daCoHomNay = data.nhacNho.some(
          nn =>
            nn.maNhiemVu === nv.id &&
            nn.loai === 'QUA_HAN' &&
            nn.thoiDiemTao.startsWith(homNay)
        );
        if (!daCoHomNay) {
          const nn: NhacNho = {
            id: 'nn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            tenDangNhap,
            loai: 'QUA_HAN',
            noiDung: `Nhiệm vụ "${nv.ten}" đã quá hạn ${Math.abs(diff)} ngày (hạn chót: ${nv.hanChot}).`,
            thoiDiemTao: new Date().toISOString(),
            daDoc: false,
            maNhiemVu: nv.id
          };
          data.nhacNho.unshift(nn);
          nhacNhoMoi.push(nn);
        }
      }
    }

    if (nhacNhoMoi.length > 0) {
      KhoDuLieu.luuDuLieu(tenDangNhap, data);
      // Gửi Notification API nếu được cấp quyền (BR15)
      this.guiNotificationTrinhDuyet(nhacNhoMoi);
    }

    return nhacNhoMoi;
  }

  /**
   * Gửi thông báo trình duyệt theo BR15
   */
  private static guiNotificationTrinhDuyet(danhSach: NhacNho[]): void {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      danhSach.forEach(nn => {
        try {
          new Notification('Pergoal - Nhắc nhở', {
            body: nn.noiDung,
            icon: '/pergoal/icon.svg'
          });
        } catch {
          // Bỏ qua lỗi trình duyệt
        }
      });
    }
  }

  /**
   * Yêu cầu cấp quyền Notification API
   */
  public static async yeuCauQuyenThongBao(): Promise<NotificationPermission | 'unsupported'> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return await Notification.requestPermission();
  }

  /**
   * UC12: danhDauDaDoc(maNhacNho)
   */
  public static danhDauDaDoc(tenDangNhap: string, maNhacNho: string): void {
    const data = KhoDuLieu.layDuLieu(tenDangNhap);
    const nn = data.nhacNho.find(n => n.id === maNhacNho);
    if (nn) {
      nn.daDoc = true;
      KhoDuLieu.luuDuLieu(tenDangNhap, data);
    }
  }

  /**
   * Đánh dấu đã đọc tất cả
   */
  public static danhDauDaDocTatCa(tenDangNhap: string): void {
    const data = KhoDuLieu.layDuLieu(tenDangNhap);
    data.nhacNho.forEach(nn => nn.daDoc = true);
    KhoDuLieu.luuDuLieu(tenDangNhap, data);
  }

  /**
   * Xóa một thông báo
   */
  public static xoaNhacNho(tenDangNhap: string, maNhacNho: string): void {
    const data = KhoDuLieu.layDuLieu(tenDangNhap);
    data.nhacNho = data.nhacNho.filter(nn => nn.id !== maNhacNho);
    KhoDuLieu.luuDuLieu(tenDangNhap, data);
  }
}
