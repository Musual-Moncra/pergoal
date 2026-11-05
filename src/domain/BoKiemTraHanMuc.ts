import { HanMuc, NhiemVu, KetQuaKiemTraHanMuc } from './types';

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

/**
 * Kiểm tra xem 2 ngày có cùng tuần (thứ Hai -> Chủ nhật) hay không.
 */
export function cungTuan(ngay1: string, ngay2: string): boolean {
  const t1 = layKhoangTuan(ngay1);
  return ngay2 >= t1.thuHai && ngay2 <= t1.chuNhat;
}

export class BoKiemTraHanMuc {
  /**
   * Kiểm tra hạn mức theo quy tắc BR08:
   * Tập kiểm tra gồm các NV khác DA_HUY của MucTieu, tính cả NV đang tạo/cập nhật.
   * 
   * @param hanMucs Danh sách hạn mức của Mục tiêu
   * @param nhiemVusHienCo Danh sách nhiệm vụ hiện có của Mục tiêu
   * @param nhiemVuDangXet Thông tin nhiệm vụ đang được tạo hoặc cập nhật
   * @param idNhiemVuBoQua (tuỳ chọn) Mã nhiệm vụ bỏ qua khi cập nhật (chính là bản ghi cũ của NV đang sửa)
   */
  public static kiemTra(
    hanMucs: HanMuc[],
    nhiemVusHienCo: NhiemVu[],
    nhiemVuDangXet: { hanChot: string; uocLuongGio: number },
    idNhiemVuBoQua?: string
  ): KetQuaKiemTraHanMuc {
    const viPham: string[] = [];
    const maHanMucViPham: string[] = [];

    // Chỉ xét các NV khác DA_HUY, và loại trừ bản thân NV đang sửa nếu có
    const danhSachXet = nhiemVusHienCo.filter(
      nv => nv.trangThai !== 'DA_HUY' && (!idNhiemVuBoQua || nv.id !== idNhiemVuBoQua)
    );

    for (const hm of hanMucs) {
      if (hm.loai === 'DEADLINE') {
        const ngayDeadline = String(hm.giaTri);
        if (nhiemVuDangXet.hanChot > ngayDeadline) {
          viPham.push(
            `Vượt hạn chót tổng (DEADLINE): Hạn chót nhiệm vụ (${nhiemVuDangXet.hanChot}) sau mốc quy định (${ngayDeadline}).`
          );
          maHanMucViPham.push(hm.id);
        }
      } else if (hm.loai === 'NV_TOI_DA_NGAY') {
        const gioiHanNV = Number(hm.giaTri);
        // Đếm số NV hiện có có cùng ngày hanChot + 1 (cho nhiệm vụ đang xét)
        const soNVTrongNgay = danhSachXet.filter(nv => nv.hanChot === nhiemVuDangXet.hanChot).length + 1;
        if (soNVTrongNgay > gioiHanNV) {
          viPham.push(
            `Vượt số nhiệm vụ tối đa trong ngày (${nhiemVuDangXet.hanChot}): ${soNVTrongNgay} nhiệm vụ / mức trần cho phép là ${gioiHanNV} nhiệm vụ.`
          );
          maHanMucViPham.push(hm.id);
        }
      } else if (hm.loai === 'GIO_TOI_DA_TUAN') {
        const gioiHanGio = Number(hm.giaTri);
        // Tính tổng ước lượng giờ của các NV có hạn chót trong cùng tuần + ước lượng của NV đang xét
        const tongGioTuanHienCo = danhSachXet
          .filter(nv => cungTuan(nv.hanChot, nhiemVuDangXet.hanChot))
          .reduce((sum, nv) => sum + (nv.uocLuongGio || 0), 0);
        const tongGio = tongGioTuanHienCo + nhiemVuDangXet.uocLuongGio;

        if (tongGio > gioiHanGio) {
          const { thuHai, chuNhat } = layKhoangTuan(nhiemVuDangXet.hanChot);
          viPham.push(
            `Vượt số giờ làm việc tối đa trong tuần (${thuHai} đến ${chuNhat}): Tổng ${tongGio} giờ / mức trần cho phép là ${gioiHanGio} giờ.`
          );
          maHanMucViPham.push(hm.id);
        }
      }
    }

    return {
      hopLe: viPham.length === 0,
      danhSachViPham: viPham,
      maHanMucViPham
    };
  }

  /**
   * Rà soát các nhiệm vụ hiện có khi thiết lập hạn mức mới (quy tắc BR10 - không hồi tố)
   */
  public static raSoatViPhamHienCo(
    hmMoi: HanMuc,
    nhiemVusHienCo: NhiemVu[]
  ): string[] {
    const viPhamHienCo: string[] = [];
    const dsHopLe = nhiemVusHienCo.filter(nv => nv.trangThai !== 'DA_HUY');

    if (hmMoi.loai === 'DEADLINE') {
      const ngayDeadline = String(hmMoi.giaTri);
      const dsTre = dsHopLe.filter(nv => nv.hanChot > ngayDeadline);
      if (dsTre.length > 0) {
        viPhamHienCo.push(`Có ${dsTre.length} nhiệm vụ hiện có hạn chót sau mốc DEADLINE mới (${ngayDeadline}).`);
      }
    } else if (hmMoi.loai === 'NV_TOI_DA_NGAY') {
      const limit = Number(hmMoi.giaTri);
      const counts: Record<string, number> = {};
      for (const nv of dsHopLe) {
        counts[nv.hanChot] = (counts[nv.hanChot] || 0) + 1;
      }
      for (const [ngay, count] of Object.entries(counts)) {
        if (count > limit) {
          viPhamHienCo.push(`Ngày ${ngay} hiện có ${count} nhiệm vụ (vượt mức trần mới ${limit} nhiệm vụ/ngày).`);
        }
      }
    } else if (hmMoi.loai === 'GIO_TOI_DA_TUAN') {
      const limit = Number(hmMoi.giaTri);
      const tuanMap: Record<string, { tongGio: number; thuHai: string; chuNhat: string }> = {};
      for (const nv of dsHopLe) {
        const { thuHai, chuNhat } = layKhoangTuan(nv.hanChot);
        if (!tuanMap[thuHai]) {
          tuanMap[thuHai] = { tongGio: 0, thuHai, chuNhat };
        }
        tuanMap[thuHai].tongGio += nv.uocLuongGio || 0;
      }
      for (const t of Object.values(tuanMap)) {
        if (t.tongGio > limit) {
          viPhamHienCo.push(`Tuần ${t.thuHai} đến ${t.chuNhat} hiện có tổng ${t.tongGio} giờ (vượt mức trần mới ${limit} giờ/tuần).`);
        }
      }
    }

    return viPhamHienCo;
  }
}
