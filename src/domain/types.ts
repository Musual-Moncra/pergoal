export type UuTien = 'THAP' | 'TRUNG_BINH' | 'CAO';

export type TrangThaiMucTieu = 'DANG_THUC_HIEN' | 'TAM_DUNG' | 'HOAN_THANH' | 'DA_HUY';

export type TrangThaiNhiemVu = 'CHUA_LAM' | 'DANG_LAM' | 'HOAN_THANH' | 'DA_HUY';

export interface MucNangSuat {
  capDo: number; // 1..5
  soNhiemVuToiDaNgay: number;
  soGioToiDaTuan: number;
}

export const BANG_MUC_NANG_SUAT: Record<number, MucNangSuat> = {
  1: { capDo: 1, soNhiemVuToiDaNgay: 1, soGioToiDaTuan: 5 },
  2: { capDo: 2, soNhiemVuToiDaNgay: 2, soGioToiDaTuan: 10 },
  3: { capDo: 3, soNhiemVuToiDaNgay: 3, soGioToiDaTuan: 20 },
  4: { capDo: 4, soNhiemVuToiDaNgay: 5, soGioToiDaTuan: 30 },
  5: { capDo: 5, soNhiemVuToiDaNgay: 8, soGioToiDaTuan: 40 }
};

export interface NguoiDung {
  tenDangNhap: string;
  tenHienThi: string;
  ngayTao: string;
  matKhauBam: string;
  salt: string;
}

export interface MucTieu {
  id: string;
  ten: string;
  moTa: string;
  ngayBatDau: string; // YYYY-MM-DD
  ngayKetThuc: string; // YYYY-MM-DD
  uuTien: UuTien;
  trangThai: TrangThaiMucTieu;
  capDo: number; // 1..5, mặc định 3 (BR03, BR06)
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
  phanTram: number; // 0..100
  ngayHoanThanh?: string | null; // YYYY-MM-DD
  daVuotMucNangSuat: boolean;
}

export interface BanGhiTienDo {
  id: string;
  maNhiemVu: string;
  ngayGhi: string; // YYYY-MM-DD
  phanTram: number; // 0..100
  soGioThucTe: number; // >= 0
  ghiChu?: string;
}

export interface BaoCaoHieuSuat {
  tuNgay: string;
  denNgay: string;
  tiLeDungHan: number | null; // null nếu mẫu số = 0
  soDungHan: number;
  soNhiemVuTre: number;
  chuoiNgayLienTuc: number;
  tienDoTrungBinh: number | null; // null nếu tập rỗng
}

export interface KetQuaKiemTraNangSuat {
  hopLe: boolean;
  danhSachViPham: string[];
}

/**
 * Lấy ngày theo múi giờ địa phương định dạng YYYY-MM-DD
 */
export function ngayDiaPhuong(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
