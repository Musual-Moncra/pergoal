import { KhoDuLieu } from '../domain/KhoDuLieu';
import { NhiemVu, BanGhiTienDo, UuTien, ngayDiaPhuong } from '../domain/types';
import { BoKiemTraNangSuat } from '../domain/BoKiemTraNangSuat';

interface NhiemVuChoXacNhan {
  tenDangNhap: string;
  maMucTieu: string;
  ten: string;
  moTa: string;
  hanChot: string;
  uuTien: UuTien;
  uocLuongGio: number;
}

export class NhiemVuController {
  private static danhSachChoXacNhan = new Map<string, NhiemVuChoXacNhan>();

  /**
   * UC07: taoNhiemVu(maMucTieu, ten, moTa, hanChot, uuTien, uocLuongGio)
   * BR04, BR05, BR07, BR08
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
    canhBaoVuotMuc?: string[];
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
        message: `Không thể tạo nhiệm vụ mới trong mục tiêu đã kết thúc hoặc đã hủy.`
      };
    }

    // BR04: Kiểm tra tên, thời hạn, giờ ước lượng
    const cleanTen = ten.trim();
    if (!cleanTen) {
      return { success: false, message: 'Tên nhiệm vụ là bắt buộc.' };
    }
    if (uocLuongGio <= 0) {
      return { success: false, message: 'Thời gian ước lượng phải là số dương lớn hơn 0.' };
    }
    if (hanChot < mt.ngayBatDau || hanChot > mt.ngayKetThuc) {
      return {
        success: false,
        message: `Hạn chót nhiệm vụ (${hanChot}) phải nằm trong khoảng thời gian mục tiêu [${mt.ngayBatDau} đến ${mt.ngayKetThuc}].`
      };
    }

    // BR07: Kiểm tra mức năng suất
    const dsNVCuaMT = data.nhiemVu.filter(nv => nv.maMucTieu === maMucTieu);
    const kt = BoKiemTraNangSuat.kiemTra(
      mt.capDo,
      dsNVCuaMT,
      { hanChot, uocLuongGio }
    );

    // BR08: Vi phạm BR07 -> Chưa ghi gì, giữ nhiệm vụ chờ xác nhận
    if (!kt.hopLe) {
      this.danhSachChoXacNhan.set(tenDangNhap, {
        tenDangNhap,
        maMucTieu,
        ten: cleanTen,
        moTa: moTa.trim(),
        hanChot,
        uuTien,
        uocLuongGio
      });

      return {
        success: false,
        message: 'Nhiệm vụ vượt mức năng suất của mục tiêu. Vui lòng xác nhận ghi đè.',
        canhBaoVuotMuc: kt.danhSachViPham
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
      phanTram: 0,
      daVuotMucNangSuat: false
    };

    data.nhiemVu.push(nv);
    KhoDuLieu.luuDuLieu(tenDangNhap, data);
    return { success: true, message: 'Tạo nhiệm vụ thành công!', nhiemVu: nv };
  }

  /**
   * UC07: xacNhanVuotMuc(dongY)
   * BR08: dongY=true thì ghi với daVuotMucNangSuat=true; dongY=false thì không ghi.
   */
  public static xacNhanVuotMuc(
    tenDangNhap: string,
    dongY: boolean
  ): { success: boolean; message: string; nhiemVu?: NhiemVu } {
    const cho = this.danhSachChoXacNhan.get(tenDangNhap);
    if (!cho) {
      return { success: false, message: 'Không có nhiệm vụ nào đang chờ xác nhận vượt mức.' };
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
      phanTram: 0,
      daVuotMucNangSuat: true
    };

    data.nhiemVu.push(nv);
    KhoDuLieu.luuDuLieu(tenDangNhap, data);
    return { success: true, message: 'Đã xác nhận và tạo nhiệm vụ thành công!', nhiemVu: nv };
  }

  /**
   * UC08: capNhatNhiemVu(maNhiemVu, thongTinMoi)
   * BR07, BR08: Áp dụng như nhau khi capNhatNhiemVu đổi hanChot/uocLuongGio.
   */
  public static capNhatNhiemVu(
    tenDangNhap: string,
    maNhiemVu: string,
    thongTinMoi: Partial<Omit<NhiemVu, 'id' | 'maMucTieu'>>,
    xacNhanGhiDe = false
  ): { success: boolean; message: string; canhBaoVuotMuc?: string[] } {
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
      return { success: false, message: 'Tên nhiệm vụ không được để trống.' };
    }

    const uocLuongMoi = thongTinMoi.uocLuongGio !== undefined ? thongTinMoi.uocLuongGio : nv.uocLuongGio;
    if (uocLuongMoi <= 0) {
      return { success: false, message: 'Ước lượng giờ phải lớn hơn 0.' };
    }

    const hanChotMoi = thongTinMoi.hanChot || nv.hanChot;
    if (hanChotMoi < mt.ngayBatDau || hanChotMoi > mt.ngayKetThuc) {
      return {
        success: false,
        message: `Hạn chót (${hanChotMoi}) phải nằm trong khoảng mục tiêu [${mt.ngayBatDau} đến ${mt.ngayKetThuc}].`
      };
    }

    // Nếu đổi hạn chót hoặc ước lượng giờ, kiểm tra BR07
    if (hanChotMoi !== nv.hanChot || uocLuongMoi !== nv.uocLuongGio) {
      const dsNVCungMT = data.nhiemVu.filter(n => n.maMucTieu === nv.maMucTieu);
      const kt = BoKiemTraNangSuat.kiemTra(
        mt.capDo,
        dsNVCungMT,
        { hanChot: hanChotMoi, uocLuongGio: uocLuongMoi },
        nv.id
      );

      // BR08: Chưa ghi gì khi vi phạm và chưa xác nhận
      if (!kt.hopLe && !xacNhanGhiDe) {
        return {
          success: false,
          message: 'Vi phạm mức năng suất của mục tiêu, chưa ghi nhận thay đổi.',
          canhBaoVuotMuc: kt.danhSachViPham
        };
      }

      if (!kt.hopLe && xacNhanGhiDe) {
        thongTinMoi.daVuotMucNangSuat = true;
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

  /**
   * UC09: capNhatTienDo(maNhiemVu, phanTram, soGioThucTe, ghiChu)
   * BR10: phanTram trong 0..100; soGioThucTe >= 0. Mỗi lần cập nhật tạo một BanGhiTienDo và đặt NhiemVu.phanTram.
   * BR11: phanTram = 0 → CHUA_LAM; 1..99 → DANG_LAM, xoá ngayHoanThanh; 100 → HOAN_THANH, ngayHoanThanh = homNay.
   * Vì vậy hạ tiến độ của NV đã xong sẽ mở lại NV đó. NV DA_HUY không cập nhật được.
   */
  public static capNhatTienDo(
    tenDangNhap: string,
    maNhiemVu: string,
    phanTram: number,
    soGioThucTe = 0,
    ghiChu?: string
  ): { success: boolean; message: string; banGhi?: BanGhiTienDo } {
    if (phanTram < 0 || phanTram > 100) {
      return { success: false, message: 'Phần trăm hoàn thành phải từ 0 đến 100%.' };
    }
    if (soGioThucTe < 0) {
      return { success: false, message: 'Số giờ thực tế phải lớn hơn hoặc bằng 0.' };
    }

    const data = KhoDuLieu.layDuLieu(tenDangNhap);
    const nv = data.nhiemVu.find(n => n.id === maNhiemVu);
    if (!nv) {
      return { success: false, message: 'Nhiệm vụ không tồn tại.' };
    }

    // BR11: NV DA_HUY không cập nhật được
    if (nv.trangThai === 'DA_HUY') {
      return { success: false, message: 'Nhiệm vụ đã bị hủy, không thể cập nhật tiến độ.' };
    }

    const homNay = ngayDiaPhuong();
    const phanTramChuan = Math.round(phanTram);

    // BR11: Chuyển đổi trạng thái theo phần trăm
    if (phanTramChuan === 100) {
      // NV đã xong giữ nguyên ngày hoàn thành để không biến đúng hạn thành trễ khi ghi thêm
      if (nv.trangThai !== 'HOAN_THANH') nv.ngayHoanThanh = homNay;
      nv.trangThai = 'HOAN_THANH';
    } else if (phanTramChuan > 0) {
      nv.trangThai = 'DANG_LAM';
      nv.ngayHoanThanh = null; // Hạ tiến độ của NV đã xong sẽ mở lại NV đó (BR11)
    } else {
      nv.trangThai = 'CHUA_LAM';
      nv.ngayHoanThanh = null;
    }

    nv.phanTram = phanTramChuan;

    const id = 'bg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const bg: BanGhiTienDo = {
      id,
      maNhiemVu,
      ngayGhi: homNay,
      phanTram: phanTramChuan,
      soGioThucTe: Math.max(0, soGioThucTe),
      ghiChu: ghiChu?.trim()
    };

    data.banGhiTienDo.push(bg);
    KhoDuLieu.luuDuLieu(tenDangNhap, data);

    return { success: true, message: 'Cập nhật tiến độ thành công!', banGhi: bg };
  }
}
