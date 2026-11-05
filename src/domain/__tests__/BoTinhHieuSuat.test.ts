import { describe, it, expect } from 'vitest';
import { BoTinhHieuSuat } from '../BoTinhHieuSuat';
import type { NhiemVu, HanMuc, BanGhiTienDo } from '../types';

function nv(patch: Partial<NhiemVu> & { id: string; hanChot: string }): NhiemVu {
  return {
    maMucTieu: 'mt1',
    ten: 'Nhiệm vụ ' + patch.id,
    moTa: '',
    uuTien: 'TRUNG_BINH',
    trangThai: 'CHUA_LAM',
    uocLuongGio: 1,
    daGhiDeHanMuc: false,
    ...patch,
  };
}

function hm(patch: Partial<HanMuc> & { id: string; loai: HanMuc['loai']; giaTri: number | string }): HanMuc {
  return {
    maMucTieu: 'mt1',
    donVi: '',
    ngayHieuLuc: '2026-11-01',
    ...patch,
  };
}

function bg(patch: Partial<BanGhiTienDo> & { id: string; ngayGhi: string }): BanGhiTienDo {
  return {
    maNhiemVu: 'nv1',
    phanTram: 0,
    soGioThucTe: 0,
    ...patch,
  };
}

describe('BoTinhHieuSuat - tỉ lệ đúng hạn', () => {
  it('trả null (không có dữ liệu) khi mẫu số bằng 0', () => {
    const kq = BoTinhHieuSuat.tinhBaoCaoHieuSuat(
      '2026-11-01', '2026-11-30', [], [], [], '2026-11-15'
    );
    expect(kq.tiLeDungHan).toBeNull();
    expect(kq.soDungHan).toBe(0);
    expect(kq.soNhiemVuTre).toBe(0);
  });

  it('không tính 0% khi chỉ có nhiệm vụ chưa tới hạn', () => {
    const kq = BoTinhHieuSuat.tinhBaoCaoHieuSuat(
      '2026-11-01', '2026-11-30',
      [nv({ id: 'a', hanChot: '2026-11-20' })],
      [], [], '2026-11-15'
    );
    expect(kq.tiLeDungHan).toBeNull();
    expect(kq.soNhiemVuTre).toBe(0);
  });

  it('tính đúng: đúng hạn, trễ đã xong, trễ chưa xong, chưa tới hạn', () => {
    const kq = BoTinhHieuSuat.tinhBaoCaoHieuSuat(
      '2026-11-01', '2026-11-30',
      [
        nv({ id: 'a', hanChot: '2026-11-10', trangThai: 'HOAN_THANH', ngayHoanThanh: '2026-11-09' }),
        nv({ id: 'b', hanChot: '2026-11-10', trangThai: 'HOAN_THANH', ngayHoanThanh: '2026-11-12' }),
        nv({ id: 'c', hanChot: '2026-11-12', trangThai: 'DANG_LAM' }),
        nv({ id: 'd', hanChot: '2026-11-20', trangThai: 'CHUA_LAM' }),
      ],
      [], [], '2026-11-15'
    );
    expect(kq.soDungHan).toBe(1);
    expect(kq.soNhiemVuTre).toBe(2);
    expect(kq.tiLeDungHan).toBe(33.3);
  });

  it('nhiệm vụ hoàn thành đúng ngày hạn chót vẫn tính đúng hạn', () => {
    const kq = BoTinhHieuSuat.tinhBaoCaoHieuSuat(
      '2026-11-01', '2026-11-30',
      [nv({ id: 'a', hanChot: '2026-11-10', trangThai: 'HOAN_THANH', ngayHoanThanh: '2026-11-10' })],
      [], [], '2026-11-15'
    );
    expect(kq.soDungHan).toBe(1);
    expect(kq.soNhiemVuTre).toBe(0);
    expect(kq.tiLeDungHan).toBe(100);
  });

  it('nhiệm vụ chưa xong đúng hạn hôm nay không bị tính trễ', () => {
    const kq = BoTinhHieuSuat.tinhBaoCaoHieuSuat(
      '2026-11-01', '2026-11-30',
      [nv({ id: 'a', hanChot: '2026-11-15', trangThai: 'DANG_LAM' })],
      [], [], '2026-11-15'
    );
    expect(kq.soNhiemVuTre).toBe(0);
    expect(kq.tiLeDungHan).toBeNull();
  });

  it('bỏ nhiệm vụ DA_HUY và lọc theo mục tiêu', () => {
    const kq = BoTinhHieuSuat.tinhBaoCaoHieuSuat(
      '2026-11-01', '2026-11-30',
      [
        nv({ id: 'a', hanChot: '2026-11-10', trangThai: 'HOAN_THANH', ngayHoanThanh: '2026-11-10' }),
        nv({ id: 'b', hanChot: '2026-11-10', trangThai: 'DA_HUY' }),
        nv({ id: 'c', maMucTieu: 'mt2', hanChot: '2026-11-09', trangThai: 'HOAN_THANH', ngayHoanThanh: '2026-11-09' }),
      ],
      [], [], '2026-11-15', 'mt1'
    );
    expect(kq.soDungHan).toBe(1);
    expect(kq.soNhiemVuTre).toBe(0);
  });

  it('chỉ xét nhiệm vụ có hạn chót trong khoảng báo cáo', () => {
    const kq = BoTinhHieuSuat.tinhBaoCaoHieuSuat(
      '2026-11-01', '2026-11-15',
      [
        nv({ id: 'a', hanChot: '2026-10-31', trangThai: 'HOAN_THANH', ngayHoanThanh: '2026-10-30' }),
        nv({ id: 'b', hanChot: '2026-11-16', trangThai: 'HOAN_THANH', ngayHoanThanh: '2026-11-16' }),
      ],
      [], [], '2026-11-20'
    );
    expect(kq.tiLeDungHan).toBeNull();
  });
});

describe('BoTinhHieuSuat - tiến độ mục tiêu', () => {
  it('không có nhiệm vụ thì 0%', () => {
    expect(BoTinhHieuSuat.tinhTienDoMucTieu([])).toBe(0);
  });

  it('bỏ DA_HUY khỏi mẫu số và làm tròn 1 chữ số', () => {
    const ds = [
      nv({ id: 'a', hanChot: '2026-11-10', trangThai: 'HOAN_THANH' }),
      nv({ id: 'b', hanChot: '2026-11-10', trangThai: 'HOAN_THANH' }),
      nv({ id: 'c', hanChot: '2026-11-10', trangThai: 'DANG_LAM' }),
      nv({ id: 'd', hanChot: '2026-11-10', trangThai: 'DA_HUY' }),
    ];
    expect(BoTinhHieuSuat.tinhTienDoMucTieu(ds)).toBe(66.7);
  });
});

describe('BoTinhHieuSuat - phần trăm đạt chỉ tiêu', () => {
  const tuanNay = '2026-11-11'; // thứ Tư
  const chiTieu1 = hm({ id: 'h1', loai: 'CHI_TIEU_DINH_LUONG', giaTri: 10, donVi: 'km/tuần' });
  const chiTieu2 = hm({ id: 'h2', loai: 'CHI_TIEU_DINH_LUONG', giaTri: 20, donVi: 'trang/tuần' });

  it('không có chỉ tiêu thì null', () => {
    expect(BoTinhHieuSuat.tinhPhanTramDatChiTieu([], [], tuanNay)).toBeNull();
    expect(BoTinhHieuSuat.tinhPhanTramDatChiTieu(
      [hm({ id: 'x', loai: 'DEADLINE', giaTri: '2026-11-30' })], [], tuanNay
    )).toBeNull();
  });

  it('cộng đúng bản ghi trong tuần, chặn ở 100% và lấy trung bình cộng', () => {
    const banGhi = [
      bg({ id: '1', ngayGhi: '2026-11-09', maHanMuc: 'h1', giaTriDinhLuong: 4 }),
      bg({ id: '2', ngayGhi: '2026-11-15', maHanMuc: 'h1', giaTriDinhLuong: 8 }),
      bg({ id: '3', ngayGhi: '2026-11-11', maHanMuc: 'h2', giaTriDinhLuong: 5 }),
      // Ngoài tuần chứa 2026-11-11 (thứ Hai 09/11 - Chủ nhật 15/11)
      bg({ id: '4', ngayGhi: '2026-11-08', maHanMuc: 'h2', giaTriDinhLuong: 100 }),
    ];
    // h1: min(100, 12/10*100) = 100; h2: 5/20*100 = 25; tb = 62.5
    expect(BoTinhHieuSuat.tinhPhanTramDatChiTieu([chiTieu1, chiTieu2], banGhi, tuanNay)).toBe(62.5);
  });

  it('lọc theo mục tiêu khi có maMucTieu', () => {
    const banGhi = [
      bg({ id: '1', ngayGhi: '2026-11-10', maHanMuc: 'h1', giaTriDinhLuong: 10 }),
    ];
    const khac = hm({ id: 'h3', maMucTieu: 'mt2', loai: 'CHI_TIEU_DINH_LUONG', giaTri: 10 });
    // Chỉ xét h1 của mt1 khi truyền maMucTieu=mt1
    expect(BoTinhHieuSuat.tinhPhanTramDatChiTieu([chiTieu1, khac], banGhi, tuanNay, 'mt1')).toBe(100);
  });
});

describe('BoTinhHieuSuat - chuỗi ngày liên tục', () => {
  const homNay = '2026-11-11';

  it('đếm liên tiếp khi hôm nay có hoạt động', () => {
    const banGhi = [
      bg({ id: '1', ngayGhi: '2026-11-11' }),
      bg({ id: '2', ngayGhi: '2026-11-10' }),
      bg({ id: '3', ngayGhi: '2026-11-09' }),
      bg({ id: '4', ngayGhi: '2026-11-07' }), // đứt ngày 08
    ];
    expect(BoTinhHieuSuat.tinhChuoiNgayLienTuc([], banGhi, homNay)).toBe(3);
  });

  it('hôm nay chưa có hoạt động thì tính lùi từ hôm qua', () => {
    const banGhi = [
      bg({ id: '1', ngayGhi: '2026-11-10' }),
      bg({ id: '2', ngayGhi: '2026-11-09' }),
    ];
    expect(BoTinhHieuSuat.tinhChuoiNgayLienTuc([], banGhi, homNay)).toBe(2);
  });

  it('hôm nay và hôm qua đều không có hoạt động thì chuỗi 0', () => {
    const banGhi = [bg({ id: '1', ngayGhi: '2026-11-09' })];
    expect(BoTinhHieuSuat.tinhChuoiNgayLienTuc([], banGhi, homNay)).toBe(0);
  });

  it('nhiệm vụ hoàn thành cũng tính là hoạt động', () => {
    const dsNv = [
      nv({ id: 'a', hanChot: '2026-11-11', trangThai: 'HOAN_THANH', ngayHoanThanh: '2026-11-11' }),
      nv({ id: 'b', hanChot: '2026-11-10', trangThai: 'HOAN_THANH', ngayHoanThanh: '2026-11-10' }),
    ];
    expect(BoTinhHieuSuat.tinhChuoiNgayLienTuc(dsNv, [], homNay)).toBe(2);
  });
});
