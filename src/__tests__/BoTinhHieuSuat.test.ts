import { describe, it, expect } from 'vitest';
import { BoTinhHieuSuat } from '../domain/BoTinhHieuSuat';
import { NhiemVu, HanMuc, BanGhiTienDo } from '../domain/types';

describe('BoTinhHieuSuat', () => {
  it('tinhTienDoMucTieu tính chính xác theo tỷ lệ NV hoàn thành / NV khác DA_HUY', () => {
    // Không có NV nào -> 0%
    expect(BoTinhHieuSuat.tinhTienDoMucTieu([])).toBe(0);

    const nvs: NhiemVu[] = [
      { id: '1', maMucTieu: 'mt1', ten: '1', moTa: '', hanChot: '2026-11-05', uuTien: 'CAO', trangThai: 'HOAN_THANH', uocLuongGio: 1, daGhiDeHanMuc: false },
      { id: '2', maMucTieu: 'mt1', ten: '2', moTa: '', hanChot: '2026-11-05', uuTien: 'CAO', trangThai: 'DANG_LAM', uocLuongGio: 1, daGhiDeHanMuc: false },
      { id: '3', maMucTieu: 'mt1', ten: '3', moTa: '', hanChot: '2026-11-05', uuTien: 'CAO', trangThai: 'DA_HUY', uocLuongGio: 1, daGhiDeHanMuc: false } // bỏ qua
    ];

    // 1 / 2 = 50%
    expect(BoTinhHieuSuat.tinhTienDoMucTieu(nvs)).toBe(50);
  });

  it('tinhChuoiNgayLienTuc lùi từ hôm nay hoặc hôm qua', () => {
    const homNay = '2026-11-05';

    // Trường hợp 1: Có hoạt động hôm nay và hôm qua -> streak = 2
    const nvs1: NhiemVu[] = [
      { id: '1', maMucTieu: 'mt1', ten: '1', moTa: '', hanChot: '2026-11-05', uuTien: 'CAO', trangThai: 'HOAN_THANH', ngayHoanThanh: '2026-11-05', uocLuongGio: 1, daGhiDeHanMuc: false },
      { id: '2', maMucTieu: 'mt1', ten: '2', moTa: '', hanChot: '2026-11-04', uuTien: 'CAO', trangThai: 'HOAN_THANH', ngayHoanThanh: '2026-11-04', uocLuongGio: 1, daGhiDeHanMuc: false }
    ];
    expect(BoTinhHieuSuat.tinhChuoiNgayLienTuc(nvs1, [], homNay)).toBe(2);

    // Trường hợp 2: Hôm nay chưa có hoạt động, tính lùi từ hôm qua
    const bgs2: BanGhiTienDo[] = [
      { id: 'b1', maNhiemVu: 'nv1', ngayGhi: '2026-11-04', phanTram: 50, soGioThucTe: 2 },
      { id: 'b2', maNhiemVu: 'nv1', ngayGhi: '2026-11-03', phanTram: 30, soGioThucTe: 1 }
    ];
    expect(BoTinhHieuSuat.tinhChuoiNgayLienTuc([], bgs2, homNay)).toBe(2);
  });

  it('tinhBaoCaoHieuSuat tuân thủ chuẩn công thức mục 5', () => {
    const homNay = '2026-11-05';
    const tuNgay = '2026-11-01';
    const denNgay = '2026-11-10';

    const nvs: NhiemVu[] = [
      // 1. Đúng hạn: hoàn thành và ngayHoanThanh <= hanChot
      { id: '1', maMucTieu: 'mt1', ten: 'NV1', moTa: '', hanChot: '2026-11-04', uuTien: 'CAO', trangThai: 'HOAN_THANH', ngayHoanThanh: '2026-11-03', uocLuongGio: 1, daGhiDeHanMuc: false },
      // 2. Trễ hạn: hoàn thành nhưng ngayHoanThanh > hanChot
      { id: '2', maMucTieu: 'mt1', ten: 'NV2', moTa: '', hanChot: '2026-11-02', uuTien: 'CAO', trangThai: 'HOAN_THANH', ngayHoanThanh: '2026-11-04', uocLuongGio: 1, daGhiDeHanMuc: false },
      // 3. Trễ hạn: chưa hoàn thành và hanChot < homNay (hạn 03/11 < 05/11)
      { id: '3', maMucTieu: 'mt1', ten: 'NV3', moTa: '', hanChot: '2026-11-03', uuTien: 'TRUNG_BINH', trangThai: 'DANG_LAM', uocLuongGio: 2, daGhiDeHanMuc: false },
      // 4. Chưa hoàn thành nhưng hanChot >= homNay (hạn 07/11 >= 05/11) -> Không tính vào soDungHan hay soNhiemVuTre
      { id: '4', maMucTieu: 'mt1', ten: 'NV4', moTa: '', hanChot: '2026-11-07', uuTien: 'THAP', trangThai: 'CHUA_LAM', uocLuongGio: 3, daGhiDeHanMuc: false },
      // 5. Bị hủy -> Bỏ qua
      { id: '5', maMucTieu: 'mt1', ten: 'NV5', moTa: '', hanChot: '2026-11-04', uuTien: 'THAP', trangThai: 'DA_HUY', uocLuongGio: 1, daGhiDeHanMuc: false }
    ];

    const bc = BoTinhHieuSuat.tinhBaoCaoHieuSuat(tuNgay, denNgay, nvs, [], [], homNay);

    expect(bc.soDungHan).toBe(1);
    expect(bc.soNhiemVuTre).toBe(2);
    // tiLeDungHan = 1 / (1 + 2) * 100 = 33.3%
    expect(bc.tiLeDungHan).toBe(33.3);
  });

  it('tiLeDungHan trả về null nếu mẫu số = 0 (hiển thị “—”, không hiển thị 0%)', () => {
    const homNay = '2026-11-05';
    // Không có NV nào trong tập xét
    const bc = BoTinhHieuSuat.tinhBaoCaoHieuSuat('2026-11-01', '2026-11-10', [], [], [], homNay);
    expect(bc.soDungHan).toBe(0);
    expect(bc.soNhiemVuTre).toBe(0);
    expect(bc.tiLeDungHan).toBeNull();
  });
});
