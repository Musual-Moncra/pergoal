import { KhoDuLieu } from '../domain/KhoDuLieu';
import { NhiemVu, NhacNho, UuTien } from '../domain/types';
import { BoKiemTraHanMuc } from '../domain/BoKiemTraHanMuc';

interface NhiemVuChoXacNhan {
  tenDangNhap: string;
  maMucTieu: string;
  ten: string;
  moTa: string;
  hanChot: string;
  uuTien: UuTien;
  uocLuongGio: number;
  maHanMucViPham: string[];
}

export class NhiemVuController {
  private static danhSachChoXacNhan = new Map<string, NhiemVuChoXacNhan>();

  /**
   * UC07: taoNhiemVu(maMucTieu, ten, moTa, hanChot, uuTien, uocLuongGio)
   * Kiểm tra cơ bản theo BR04, BR05:
   * - BR04: ten bắt buộc; uocLuongGio > 0; hanChot nằm trong [ngayBatDau, ngayKetThuc] của MucTieu — sai thì từ chối, không cho ghi đè.
   * - BR05: Không tạo NhiemVu mới trong MucTieu có trạng thái HOAN_THANH hoặc DA_HUY.
   * - BR08, BR09: Nếu vi phạm hạn mức -> chưa ghi gì, lưu nhiệm vụ chờ và trả danh sách vi phạm để người dùng xác nhận.
   * - Nếu hợp lệ -> tạo và lưu nhiệm vụ ngay.
   */
  public static taoNhiemVu(
    tenDangNhap: string,
    maMucTieu: string,
    ten: string,
    moTa: string,
    hanChot: string,
    uuTien: UuTien,
    uocLuongGio: number
  ): {
    success: boolean;
    message: string;
    nhiemVu?: NhiemVu;
    canhBaoHanMuc?: string[];
  } {
    const data = KhoDuLieu.layDuLieu(tenDangNhap);
    const mt = data.mucTieu.find(m => m.id === maMucTieu);
    if (!mt) {
      return { success: false, message: 'Mục tiêu không tồn tại.' };
    }

    // BR05: Không tạo trong mục tiêu đã kết thúc
    if (mt.trangThai === 'HOAN_THANH' || mt.trangThai === 'DA_HUY') {
      return {
        success: false,
        message: `Không thể tạo nhiệm vụ mới trong mục tiêu đã ở trạng thái ${mt.trangThai} (BR05).`
      };
    }

    // BR04: Kiểm tra tên, thời hạn, giờ ước lượng
    const cleanTen = ten.trim();
    if (!cleanTen) {
      return { success: false, message: 'Tên nhiệm vụ là bắt buộc (BR04).' };
    }
    if (uocLuongGio <= 0) {
      return { success: false, message: 'Thời gian ước lượng phải là số dương lớn hơn 0 (BR04).' };
    }
    if (hanChot < mt.ngayBatDau || hanChot > mt.ngayKetThuc) {
      return {
        success: false,
        message: `Hạn chót nhiệm vụ (${hanChot}) phải nằm trong khoảng thời gian mục tiêu [${mt.ngayBatDau} đến ${mt.ngayKetThuc}] (BR04 - Từ chối, không thể ghi đè).`
      };
    }

    // BR08: Kiểm tra hạn mức
    const dsHanMucCuaMT = data.hanMuc.filter(hm => hm.maMucTieu === maMucTieu);
    const dsNVCuaMT = data.nhiemVu.filter(nv => nv.maMucTieu === maMucTieu);
    const ketQuaBR08 = BoKiemTraHanMuc.kiemTra(
      dsHanMucCuaMT,
      dsNVCuaMT,
      { hanChot, uocLuongGio }
    );

    // BR09: Vi phạm BR08 -> Chưa ghi gì, giữ nhiệm vụ chờ xác nhận
    if (!ketQuaBR08.hopLe) {
      this.danhSachChoXacNhan.set(tenDangNhap, {
        tenDangNhap,
        maMucTieu,
        ten: cleanTen,
        moTa: moTa.trim(),
        hanChot,
        uuTien,
        uocLuongGio,
        maHanMucViPham: ketQuaBR08.maHanMucViPham
      });

      return {
        success: false,
        message: 'Phát hiện vượt hạn mức quy định (BR08). Vui lòng xác nhận ghi đè.',
        canhBaoHanMuc: ketQuaBR08.danhSachViPham
      };
    }

    // Không vi phạm -> Tạo và lưu ngay
    const id = 'nv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const nv: NhiemVu = {
      id,
      maMucTieu,
      ten: cleanTen,
      moTa: moTa.trim(),
      hanChot,
      uuTien,
      trangThai: 'CHUA_LAM',
      uocLuongGio,
      daGhiDeHanMuc: false
    };

    data.nhiemVu.push(nv);
    KhoDuLieu.luuDuLieu(tenDangNhap, data);
    return { success: true, message: 'Tạo nhiệm vụ thành công!', nhiemVu: nv };
  }

  /**
   * UC07: xacNhanVuotHanMuc(dongY)
   * BR09: dongY = true thì tạo NV với daGhiDeHanMuc = true và sinh một NhacNho VUOT_HAN_MUC cho MỖI hạn mức bị vi phạm.
   * dongY = false thì hủy bỏ, không tạo gì.
   */
  public static xacNhanVuotHanMuc(
    tenDangNhap: string,
    dongY: boolean
  ): { success: boolean; message: string; nhiemVu?: NhiemVu } {
    const cho = this.danhSachChoXacNhan.get(tenDangNhap);
    if (!cho) {
      return { success: false, message: 'Không có nhiệm vụ nào đang chờ xác nhận vượt hạn mức.' };
    }

    this.danhSachChoXacNhan.delete(tenDangNhap);

    if (!dongY) {
      return { success: false, message: 'Đã hủy bỏ tạo nhiệm vụ theo yêu cầu.' };
    }

    const data = KhoDuLieu.layDuLieu(tenDangNhap);
    const id = 'nv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const nv: NhiemVu = {
      id,
      maMucTieu: cho.maMucTieu,
      ten: cho.ten,
      moTa: cho.moTa,
      hanChot: cho.hanChot,
      uuTien: cho.uuTien,
      trangThai: 'CHUA_LAM',
      uocLuongGio: cho.uocLuongGio,
      daGhiDeHanMuc: true
    };

    data.nhiemVu.push(nv);

    // Sinh một NhacNho VUOT_HAN_MUC cho MỖI hạn mức bị vi phạm (BR09 v1.3)
    const dsHanMuc = data.hanMuc.filter(hm => hm.maMucTieu === cho.maMucTieu);
    for (const maHM of cho.maHanMucViPham) {
      const hmObj = dsHanMuc.find(h => h.id === maHM);
      const idNN = 'nn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const nn: NhacNho = {
        id: idNN,
        tenDangNhap,
        loai: 'VUOT_HAN_MUC',
        noiDung: `Nhiệm vụ "${nv.ten}" được tạo với ghi đè hạn mức ${hmObj ? hmObj.loai : maHM}.`,
        thoiDiemTao: new Date().toISOString(),
        daDoc: false,
        maNhiemVu: nv.id,
        maHanMuc: maHM
      };
      data.nhacNho.push(nn);
    }

    KhoDuLieu.luuDuLieu(tenDangNhap, data);
    return { success: true, message: 'Đã xác nhận ghi đè và tạo nhiệm vụ thành công!', nhiemVu: nv };
  }

  /**
   * UC08: capNhatNhiemVu(maNhiemVu, thongTinMoi)
   * BR08, BR09: Chưa ghi gì khi vi phạm và chưa xác nhận.
   */
  public static capNhatNhiemVu(
    tenDangNhap: string,
    maNhiemVu: string,
    thongTinMoi: Partial<Omit<NhiemVu, 'id' | 'maMucTieu'>>,
    xacNhanGhiDe = false
  ): { success: boolean; message: string; canhBaoHanMuc?: string[] } {
    const data = KhoDuLieu.layDuLieu(tenDangNhap);
    const nv = data.nhiemVu.find(n => n.id === maNhiemVu);
    if (!nv) {
      return { success: false, message: 'Nhiệm vụ không tồn tại.' };
    }

    const mt = data.mucTieu.find(m => m.id === nv.maMucTieu);
    if (!mt) {
      return { success: false, message: 'Mục tiêu chứa nhiệm vụ không tồn tại.' };
    }

    const tenMoi = thongTinMoi.ten !== undefined ? thongTinMoi.ten.trim() : nv.ten;
    if (!tenMoi) {
      return { success: false, message: 'Tên nhiệm vụ không được để trống (BR04).' };
    }

    const uocLuongMoi = thongTinMoi.uocLuongGio !== undefined ? thongTinMoi.uocLuongGio : nv.uocLuongGio;
    if (uocLuongMoi <= 0) {
      return { success: false, message: 'Ước lượng giờ phải lớn hơn 0 (BR04).' };
    }

    const hanChotMoi = thongTinMoi.hanChot || nv.hanChot;
    if (hanChotMoi < mt.ngayBatDau || hanChotMoi > mt.ngayKetThuc) {
      return {
        success: false,
        message: `Hạn chót (${hanChotMoi}) phải nằm trong khoảng mục tiêu [${mt.ngayBatDau} đến ${mt.ngayKetThuc}] (BR04).`
      };
    }

    // Nếu đổi hạn chót hoặc ước lượng giờ, kiểm tra hạn mức BR08
    if (hanChotMoi !== nv.hanChot || uocLuongMoi !== nv.uocLuongGio) {
      const dsHanMuc = data.hanMuc.filter(hm => hm.maMucTieu === nv.maMucTieu);
      const dsNVCungMT = data.nhiemVu.filter(n => n.maMucTieu === nv.maMucTieu);
      const kt = BoKiemTraHanMuc.kiemTra(
        dsHanMuc,
        dsNVCungMT,
        { hanChot: hanChotMoi, uocLuongGio: uocLuongMoi },
        nv.id
      );

      // BR09: Chưa ghi gì khi vi phạm và chưa xác nhận
      if (!kt.hopLe && !xacNhanGhiDe) {
        return {
          success: false,
          message: 'Vi phạm hạn mức, chưa ghi nhận thay đổi (BR09).',
          canhBaoHanMuc: kt.danhSachViPham
        };
      }

      // Nếu xác nhận ghi đè vi phạm
      if (!kt.hopLe && xacNhanGhiDe) {
        thongTinMoi.daGhiDeHanMuc = true;
        for (const maHM of kt.maHanMucViPham) {
          const idNN = 'nn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
          data.nhacNho.push({
            id: idNN,
            tenDangNhap,
            loai: 'VUOT_HAN_MUC',
            noiDung: `Nhiệm vụ "${tenMoi}" cập nhật ghi đè hạn mức.`,
            thoiDiemTao: new Date().toISOString(),
            daDoc: false,
            maNhiemVu: nv.id,
            maHanMuc: maHM
          });
        }
      }
    }

    Object.assign(nv, thongTinMoi);
    KhoDuLieu.luuDuLieu(tenDangNhap, data);
    return { success: true, message: 'Cập nhật nhiệm vụ thành công!' };
  }

  /**
   * UC08: huyNhiemVu(maNhiemVu)
   */
  public static huyNhiemVu(
    tenDangNhap: string,
    maNhiemVu: string
  ): { success: boolean; message: string } {
    const data = KhoDuLieu.layDuLieu(tenDangNhap);
    const nv = data.nhiemVu.find(n => n.id === maNhiemVu);
    if (!nv) {
      return { success: false, message: 'Nhiệm vụ không tồn tại.' };
    }
    nv.trangThai = 'DA_HUY';
    KhoDuLieu.luuDuLieu(tenDangNhap, data);
    return { success: true, message: 'Hủy nhiệm vụ thành công!' };
  }

  /**
   * UC08: xoaNhiemVu(maNhiemVu)
   */
  public static xoaNhiemVu(
    tenDangNhap: string,
    maNhiemVu: string
  ): { success: boolean; message: string } {
    const data = KhoDuLieu.layDuLieu(tenDangNhap);
    data.nhiemVu = data.nhiemVu.filter(n => n.id !== maNhiemVu);
    data.banGhiTienDo = data.banGhiTienDo.filter(bg => bg.maNhiemVu !== maNhiemVu);
    KhoDuLieu.luuDuLieu(tenDangNhap, data);
    return { success: true, message: 'Xóa nhiệm vụ thành công!' };
  }
}
