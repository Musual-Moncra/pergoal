import { KhoDuLieu } from '../domain/KhoDuLieu';
import { NhiemVu, NhacNho, UuTien, TrangThaiNhiemVu } from '../domain/types';
import { BoKiemTraHanMuc } from '../domain/BoKiemTraHanMuc';

export class NhiemVuController {
  /**
   * UC07: taoNhiemVu
   * Kiểm tra cơ bản theo BR04, BR05:
   * - BR04: ten bắt buộc; uocLuongGio > 0; hanChot nằm trong [ngayBatDau, ngayKetThuc] của MucTieu — sai thì từ chối, không cho ghi đè.
   * - BR05: Không tạo NhiemVu mới trong MucTieu có trạng thái HOAN_THANH hoặc DA_HUY.
   * - BR08: Kiểm tra hạn mức.
   */
  public static kiemTraTruocKhiTao(
    tenDangNhap: string,
    maMucTieu: string,
    ten: string,
    hanChot: string,
    uocLuongGio: number
  ): {
    hopLeCoBan: boolean;
    loiCoBan?: string;
    canhBaoHanMuc?: string[];
  } {
    const data = KhoDuLieu.layDuLieu(tenDangNhap);
    const mt = data.mucTieu.find(m => m.id === maMucTieu);
    if (!mt) {
      return { hopLeCoBan: false, loiCoBan: 'Mục tiêu không tồn tại.' };
    }

    // BR05: Không tạo trong mục tiêu đã kết thúc
    if (mt.trangThai === 'HOAN_THANH' || mt.trangThai === 'DA_HUY') {
      return {
        hopLeCoBan: false,
        loiCoBan: `Không thể tạo nhiệm vụ mới trong mục tiêu đã ở trạng thái ${mt.trangThai} (BR05).`
      };
    }

    // BR04: Kiểm tra tên, thời hạn, giờ ước lượng
    if (!ten.trim()) {
      return { hopLeCoBan: false, loiCoBan: 'Tên nhiệm vụ là bắt buộc (BR04).' };
    }
    if (uocLuongGio <= 0) {
      return { hopLeCoBan: false, loiCoBan: 'Thời gian ước lượng phải là số dương lớn hơn 0 (BR04).' };
    }
    if (hanChot < mt.ngayBatDau || hanChot > mt.ngayKetThuc) {
      return {
        hopLeCoBan: false,
        loiCoBan: `Hạn chót nhiệm vụ (${hanChot}) phải nằm trong khoảng thời gian mục tiêu [${mt.ngayBatDau} đến ${mt.ngayKetThuc}] (BR04 - Từ chối, không thể ghi đè).`
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

    return {
      hopLeCoBan: true,
      canhBaoHanMuc: ketQuaBR08.hopLe ? undefined : ketQuaBR08.danhSachViPham
    };
  }

  /**
   * Thực hiện lưu nhiệm vụ (dùng khi không vi phạm hạn mức hoặc khi người dùng đã xác nhận ghi đè BR09)
   */
  public static thucHienTaoNhiemVu(
    tenDangNhap: string,
    maMucTieu: string,
    ten: string,
    moTa: string,
    hanChot: string,
    uuTien: UuTien,
    uocLuongGio: number,
    daGhiDeHanMuc: boolean,
    danhSachViPham?: string[]
  ): { success: boolean; message: string; nhiemVu?: NhiemVu } {
    const data = KhoDuLieu.layDuLieu(tenDangNhap);
    const id = 'nv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const nv: NhiemVu = {
      id,
      maMucTieu,
      ten: ten.trim(),
      moTa: moTa.trim(),
      hanChot,
      uuTien,
      trangThai: 'CHUA_LAM',
      uocLuongGio,
      daGhiDeHanMuc
    };

    data.nhiemVu.push(nv);

    // BR09: Nếu người dùng xác nhận ghi đè -> sinh một NhacNho VUOT_HAN_MUC cho mỗi hạn mức bị vi phạm (có maHanMuc)
    if (daGhiDeHanMuc) {
      const dsHanMuc = data.hanMuc.filter(hm => hm.maMucTieu === maMucTieu);
      const dsNVCuaMT = data.nhiemVu.filter(n => n.maMucTieu === maMucTieu && n.id !== id);
      const kt = BoKiemTraHanMuc.kiemTra(dsHanMuc, dsNVCuaMT, { hanChot, uocLuongGio });

      const maViPhamList = kt.maHanMucViPham.length > 0
        ? kt.maHanMucViPham
        : (danhSachViPham && danhSachViPham.length > 0 ? dsHanMuc.map(h => h.id) : []);

      for (const maHM of maViPhamList) {
        const idNN = 'nn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const hmObj = dsHanMuc.find(h => h.id === maHM);
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
    }

    KhoDuLieu.luuDuLieu(tenDangNhap, data);
    return { success: true, message: 'Tạo nhiệm vụ thành công!', nhiemVu: nv };
  }

  /**
   * UC08: capNhatNhiemVu
   * BR08, BR09: Chưa ghi gì khi vi phạm và chưa xác nhận!
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
