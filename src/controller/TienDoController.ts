import { KhoDuLieu } from '../domain/KhoDuLieu';
import { BanGhiTienDo } from '../domain/types';

export class TienDoController {
  /**
   * UC10: capNhatTienDo(maNhiemVu, phanTram, soGioThucTe, ghiChu)
   * BR11: phanTram trong 0..100; soGioThucTe >= 0.
   * phanTram < 100 thì NV chuyển DANG_LAM. phanTram = 100 tương đương hoanThanhNhiemVu.
   * BR12: NV DA_HUY / đã HOAN_THANH không cập nhật được.
   */
  public static capNhatTienDo(
    tenDangNhap: string,
    maNhiemVu: string,
    phanTram: number,
    soGioThucTe: number,
    ghiChu?: string
  ): { success: boolean; message: string; banGhi?: BanGhiTienDo } {
    if (phanTram < 0 || phanTram > 100) {
      return { success: false, message: 'Phần trăm hoàn thành phải từ 0 đến 100% (BR11).' };
    }
    if (soGioThucTe < 0) {
      return { success: false, message: 'Số giờ thực tế phải lớn hơn hoặc bằng 0 (BR11).' };
    }

    const data = KhoDuLieu.layDuLieu(tenDangNhap);
    const nv = data.nhiemVu.find(n => n.id === maNhiemVu);
    if (!nv) {
      return { success: false, message: 'Nhiệm vụ không tồn tại.' };
    }

    // BR12: NV DA_HUY/đã HOAN_THANH không cập nhật được
    if (nv.trangThai === 'DA_HUY' || nv.trangThai === 'HOAN_THANH') {
      return {
        success: false,
        message: `Nhiệm vụ đã ở trạng thái ${nv.trangThai}, không thể cập nhật tiến độ (BR12).`
      };
    }

    const homNay = new Date().toISOString().split('T')[0];
    const id = 'bg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const bg: BanGhiTienDo = {
      id,
      maNhiemVu,
      ngayGhi: homNay,
      phanTram,
      soGioThucTe,
      ghiChu: ghiChu?.trim()
    };

    data.banGhiTienDo.push(bg);

    // Cập nhật trạng thái nhiệm vụ (BR11, BR12)
    if (phanTram === 100) {
      nv.trangThai = 'HOAN_THANH';
      nv.ngayHoanThanh = homNay;
    } else {
      nv.trangThai = 'DANG_LAM';
    }

    KhoDuLieu.luuDuLieu(tenDangNhap, data);
    return { success: true, message: 'Cập nhật tiến độ thành công!', banGhi: bg };
  }

  /**
   * UC10: hoanThanhNhiemVu(maNhiemVu)
   * BR12: hoanThanhNhiemVu: trangThai=HOAN_THANH, ngayHoanThanh=homNay, thêm BanGhiTienDo phanTram=100.
   * NV DA_HUY/đã HOAN_THANH không cập nhật được.
   */
  public static hoanThanhNhiemVu(
    tenDangNhap: string,
    maNhiemVu: string,
    soGioThucTe = 0,
    ghiChu = 'Hoàn thành nhiệm vụ'
  ): { success: boolean; message: string } {
    const data = KhoDuLieu.layDuLieu(tenDangNhap);
    const nv = data.nhiemVu.find(n => n.id === maNhiemVu);
    if (!nv) {
      return { success: false, message: 'Nhiệm vụ không tồn tại.' };
    }

    if (nv.trangThai === 'DA_HUY' || nv.trangThai === 'HOAN_THANH') {
      return {
        success: false,
        message: `Nhiệm vụ đã ở trạng thái ${nv.trangThai}, không thể cập nhật (BR12).`
      };
    }

    const homNay = new Date().toISOString().split('T')[0];
    nv.trangThai = 'HOAN_THANH';
    nv.ngayHoanThanh = homNay;

    const id = 'bg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const bg: BanGhiTienDo = {
      id,
      maNhiemVu,
      ngayGhi: homNay,
      phanTram: 100,
      soGioThucTe: Math.max(0, soGioThucTe),
      ghiChu
    };

    data.banGhiTienDo.push(bg);
    KhoDuLieu.luuDuLieu(tenDangNhap, data);
    return { success: true, message: 'Hoàn thành nhiệm vụ thành công!' };
  }

  /**
   * UC10: ghiNhanChiTieu(maHanMuc, giaTriDinhLuong, ngayGhi, ghiChu)
   * BR13: ghiNhanChiTieu chỉ cho HanMuc loại CHI_TIEU_DINH_LUONG; giaTriDinhLuong > 0.
   */
  public static ghiNhanChiTieu(
    tenDangNhap: string,
    maHanMuc: string,
    giaTriDinhLuong: number,
    ngayGhi?: string,
    ghiChu?: string
  ): { success: boolean; message: string; banGhi?: BanGhiTienDo } {
    if (giaTriDinhLuong <= 0) {
      return { success: false, message: 'Giá trị định lượng phải lớn hơn 0 (BR13).' };
    }

    const data = KhoDuLieu.layDuLieu(tenDangNhap);
    const hm = data.hanMuc.find(h => h.id === maHanMuc);
    if (!hm) {
      return { success: false, message: 'Hạn mức không tồn tại.' };
    }
    if (hm.loai !== 'CHI_TIEU_DINH_LUONG') {
      return { success: false, message: 'Chỉ có thể ghi nhận cho hạn mức loại CHI_TIEU_DINH_LUONG (BR13).' };
    }

    const ngayChuan = ngayGhi || new Date().toISOString().split('T')[0];
    const id = 'bg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const bg: BanGhiTienDo = {
      id,
      maNhiemVu: '', // Ghi nhận trực tiếp cho chỉ tiêu hạn mức
      maHanMuc: hm.id,
      ngayGhi: ngayChuan,
      phanTram: 0,
      soGioThucTe: 0,
      giaTriDinhLuong,
      ghiChu: ghiChu?.trim()
    };

    data.banGhiTienDo.push(bg);
    KhoDuLieu.luuDuLieu(tenDangNhap, data);
    return { success: true, message: 'Ghi nhận chỉ tiêu thành công!', banGhi: bg };
  }
}
