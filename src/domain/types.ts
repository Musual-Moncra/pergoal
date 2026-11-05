export type UuTien = 'THAP' | 'TRUNG_BINH' | 'CAO';

export type TrangThaiMucTieu = 'DANG_THUC_HIEN' | 'TAM_DUNG' | 'HOAN_THANH' | 'DA_HUY';

export type TrangThaiNhiemVu = 'CHUA_LAM' | 'DANG_LAM' | 'HOAN_THANH' | 'DA_HUY';

export type LoaiHanMuc = 'DEADLINE' | 'NV_TOI_DA_NGAY' | 'GIO_TOI_DA_TUAN' | 'CHI_TIEU_DINH_LUONG';

export type LoaiNhacNho = 'SAP_DEN_HAN' | 'QUA_HAN' | 'VUOT_HAN_MUC';

export interface NguoiDung {
  tenDangNhap: string;
  tenHienThi: string;
  ngayTao: string;
  matKhauBam: string;
  salt: string;
}

export interface DanhMuc {
  id: string;
  ten: string;
  mauSac: string;
  tenDangNhap: string;
}

export interface MucTieu {
  id: string;
  ten: string;
  moTa: string;
  maDanhMuc?: string | null;
  ngayBatDau: string;
  ngayKetThuc: string;
  uuTien: UuTien;
  trangThai: TrangThaiMucTieu;
  tenDangNhap: string;
}

export interface NhiemVu {
  id: string;
  maMucTieu: string;
  ten: string;
  moTa: string;
  hanChot: string; // YYYY-MM-DD
  uuTien: UuTien;
  trangThai: TrangThaiNhiemVu;
  uocLuongGio: number;
  ngayHoanThanh?: string | null; // YYYY-MM-DD
  daGhiDeHanMuc: boolean;
}

export interface HanMuc {
  id: string;
  maMucTieu: string;
  loai: LoaiHanMuc;
  giaTri: number | string; // DEADLINE là YYYY-MM-DD, các loại khác là số
  donVi: string;
  ngayHieuLuc: string; // YYYY-MM-DD
}

export interface BanGhiTienDo {
  id: string;
  maNhiemVu: string;
  ngayGhi: string; // YYYY-MM-DD
  phanTram: number; // 0..100
  soGioThucTe: number; // >= 0
  giaTriDinhLuong?: number; // >= 0 khi ghi nhận chỉ tiêu
  ghiChu?: string;
  maHanMuc?: string | null;
}

export interface NhacNho {
  id: string;
  tenDangNhap: string;
  loai: LoaiNhacNho;
  noiDung: string;
  thoiDiemTao: string; // ISO string
  daDoc: boolean;
  maNhiemVu?: string | null;
  maHanMuc?: string | null;
}

export interface BaoCaoHieuSuat {
  tuNgay: string;
  denNgay: string;
  tiLeDungHan: number | null; // null nếu mẫu số = 0
  soDungHan: number;
  soNhiemVuTre: number;
  phanTramDatChiTieu: number | null; // null nếu không có chỉ tiêu
  chuoiNgayLienTuc: number;
}

export interface KetQuaKiemTraHanMuc {
  hopLe: boolean;
  danhSachViPham: string[];
  maHanMucViPham: string[];
}
