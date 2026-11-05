import { NhiemVu, BanGhiTienDo, BaoCaoHieuSuat } from './types';

export class BoTinhHieuSuat {
  /**
   * Tính tiến độ phần trăm của một Mục tiêu theo mục 5:
   * tiến độ MucTieu = trung bình cộng phanTram của các NV khác DA_HUY; không có NV → 0%.
   */
  public static tinhTienDoMucTieu(nhiemVusCuaMucTieu: NhiemVu[]): number {
    const dsHopLe = nhiemVusCuaMucTieu.filter(nv => nv.trangThai !== 'DA_HUY');
    if (dsHopLe.length === 0) return 0;
    const tongPhanTram = dsHopLe.reduce((sum, nv) => sum + (nv.phanTram || 0), 0);
    return Number((tongPhanTram / dsHopLe.length).toFixed(1));
  }

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
   * Tính chuỗi ngày liên tục có BanGhiTienDo theo mục 5:
   * số ngày liên tiếp có BanGhiTienDo, tính lùi từ homNay; nếu homNay chưa có bản ghi thì tính lùi từ hôm qua.
   */
  public static tinhChuoiNgayLienTuc(
    tatCaBanGhiTienDo: BanGhiTienDo[],
    homNay: string
  ): number {
    const ngayCoBanGhi = new Set<string>();
    for (const bg of tatCaBanGhiTienDo) {
      if (bg.ngayGhi) {
        ngayCoBanGhi.add(bg.ngayGhi);
      }
    }

    let ngayXet = homNay;
    if (!ngayCoBanGhi.has(homNay)) {
      ngayXet = this.luiMotNgay(homNay);
    }

    let streak = 0;
    while (ngayCoBanGhi.has(ngayXet)) {
      streak++;
      ngayXet = this.luiMotNgay(ngayXet);
    }

    return streak;
  }

  /**
   * Tính toán toàn diện báo cáo hiệu suất theo mục 5:
   * Tập xét: NhiemVu có hanChot trong [tuNgay, denNgay], trangThai ≠ DA_HUY, lọc theo maMucTieu nếu có.
   */
  public static tinhBaoCaoHieuSuat(
    tuNgay: string,
    denNgay: string,
    danhSachNhiemVu: NhiemVu[],
    danhSachBanGhi: BanGhiTienDo[],
    homNay: string,
    maMucTieu?: string | null
  ): BaoCaoHieuSuat {
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
        if (nv.hanChot < homNay) {
          soNhiemVuTre++;
        }
      }
    }

    const mauSo = soDungHan + soNhiemVuTre;
    const tiLeDungHan = mauSo === 0 ? null : Number(((soDungHan / mauSo) * 100).toFixed(1));

    // tienDoTrungBinh = trung bình cộng phanTram của tập xét; tập rỗng -> null
    const tienDoTrungBinh = tapXet.length === 0
      ? null
      : Number((tapXet.reduce((sum, nv) => sum + (nv.phanTram || 0), 0) / tapXet.length).toFixed(1));

    const chuoiNgayLienTuc = this.tinhChuoiNgayLienTuc(danhSachBanGhi, homNay);

    return {
      tuNgay,
      denNgay,
      tiLeDungHan,
      soDungHan,
      soNhiemVuTre,
      chuoiNgayLienTuc,
      tienDoTrungBinh
    };
  }
}
