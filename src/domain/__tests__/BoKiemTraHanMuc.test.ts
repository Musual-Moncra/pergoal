import { describe, it, expect } from 'vitest';
import { BoKiemTraHanMuc, layKhoangTuan, cungTuan } from '../BoKiemTraHanMuc';
import type { NhiemVu, HanMuc } from '../types';

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

describe('Ranh giới tuần thứ Hai - Chủ nhật', () => {
  it('09/11/2026 là thứ Hai, 15/11/2026 là Chủ nhật', () => {
    expect(layKhoangTuan('2026-11-11')).toEqual({ thuHai: '2026-11-09', chuNhat: '2026-11-15' });
  });

  it('Chủ nhật và thứ Hai tuần sau không cùng tuần', () => {
    expect(cungTuan('2026-11-15', '2026-11-16')).toBe(false);
    expect(cungTuan('2026-11-09', '2026-11-15')).toBe(true);
  });

  it('Chủ nhật 15/11 và thứ Hai 09/11 cùng tuần', () => {
    expect(cungTuan('2026-11-15', '2026-11-09')).toBe(true);
  });
});

describe('BoKiemTraHanMuc - BR08 (a) DEADLINE', () => {
  const deadline = hm({ id: 'h1', loai: 'DEADLINE', giaTri: '2026-11-30' });

  it('hạn chót sau DEADLINE là vi phạm', () => {
    const kq = BoKiemTraHanMuc.kiemTra([deadline], [], { hanChot: '2026-12-01', uocLuongGio: 1 });
    expect(kq.hopLe).toBe(false);
    expect(kq.danhSachViPham).toHaveLength(1);
  });

  it('hạn chót đúng ngày DEADLINE không vi phạm', () => {
    const kq = BoKiemTraHanMuc.kiemTra([deadline], [], { hanChot: '2026-11-30', uocLuongGio: 1 });
    expect(kq.hopLe).toBe(true);
  });
});

describe('BoKiemTraHanMuc - BR08 (b) NV_TOI_DA_NGAY', () => {
  const toiDa = hm({ id: 'h2', loai: 'NV_TOI_DA_NGAY', giaTri: 2 });

  it('đếm cả nhiệm vụ đang tạo: vượt trần là vi phạm', () => {
    const hienCo = [
      nv({ id: 'a', hanChot: '2026-11-11' }),
      nv({ id: 'b', hanChot: '2026-11-11' }),
    ];
    const kq = BoKiemTraHanMuc.kiemTra([toiDa], hienCo, { hanChot: '2026-11-11', uocLuongGio: 1 });
    expect(kq.hopLe).toBe(false);
    expect(kq.danhSachViPham[0]).toContain('3');
  });

  it('bằng đúng trần thì hợp lệ', () => {
    const hienCo = [nv({ id: 'a', hanChot: '2026-11-11' })];
    const kq = BoKiemTraHanMuc.kiemTra([toiDa], hienCo, { hanChot: '2026-11-11', uocLuongGio: 1 });
    expect(kq.hopLe).toBe(true);
  });

  it('không đếm nhiệm vụ DA_HUY', () => {
    const hienCo = [
      nv({ id: 'a', hanChot: '2026-11-11' }),
      nv({ id: 'b', hanChot: '2026-11-11', trangThai: 'DA_HUY' }),
    ];
    const kq = BoKiemTraHanMuc.kiemTra([toiDa], hienCo, { hanChot: '2026-11-11', uocLuongGio: 1 });
    expect(kq.hopLe).toBe(true);
  });

  it('nhiệm vụ khác ngày không ảnh hưởng', () => {
    const hienCo = [
      nv({ id: 'a', hanChot: '2026-11-11' }),
      nv({ id: 'b', hanChot: '2026-11-12' }),
    ];
    const kq = BoKiemTraHanMuc.kiemTra([toiDa], hienCo, { hanChot: '2026-11-13', uocLuongGio: 1 });
    expect(kq.hopLe).toBe(true);
  });
});

describe('BoKiemTraHanMuc - BR08 (c) GIO_TOI_DA_TUAN', () => {
  const gioTuan = hm({ id: 'h3', loai: 'GIO_TOI_DA_TUAN', giaTri: 10 });

  it('cộng giờ trong cùng tuần, tính cả nhiệm vụ đang tạo', () => {
    const hienCo = [nv({ id: 'a', hanChot: '2026-11-13', uocLuongGio: 6 })];
    const kq = BoKiemTraHanMuc.kiemTra([gioTuan], hienCo, { hanChot: '2026-11-15', uocLuongGio: 5 });
    expect(kq.hopLe).toBe(false);
    expect(kq.danhSachViPham[0]).toContain('11');
  });

  it('Chủ nhật và thứ Hai tuần sau không cộng chung', () => {
    const hienCo = [nv({ id: 'a', hanChot: '2026-11-15', uocLuongGio: 6 })];
    const kq = BoKiemTraHanMuc.kiemTra([gioTuan], hienCo, { hanChot: '2026-11-16', uocLuongGio: 5 });
    expect(kq.hopLe).toBe(true);
  });

  it('đúng bằng trần thì hợp lệ', () => {
    const hienCo = [nv({ id: 'a', hanChot: '2026-11-09', uocLuongGio: 6 })];
    const kq = BoKiemTraHanMuc.kiemTra([gioTuan], hienCo, { hanChot: '2026-11-15', uocLuongGio: 4 });
    expect(kq.hopLe).toBe(true);
  });
});

describe('BoKiemTraHanMuc - cập nhật và nhiều vi phạm', () => {
  it('bỏ qua chính bản ghi đang sửa khi capNhatNhiemVu', () => {
    const toiDa = hm({ id: 'h2', loai: 'NV_TOI_DA_NGAY', giaTri: 1 });
    const hienCo = [nv({ id: 'a', hanChot: '2026-11-11' })];
    const kq = BoKiemTraHanMuc.kiemTra([toiDa], hienCo,
      { hanChot: '2026-11-11', uocLuongGio: 1 }, 'a');
    expect(kq.hopLe).toBe(true);
  });

  it('nêu từng vi phạm khi đồng thời vượt DEADLINE và số nhiệm vụ/ngày', () => {
    const dsHanMuc = [
      hm({ id: 'h1', loai: 'DEADLINE', giaTri: '2026-11-30' }),
      hm({ id: 'h2', loai: 'NV_TOI_DA_NGAY', giaTri: 1 }),
    ];
    const hienCo = [nv({ id: 'a', hanChot: '2026-12-05', trangThai: 'HOAN_THANH', ngayHoanThanh: '2026-12-01' })];
    const kq = BoKiemTraHanMuc.kiemTra(dsHanMuc, hienCo, { hanChot: '2026-12-05', uocLuongGio: 1 });
    expect(kq.hopLe).toBe(false);
    expect(kq.danhSachViPham).toHaveLength(2);
  });

  it('không sửa dữ liệu nhiệm vụ hiện có (chưa ghi trước khi xác nhận - BR09)', () => {
    const hienCo = [nv({ id: 'a', hanChot: '2026-11-11' })];
    const truoc = JSON.parse(JSON.stringify(hienCo));
    BoKiemTraHanMuc.kiemTra(
      [hm({ id: 'h2', loai: 'NV_TOI_DA_NGAY', giaTri: 1 })],
      hienCo, { hanChot: '2026-11-11', uocLuongGio: 1 }
    );
    expect(hienCo).toEqual(truoc);
  });
});

describe('BoKiemTraHanMuc - BR10 không hồi tố', () => {
  it('báo vi phạm hiện có khi thiết lập hạn mức mới nhưng không sửa nhiệm vụ', () => {
    const hienCo = [
      nv({ id: 'a', hanChot: '2026-11-11' }),
      nv({ id: 'b', hanChot: '2026-11-11' }),
    ];
    const truoc = JSON.parse(JSON.stringify(hienCo));
    const viPham = BoKiemTraHanMuc.raSoatViPhamHienCo(
      hm({ id: 'h2', loai: 'NV_TOI_DA_NGAY', giaTri: 1 }), hienCo
    );
    expect(viPham).toHaveLength(1);
    expect(hienCo).toEqual(truoc);
  });
});
