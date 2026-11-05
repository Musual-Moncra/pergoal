import { describe, it, expect } from 'vitest';
import { BoKiemTraHanMuc, layKhoangTuan, cungTuan } from '../domain/BoKiemTraHanMuc';
import { HanMuc, NhiemVu } from '../domain/types';

describe('BoKiemTraHanMuc', () => {
  it('tính khoảng tuần chính xác từ thứ Hai đến Chủ nhật', () => {
    // 2026-11-05 là thứ Năm
    const { thuHai, chuNhat } = layKhoangTuan('2026-11-05');
    expect(thuHai).toBe('2026-11-02');
    expect(chuNhat).toBe('2026-11-08');

    // Cùng tuần
    expect(cungTuan('2026-11-02', '2026-11-08')).toBe(true);
    expect(cungTuan('2026-11-01', '2026-11-02')).toBe(false); // 01/11 là Chủ nhật tuần trước
  });

  it('kiểm tra vi phạm DEADLINE (BR08a)', () => {
    const hanMucs: HanMuc[] = [
      {
        id: 'hm1',
        maMucTieu: 'mt1',
        loai: 'DEADLINE',
        giaTri: '2026-11-10',
        donVi: 'ngày',
        ngayHieuLuc: '2026-11-01'
      }
    ];

    // Không vượt
    const res1 = BoKiemTraHanMuc.kiemTra(hanMucs, [], { hanChot: '2026-11-09', uocLuongGio: 2 });
    expect(res1.hopLe).toBe(true);

    // Vượt
    const res2 = BoKiemTraHanMuc.kiemTra(hanMucs, [], { hanChot: '2026-11-11', uocLuongGio: 2 });
    expect(res2.hopLe).toBe(false);
    expect(res2.danhSachViPham[0]).toContain('DEADLINE');
  });

  it('kiểm tra vi phạm NV_TOI_DA_NGAY (BR08b)', () => {
    const hanMucs: HanMuc[] = [
      {
        id: 'hm2',
        maMucTieu: 'mt1',
        loai: 'NV_TOI_DA_NGAY',
        giaTri: 2,
        donVi: 'nhiệm vụ/ngày',
        ngayHieuLuc: '2026-11-01'
      }
    ];

    const nhiemVus: NhiemVu[] = [
      {
        id: 'nv1',
        maMucTieu: 'mt1',
        ten: 'NV 1',
        moTa: '',
        hanChot: '2026-11-05',
        uuTien: 'CAO',
        trangThai: 'CHUA_LAM',
        uocLuongGio: 1,
        daGhiDeHanMuc: false
      },
      {
        id: 'nv2',
        maMucTieu: 'mt1',
        ten: 'NV 2',
        moTa: '',
        hanChot: '2026-11-05',
        uuTien: 'TRUNG_BINH',
        trangThai: 'CHUA_LAM',
        uocLuongGio: 2,
        daGhiDeHanMuc: false
      }
    ];

    // Thêm NV thứ 3 trong cùng ngày 2026-11-05 sẽ vi phạm trần 2
    const res = BoKiemTraHanMuc.kiemTra(hanMucs, nhiemVus, { hanChot: '2026-11-05', uocLuongGio: 1 });
    expect(res.hopLe).toBe(false);
    expect(res.danhSachViPham[0]).toContain('Vượt số nhiệm vụ tối đa trong ngày');
  });

  it('kiểm tra vi phạm GIO_TOI_DA_TUAN (BR08c)', () => {
    const hanMucs: HanMuc[] = [
      {
        id: 'hm3',
        maMucTieu: 'mt1',
        loai: 'GIO_TOI_DA_TUAN',
        giaTri: 10,
        donVi: 'giờ/tuần',
        ngayHieuLuc: '2026-11-01'
      }
    ];

    const nhiemVus: NhiemVu[] = [
      {
        id: 'nv1',
        maMucTieu: 'mt1',
        ten: 'NV 1',
        moTa: '',
        hanChot: '2026-11-03', // Thứ Ba
        uuTien: 'TRUNG_BINH',
        trangThai: 'CHUA_LAM',
        uocLuongGio: 6,
        daGhiDeHanMuc: false
      }
    ];

    // Thêm 5 giờ vào Thứ Năm cùng tuần (tổng = 11 > 10) -> Vi phạm
    const res = BoKiemTraHanMuc.kiemTra(hanMucs, nhiemVus, { hanChot: '2026-11-05', uocLuongGio: 5 });
    expect(res.hopLe).toBe(false);
    expect(res.danhSachViPham[0]).toContain('Vượt số giờ làm việc tối đa trong tuần');
  });

  it('bỏ qua nhiệm vụ đã hủy DA_HUY khi kiểm tra hạn mức', () => {
    const hanMucs: HanMuc[] = [
      {
        id: 'hm2',
        maMucTieu: 'mt1',
        loai: 'NV_TOI_DA_NGAY',
        giaTri: 1,
        donVi: 'nhiệm vụ/ngày',
        ngayHieuLuc: '2026-11-01'
      }
    ];

    const nhiemVus: NhiemVu[] = [
      {
        id: 'nv_huy',
        maMucTieu: 'mt1',
        ten: 'NV Hủy',
        moTa: '',
        hanChot: '2026-11-05',
        uuTien: 'THAP',
        trangThai: 'DA_HUY',
        uocLuongGio: 2,
        daGhiDeHanMuc: false
      }
    ];

    // Nhiệm vụ cũ bị hủy nên ngày 2026-11-05 coi như chưa có NV hợp lệ nào
    const res = BoKiemTraHanMuc.kiemTra(hanMucs, nhiemVus, { hanChot: '2026-11-05', uocLuongGio: 2 });
    expect(res.hopLe).toBe(true);
  });
});
