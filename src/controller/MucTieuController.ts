import { KhoDuLieu } from '../domain/KhoDuLieu';
import { MucTieu, UuTien, TrangThaiMucTieu } from '../domain/types';
import { BoKiemTraNangSuat } from '../domain/BoKiemTraNangSuat';

export class MucTieuController {
  /**
   * UC04: taoMucTieu(ten, moTa, ngayBatDau, ngayKetThuc, uuTien, capDo)
   * BR03: ten bắt buộc; ngayKetThuc >= ngayBatDau. Trạng thái ban đầu DANG_THUC_HIEN. capDo mặc định 3.
   */
  public static taoMucTieu(
    tenDangNhap: string,
    ten: string,
    moTa: string,
    ngayBatDau: string,
    ngayKetThuc: string,
    uuTien: UuTien,
    capDo = 3
  ): { success: boolean; message: string; mucTieu?: MucTieu } {
    const cleanTen = ten.trim();
    if (!cleanTen) {
      return { success: false, message: 'Tên mục tiêu là bắt buộc.' };
    }
    if (!ngayBatDau || !ngayKetThuc) {
      return { success: false, message: 'Ngày bắt đầu và ngày kết thúc là bắt buộc.' };
    }
    if (ngayKetThuc < ngayBatDau) {
      return { success: false, message: 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.' };
    }

    const capDoChuan = Math.min(5, Math.max(1, Number(capDo) || 3));

    const data = KhoDuLieu.layDuLieu(tenDangNhap);
    const id = 'mt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const mt: MucTieu = {
      id,
      ten: cleanTen,
      moTa: moTa.trim(),
      ngayBatDau,
      ngayKetThuc,
      uuTien,
      trangThai: 'DANG_THUC_HIEN',
      capDo: capDoChuan,
      tenDangNhap
    };

    data.mucTieu.push(mt);
    KhoDuLieu.luuDuLieu(tenDangNhap, data);

    return { success: true, message: 'Tạo mục tiêu thành công!', mucTieu: mt };
  }

  /**
   * UC05: capNhatMucTieu(maMucTieu, thongTinMoi)
   */
  public static capNhatMucTieu(
    tenDangNhap: string,
    maMucTieu: string,
    thongTinMoi: Partial<Omit<MucTieu, 'id' | 'tenDangNhap'>>
  ): { success: boolean; message: string } {
    const data = KhoDuLieu.layDuLieu(tenDangNhap);
    const mt = data.mucTieu.find(m => m.id === maMucTieu);
    if (!mt) {
      return { success: false, message: 'Mục tiêu không tồn tại.' };
    }

    if (thongTinMoi.ten !== undefined && !thongTinMoi.ten.trim()) {
      return { success: false, message: 'Tên mục tiêu không được để trống.' };
    }

    const ngayBD = thongTinMoi.ngayBatDau || mt.ngayBatDau;
    const ngayKT = thongTinMoi.ngayKetThuc || mt.ngayKetThuc;
    if (ngayKT < ngayBD) {
      return { success: false, message: 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.' };
    }

    if (thongTinMoi.capDo !== undefined) {
      thongTinMoi.capDo = Math.min(5, Math.max(1, Number(thongTinMoi.capDo) || 3));
    }

    Object.assign(mt, thongTinMoi);
    KhoDuLieu.luuDuLieu(tenDangNhap, data);
    return { success: true, message: 'Cập nhật mục tiêu thành công!' };
  }

  /**
   * UC05: doiTrangThaiMucTieu(maMucTieu, trangThai)
   */
  public static doiTrangThaiMucTieu(
    tenDangNhap: string,
    maMucTieu: string,
    trangThai: TrangThaiMucTieu
  ): { success: boolean; message: string } {
    const data = KhoDuLieu.layDuLieu(tenDangNhap);
    const mt = data.mucTieu.find(m => m.id === maMucTieu);
    if (!mt) {
      return { success: false, message: 'Mục tiêu không tồn tại.' };
    }
    mt.trangThai = trangThai;
    KhoDuLieu.luuDuLieu(tenDangNhap, data);
    return { success: true, message: 'Đổi trạng thái mục tiêu thành công!' };
  }

  /**
   * UC05: xoaMucTieu(maMucTieu)
   * BR12: Xoá MucTieu thì xoá kèm NhiemVu và BanGhiTienDo sau khi người dùng xác nhận.
   */
  public static xoaMucTieu(
    tenDangNhap: string,
    maMucTieu: string
  ): { success: boolean; message: string } {
    const data = KhoDuLieu.layDuLieu(tenDangNhap);
    data.mucTieu = data.mucTieu.filter(m => m.id !== maMucTieu);

    // Lấy id của các nhiệm vụ thuộc mục tiêu này để xóa bản ghi tiến độ
    const nvIds = new Set(data.nhiemVu.filter(nv => nv.maMucTieu === maMucTieu).map(nv => nv.id));
    data.nhiemVu = data.nhiemVu.filter(nv => nv.maMucTieu !== maMucTieu);
    data.banGhiTienDo = data.banGhiTienDo.filter(bg => !nvIds.has(bg.maNhiemVu));

    KhoDuLieu.luuDuLieu(tenDangNhap, data);
    return { success: true, message: 'Xóa mục tiêu thành công!' };
  }

  /**
   * UC06: datMucNangSuat(maMucTieu, capDo)
   * BR06: capDo 1..5.
   * BR09: Đổi mức năng suất không hồi tố: không sửa/xoá NV đã có; nếu NV hiện có vượt mức mới thì báo cho người dùng biết.
   */
  public static datMucNangSuat(
    tenDangNhap: string,
    maMucTieu: string,
    capDo: number
  ): { success: boolean; message: string; viPhamHienCo?: string[] } {
    const data = KhoDuLieu.layDuLieu(tenDangNhap);
    const mt = data.mucTieu.find(m => m.id === maMucTieu);
    if (!mt) {
      return { success: false, message: 'Mục tiêu không tồn tại.' };
    }

    // BR06: capDo là số nguyên 1..5
    if (!Number.isInteger(capDo) || capDo < 1 || capDo > 5) {
      return { success: false, message: 'Mức năng suất phải từ 1 đến 5.' };
    }
    const capDoChuan = capDo;
    mt.capDo = capDoChuan;

    // BR09: Rà soát không hồi tố
    const dsNVCuaMT = data.nhiemVu.filter(nv => nv.maMucTieu === maMucTieu);
    const viPhamHienCo = BoKiemTraNangSuat.raSoatViPhamHienCo(capDoChuan, dsNVCuaMT);

    KhoDuLieu.luuDuLieu(tenDangNhap, data);
    return {
      success: true,
      message: `Đã đặt mức năng suất ${capDoChuan} ⚡!`,
      viPhamHienCo: viPhamHienCo.length > 0 ? viPhamHienCo : undefined
    };
  }
}
