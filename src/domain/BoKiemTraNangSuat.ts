import { NhiemVu, BANG_MUC_NANG_SUAT, KetQuaKiemTraNangSuat } from './types';

/**
 * Xác định thứ Hai và Chủ nhật của tuần chứa ngày đã cho (theo giờ địa phương).
 * Tuần tính từ thứ Hai đến Chủ nhật.
 */
export function layKhoangTuan(ngayYMD: string): { thuHai: string; chuNhat: string } {
  const parts = ngayYMD.split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const day = d.getDay(); // 0: CN, 1: T2, ..., 6: T7
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const format = (dt: Date) => {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const dayStr = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayStr}`;
  };

  return {
    thuHai: format(monday),
    chuNhat: format(sunday)
  };
}

export function cungTuan(ngay1: string, ngay2: string): boolean {
  const t1 = layKhoangTuan(ngay1);
  return ngay2 >= t1.thuHai && ngay2 <= t1.chuNhat;
}

export class BoKiemTraNangSuat {
  /**
   * Kiểm tra mức năng suất theo quy tắc BR07:
   * Tập kiểm tra gồm các NV khác DA_HUY của MucTieu, tính cả NV đang xét.
   */
  public static kiemTra(
    capDo: number,
    nhiemVusHienCo: NhiemVu[],
    nhiemVuDangXet: { hanChot: string; uocLuongGio: number },
    idNhiemVuBoQua?: string
  ): KetQuaKiemTraNangSuat {
    const muc = BANG_MUC_NANG_SUAT[capDo] || BANG_MUC_NANG_SUAT[3];
    const viPham: string[] = [];

    const danhSachXet = nhiemVusHienCo.filter(
      nv => nv.trangThai !== 'DA_HUY' && (!idNhiemVuBoQua || nv.id !== idNhiemVuBoQua)
    );

    // (a) số NV cùng ngày hanChot > soNhiemVuToiDaNgay
    const soNVTrongNgay = danhSachXet.filter(nv => nv.hanChot === nhiemVuDangXet.hanChot).length + 1;
    if (soNVTrongNgay > muc.soNhiemVuToiDaNgay) {
      viPham.push(
        `Vượt số nhiệm vụ tối đa trong ngày (${nhiemVuDangXet.hanChot}): ${soNVTrongNgay} nhiệm vụ / mức cho phép là ${muc.soNhiemVuToiDaNgay} nhiệm vụ (Mức ${capDo} ⚡).`
      );
    }

    // (b) tổng uocLuongGio của NV có hanChot trong cùng tuần > soGioToiDaTuan
    const tongGioTuanHienCo = danhSachXet
      .filter(nv => cungTuan(nv.hanChot, nhiemVuDangXet.hanChot))
      .reduce((sum, nv) => sum + (nv.uocLuongGio || 0), 0);
    const tongGio = tongGioTuanHienCo + nhiemVuDangXet.uocLuongGio;

    if (tongGio > muc.soGioToiDaTuan) {
      const { thuHai, chuNhat } = layKhoangTuan(nhiemVuDangXet.hanChot);
      viPham.push(
        `Vượt số giờ làm việc tối đa trong tuần (${thuHai} đến ${chuNhat}): Tổng ${tongGio} giờ / mức cho phép là ${muc.soGioToiDaTuan} giờ (Mức ${capDo} ⚡).`
      );
    }

    return {
      hopLe: viPham.length === 0,
      danhSachViPham: viPham
    };
  }

  /**
   * Rà soát các nhiệm vụ hiện có khi đổi mức năng suất (BR09 - không hồi tố)
   */
  public static raSoatViPhamHienCo(
    capDoMoi: number,
    nhiemVusHienCo: NhiemVu[]
  ): string[] {
    const muc = BANG_MUC_NANG_SUAT[capDoMoi] || BANG_MUC_NANG_SUAT[3];
    const viPhamHienCo: string[] = [];
    const dsHopLe = nhiemVusHienCo.filter(nv => nv.trangThai !== 'DA_HUY');

    // Kiểm tra số nhiệm vụ theo ngày
    const counts: Record<string, number> = {};
    for (const nv of dsHopLe) {
      counts[nv.hanChot] = (counts[nv.hanChot] || 0) + 1;
    }
    for (const [ngay, count] of Object.entries(counts)) {
      if (count > muc.soNhiemVuToiDaNgay) {
        viPhamHienCo.push(`Ngày ${ngay} hiện có ${count} nhiệm vụ (vượt mức mới tối đa ${muc.soNhiemVuToiDaNgay} nhiệm vụ/ngày).`);
      }
    }

    // Kiểm tra số giờ theo tuần
    const tuanMap: Record<string, { tongGio: number; thuHai: string; chuNhat: string }> = {};
    for (const nv of dsHopLe) {
      const { thuHai, chuNhat } = layKhoangTuan(nv.hanChot);
      if (!tuanMap[thuHai]) {
        tuanMap[thuHai] = { tongGio: 0, thuHai, chuNhat };
      }
      tuanMap[thuHai].tongGio += nv.uocLuongGio || 0;
    }
    for (const t of Object.values(tuanMap)) {
      if (t.tongGio > muc.soGioToiDaTuan) {
        viPhamHienCo.push(`Tuần ${t.thuHai} đến ${t.chuNhat} hiện có tổng ${t.tongGio} giờ (vượt mức mới tối đa ${muc.soGioToiDaTuan} giờ/tuần).`);
      }
    }

    return viPhamHienCo;
  }
}
