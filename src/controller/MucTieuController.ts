import { KhoDuLieu } from '../domain/KhoDuLieu';
import { MucTieu, DanhMuc, UuTien, TrangThaiMucTieu } from '../domain/types';

export class MucTieuController {
  /**
   * UC04: taoMucTieu(ten, moTa, maDanhMuc, ngayBatDau, ngayKetThuc, uuTien)
   * BR03: ten bắt buộc; ngayKetThuc >= ngayBatDau. Trạng thái ban đầu DANG_THUC_HIEN.
   */
  public static taoMucTieu(
    tenDangNhap: string,
    ten: string,
    moTa: string,
    maDanhMuc: string | null | undefined,
    ngayBatDau: string,
    ngayKetThuc: string,
    uuTien: UuTien
  ): { success: boolean; message: string; mucTieu?: MucTieu } {
    const cleanTen = ten.trim();
    if (!cleanTen) {
      return { success: false, message: 'Tên mục tiêu là bắt buộc (BR03).' };
    }
    if (!ngayBatDau || !ngayKetThuc) {
      return { success: false, message: 'Ngày bắt đầu và ngày kết thúc là bắt buộc.' };
    }
    if (ngayKetThuc < ngayBatDau) {
      return { success: false, message: 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu (BR03).' };
    }

    const data = KhoDuLieu.layDuLieu(tenDangNhap);
    const id = 'mt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const mt: MucTieu = {
      id,
      ten: cleanTen,
      moTa: moTa.trim(),
      maDanhMuc: maDanhMuc || null,
      ngayBatDau,
      ngayKetThuc,
      uuTien,
      trangThai: 'DANG_THUC_HIEN',
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
      return { success: false, message: 'Tên mục tiêu không được để trống (BR03).' };
    }

    const ngayBD = thongTinMoi.ngayBatDau || mt.ngayBatDau;
    const ngayKT = thongTinMoi.ngayKetThuc || mt.ngayKetThuc;
    if (ngayKT < ngayBD) {
      return { success: false, message: 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu (BR03).' };
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
   * Quan hệ Composition: Xoá MucTieu thì xoá NhiemVu và HanMuc trực thuộc.
   */
  public static xoaMucTieu(
    tenDangNhap: string,
    maMucTieu: string
  ): { success: boolean; message: string } {
    const data = KhoDuLieu.layDuLieu(tenDangNhap);
    data.mucTieu = data.mucTieu.filter(m => m.id !== maMucTieu);
    // Xoá nhiệm vụ và hạn mức thuộc mục tiêu này
    data.nhiemVu = data.nhiemVu.filter(nv => nv.maMucTieu !== maMucTieu);
    data.hanMuc = data.hanMuc.filter(hm => hm.maMucTieu !== maMucTieu);

    KhoDuLieu.luuDuLieu(tenDangNhap, data);
    return { success: true, message: 'Xóa mục tiêu thành công!' };
  }

  /**
   * UC06: taoDanhMuc(ten, mauSac)
   */
  public static taoDanhMuc(
    tenDangNhap: string,
    ten: string,
    mauSac: string
  ): { success: boolean; message: string; danhMuc?: DanhMuc } {
    const cleanTen = ten.trim();
    if (!cleanTen) {
      return { success: false, message: 'Tên danh mục là bắt buộc.' };
    }

    const data = KhoDuLieu.layDuLieu(tenDangNhap);
    const id = 'dm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const dm: DanhMuc = {
      id,
      ten: cleanTen,
      mauSac: mauSac || '#3b82f6',
      tenDangNhap
    };

    data.danhMuc.push(dm);
    KhoDuLieu.luuDuLieu(tenDangNhap, data);
    return { success: true, message: 'Tạo danh mục thành công!', danhMuc: dm };
  }

  /**
   * UC06: xoaDanhMuc(maDanhMuc)
   * BR17: xoaDanhMuc: MucTieu đang gán về “không danh mục”, không bị xoá.
   */
  public static xoaDanhMuc(
    tenDangNhap: string,
    maDanhMuc: string
  ): { success: boolean; message: string } {
    const data = KhoDuLieu.layDuLieu(tenDangNhap);
    data.danhMuc = data.danhMuc.filter(dm => dm.id !== maDanhMuc);
    
    // Đặt lại các mục tiêu có maDanhMuc này về null
    data.mucTieu.forEach(mt => {
      if (mt.maDanhMuc === maDanhMuc) {
        mt.maDanhMuc = null;
      }
    });

    KhoDuLieu.luuDuLieu(tenDangNhap, data);
    return { success: true, message: 'Xóa danh mục thành công! Các mục tiêu liên quan đã chuyển về Không danh mục (BR17).' };
  }
}
