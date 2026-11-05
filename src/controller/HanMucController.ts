import { KhoDuLieu } from '../domain/KhoDuLieu';
import { HanMuc, LoaiHanMuc } from '../domain/types';
import { BoKiemTraHanMuc } from '../domain/BoKiemTraHanMuc';
import { ngayDiaPhuong } from '../domain/NgayThang';

export class HanMucController {
  /**
   * UC09: thietLapHanMuc(maMucTieu, loai, giaTri, donVi)
   * BR06, BR07, BR10
   */
  public static thietLapHanMuc(
    tenDangNhap: string,
    maMucTieu: string,
    loai: LoaiHanMuc,
    giaTriInput: string | number,
    donViInput?: string
  ): {
    success: boolean;
    message: string;
    hanMuc?: HanMuc;
    viPhamHienCo?: string[];
  } {
    const data = KhoDuLieu.layDuLieu(tenDangNhap);
    const mt = data.mucTieu.find(m => m.id === maMucTieu);
    if (!mt) {
      return { success: false, message: 'Mục tiêu không tồn tại.' };
    }

    let giaTriChuan: string | number;
    let donViChuan = '';

    // Kiểm tra BR07
    if (loai === 'DEADLINE') {
      const ngayDL = String(giaTriInput).trim();
      if (!ngayDL) {
        return { success: false, message: 'Vui lòng chọn ngày cho hạn chót tổng (DEADLINE).' };
      }
      if (ngayDL < mt.ngayBatDau || ngayDL > mt.ngayKetThuc) {
        return {
          success: false,
          message: `Hạn chót DEADLINE (${ngayDL}) phải nằm trong khoảng thời gian mục tiêu [${mt.ngayBatDau} đến ${mt.ngayKetThuc}] (BR07).`
        };
      }
      giaTriChuan = ngayDL;
      donViChuan = 'ngày';
    } else if (loai === 'NV_TOI_DA_NGAY') {
      const num = Number(giaTriInput);
      if (!Number.isInteger(num) || num <= 0) {
        return { success: false, message: 'Số nhiệm vụ tối đa/ngày phải là số nguyên dương > 0 (BR07).' };
      }
      giaTriChuan = num;
      donViChuan = 'nhiệm vụ/ngày';
    } else if (loai === 'GIO_TOI_DA_TUAN') {
      const num = Number(giaTriInput);
      if (isNaN(num) || num <= 0) {
        return { success: false, message: 'Số giờ tối đa/tuần phải là số thực dương > 0 (BR07).' };
      }
      giaTriChuan = num;
      donViChuan = 'giờ/tuần';
    } else if (loai === 'CHI_TIEU_DINH_LUONG') {
      const num = Number(giaTriInput);
      if (isNaN(num) || num <= 0) {
        return { success: false, message: 'Chỉ tiêu định lượng phải là số dương > 0 (BR07).' };
      }
      if (!donViInput || !donViInput.trim()) {
        return { success: false, message: 'Vui lòng nhập đơn vị cho chỉ tiêu định lượng (ví dụ: km/tuần, trang/tuần) (BR07).' };
      }
      giaTriChuan = num;
      donViChuan = donViInput.trim();
    } else {
      return { success: false, message: 'Loại hạn mức không hợp lệ.' };
    }

    // BR06: DEADLINE, NV_TOI_DA_NGAY, GIO_TOI_DA_TUAN tối đa 1 cái (thiết lập lại thì thay thế)
    if (loai !== 'CHI_TIEU_DINH_LUONG') {
      data.hanMuc = data.hanMuc.filter(hm => !(hm.maMucTieu === maMucTieu && hm.loai === loai));
    }

    const id = 'hm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const homNay = ngayDiaPhuong();

    const hmMoi: HanMuc = {
      id,
      maMucTieu,
      loai,
      giaTri: giaTriChuan,
      donVi: donViChuan,
      ngayHieuLuc: homNay
    };

    data.hanMuc.push(hmMoi);

    // BR10: Không hồi tố, rà soát các NV hiện có nếu có vi phạm thì thông báo
    const dsNV = data.nhiemVu.filter(nv => nv.maMucTieu === maMucTieu);
    const viPhamHienCo = BoKiemTraHanMuc.raSoatViPhamHienCo(hmMoi, dsNV);

    KhoDuLieu.luuDuLieu(tenDangNhap, data);
    return {
      success: true,
      message: 'Thiết lập hạn mức thành công!',
      hanMuc: hmMoi,
      viPhamHienCo: viPhamHienCo.length > 0 ? viPhamHienCo : undefined
    };
  }

  /**
   * UC09: xoaHanMuc(maHanMuc)
   */
  public static xoaHanMuc(
    tenDangNhap: string,
    maHanMuc: string
  ): { success: boolean; message: string } {
    const data = KhoDuLieu.layDuLieu(tenDangNhap);
    data.hanMuc = data.hanMuc.filter(hm => hm.id !== maHanMuc);
    KhoDuLieu.luuDuLieu(tenDangNhap, data);
    return { success: true, message: 'Xóa hạn mức thành công!' };
  }
}
