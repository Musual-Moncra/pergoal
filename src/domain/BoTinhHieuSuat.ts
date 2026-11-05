import { NhiemVu, HanMuc, BanGhiTienDo, BaoCaoHieuSuat } from './types';
import { cungTuan } from './BoKiemTraHanMuc';

export class BoTinhHieuSuat {
  /**
   * Tính tiến độ phần trăm của một Mục tiêu theo mục 5:
   * tiến độ MucTieu = số NV HOAN_THANH / số NV khác DA_HUY × 100; không có NV → 0%.
   */
  public static tinhTienDoMucTieu(nhiemVusCuaMucTieu: NhiemVu[]): number {
    const dsHopLe = nhiemVusCuaMucTieu.filter(nv => nv.trangThai !== 'DA_HUY');
    if (dsHopLe.length === 0) return 0;
    const soHoanThanh = dsHopLe.filter(nv => nv.trangThai === 'HOAN_THANH').length;
    return Number(((soHoanThanh / dsHopLe.length) * 100).toFixed(1));
  }

  /**
   * Lùi 1 ngày theo chuỗi YYYY-MM-DD
   */
  private static luiMotNgay(ngayYMD: string): string {
    const parts = ngayYMD.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /**
   * Tính chuỗi ngày liên tục có hoạt động (streak) tính lùi từ homNay:
   * nếu homNay chưa có hoạt động thì tính lùi từ hôm qua.
   * Hoạt động = có >= 1 NV hoàn thành hoặc >= 1 BanGhiTienDo trong ngày.
   */
  public static tinhChuoiNgayLienTuc(
    tatCaNhiemVu: NhiemVu[],
    tatCaBanGhiTienDo: BanGhiTienDo[],
    homNay: string
  ): number {
    const ngayHoatDong = new Set<string>();

    for (const nv of tatCaNhiemVu) {
      if (nv.trangThai === 'HOAN_THANH' && nv.ngayHoanThanh) {
        ngayHoatDong.add(nv.ngayHoanThanh);
      }
    }

    for (const bg of tatCaBanGhiTienDo) {
      if (bg.ngayGhi) {
        ngayHoatDong.add(bg.ngayGhi);
      }
    }

    let ngayXet = homNay;
    if (!ngayHoatDong.has(homNay)) {
      ngayXet = this.luiMotNgay(homNay);
    }

    let streak = 0;
    while (ngayHoatDong.has(ngayXet)) {
      streak++;
      ngayXet = this.luiMotNgay(ngayXet);
    }

    return streak;
  }

  /**
   * Tính phần trăm đạt chỉ tiêu định lượng trong tuần chứa homNay:
   * trung bình cộng, trên các HanMuc loại CHI_TIEU_DINH_LUONG, của min(100, tổng giaTriDinhLuong trong tuần chứa homNay / giaTri × 100); không có chỉ tiêu → null ("—")
   */
  public static tinhPhanTramDatChiTieu(
    hanMucs: HanMuc[],
    banGhiTienDos: BanGhiTienDo[],
    homNay: string,
    maMucTieu?: string | null
  ): number | null {
    const chiTieuMucs = hanMucs.filter(
      hm => hm.loai === 'CHI_TIEU_DINH_LUONG' && (!maMucTieu || hm.maMucTieu === maMucTieu)
    );

    if (chiTieuMucs.length === 0) {
      return null;
    }

    let tongPhanTram = 0;

    for (const hm of chiTieuMucs) {
      const dinhMuc = Number(hm.giaTri);
      if (dinhMuc <= 0) continue;

      // Bản ghi tiến độ gán cho hạn mức này hoặc có giá trị định lượng trong tuần chứa homNay
      const tongGiaTriTuan = banGhiTienDos
        .filter(bg => bg.maHanMuc === hm.id && cungTuan(bg.ngayGhi, homNay))
        .reduce((sum, bg) => sum + (bg.giaTriDinhLuong || 0), 0);

      const phanTramHM = Math.min(100, (tongGiaTriTuan / dinhMuc) * 100);
      tongPhanTram += phanTramHM;
    }

    const tb = tongPhanTram / chiTieuMucs.length;
    return Number(tb.toFixed(1));
  }

  /**
   * Tính toán toàn diện báo cáo hiệu suất theo mục 5:
   * Tập xét: NhiemVu có hanChot trong [tuNgay, denNgay], trangThai ≠ DA_HUY, lọc theo maMucTieu nếu có.
   */
  public static tinhBaoCaoHieuSuat(
    tuNgay: string,
    denNgay: string,
    danhSachNhiemVu: NhiemVu[],
    danhSachHanMuc: HanMuc[],
    danhSachBanGhi: BanGhiTienDo[],
    homNay: string,
    maMucTieu?: string | null
  ): BaoCaoHieuSuat {
    // Lọc tập xét
    const tapXet = danhSachNhiemVu.filter(nv => {
      if (nv.trangThai === 'DA_HUY') return false;
      if (maMucTieu && nv.maMucTieu !== maMucTieu) return false;
      return nv.hanChot >= tuNgay && nv.hanChot <= denNgay;
    });

    let soDungHan = 0;
    let soNhiemVuTre = 0;

    for (const nv of tapXet) {
      if (nv.trangThai === 'HOAN_THANH') {
        const ngayHT = nv.ngayHoanThanh || '';
        if (ngayHT <= nv.hanChot) {
          soDungHan++;
        } else {
          soNhiemVuTre++;
        }
      } else {
        // Chưa hoàn thành
        if (nv.hanChot < homNay) {
          soNhiemVuTre++;
        }
        // hanChot >= homNay: không tính vào hai số trên (theo quy định mục 5)
      }
    }

    const mauSo = soDungHan + soNhiemVuTre;
    const tiLeDungHan = mauSo === 0 ? null : Number(((soDungHan / mauSo) * 100).toFixed(1));

    const phanTramDatChiTieu = this.tinhPhanTramDatChiTieu(danhSachHanMuc, danhSachBanGhi, homNay, maMucTieu);

    // Chuỗi ngày liên tục tính trên toàn bộ dữ liệu người dùng
    const chuoiNgayLienTuc = this.tinhChuoiNgayLienTuc(danhSachNhiemVu, danhSachBanGhi, homNay);

    return {
      tuNgay,
      denNgay,
      tiLeDungHan,
      soDungHan,
      soNhiemVuTre,
      phanTramDatChiTieu,
      chuoiNgayLienTuc
    };
  }
}
