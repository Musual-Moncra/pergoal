import { describe, it, expect } from 'vitest';
import { BoKiemTraNangSuat, layKhoangTuan, cungTuan } from '../domain/BoKiemTraNangSuat';
import { NhiemVu, BANG_MUC_NANG_SUAT } from '../domain/types';

describe('BoKiemTraNangSuat', () => {
  it('layKhoangTuan xác định chính xác thứ Hai và Chủ nhật', () => {
    // 2026-11-05 là thứ Năm -> Thứ Hai: 2026-11-02, Chủ nhật: 2026-11-08
    const { thuHai, chuNhat } = layKhoangTuan('2026-11-05');
    expect(thuHai).toBe('2026-11-02');
    expect(chuNhat).toBe('2026-11-08');

    // Cùng tuần
    expect(cungTuan('2026-11-02', '2026-11-08')).toBe(true);
    expect(cungTuan('2026-11-05', '2026-11-09')).toBe(false); // 09/11 là tuần sau
  });

  it('phát hiện vi phạm số nhiệm vụ tối đa trong ngày theo BR07', () => {
    // Mức 1: tối đa 1 NV/ngày
    const capDo = 1;
    const nvs: NhiemVu[] = [
      {
        id: 'nv1',
        maMucTieu: 'mt1',
        ten: 'Việc 1',
        moTa: '',
        hanChot: '2026-11-05',
        uuTien: 'CAO',
        trangThai: 'CHUA_LAM',
        uocLuongGio: 1,
        phanTram: 0,
        daVuotMucNangSuat: false
      }
    ];

    // Thêm NV thứ 2 cùng ngày 2026-11-05
    const kt = BoKiemTraNangSuat.kiemTra(capDo, nvs, { hanChot: '2026-11-05', uocLuongGio: 1 });
    expect(kt.hopLe).toBe(false);
    expect(kt.danhSachViPham.some(v => v.includes('Vượt số nhiệm vụ tối đa trong ngày'))).toBe(true);

    // Thêm NV sang ngày khác (2026-11-06) trong tuần -> hợp lệ ngày, nhưng tổng giờ = 2h <= 5h -> hoàn toàn hợp lệ
    const kt2 = BoKiemTraNangSuat.kiemTra(capDo, nvs, { hanChot: '2026-11-06', uocLuongGio: 1 });
    expect(kt2.hopLe).toBe(true);
  });

  it('phát hiện vi phạm tổng giờ làm việc trong tuần theo BR07', () => {
    // Mức 1: tối đa 5h/tuần
    const capDo = 1;
    const nvs: NhiemVu[] = [
      {
        id: 'nv1',
        maMucTieu: 'mt1',
        ten: 'Việc 1',
        moTa: '',
        hanChot: '2026-11-03',
        uuTien: 'CAO',
        trangThai: 'CHUA_LAM',
        uocLuongGio: 4,
        phanTram: 0,
        daVuotMucNangSuat: false
      }
    ];

    // Thêm NV ngày 2026-11-06 (cùng tuần 02/11 - 08/11) ước lượng 3h -> tổng 7h > 5h
    const kt = BoKiemTraNangSuat.kiemTra(capDo, nvs, { hanChot: '2026-11-06', uocLuongGio: 3 });
    expect(kt.hopLe).toBe(false);
    expect(kt.danhSachViPham.some(v => v.includes('Vượt số giờ làm việc tối đa trong tuần'))).toBe(true);
  });

  it('bỏ qua các nhiệm vụ đã hủy (DA_HUY) khi kiểm tra hạn mức', () => {
    const capDo = 1; // 1 NV/ngày, 5h/tuần
    const nvs: NhiemVu[] = [
      {
        id: 'nv_huy',
        maMucTieu: 'mt1',
        ten: 'Việc đã hủy',
        moTa: '',
        hanChot: '2026-11-05',
        uuTien: 'CAO',
        trangThai: 'DA_HUY', // đã hủy
        uocLuongGio: 10,
        phanTram: 0,
        daVuotMucNangSuat: false
      }
    ];

    // Thêm NV mới vào ngày 2026-11-05 -> NV cũ đã hủy nên không bị tính
    const kt = BoKiemTraNangSuat.kiemTra(capDo, nvs, { hanChot: '2026-11-05', uocLuongGio: 2 });
    expect(kt.hopLe).toBe(true);
    expect(kt.danhSachViPham.length).toBe(0);
  });

  it('bỏ qua chính nhiệm vụ đang cập nhật (idNhiemVuBoQua)', () => {
    const capDo = 1;
    const nvs: NhiemVu[] = [
      {
        id: 'nv1',
        maMucTieu: 'mt1',
        ten: 'Việc 1',
        moTa: '',
        hanChot: '2026-11-05',
        uuTien: 'CAO',
        trangThai: 'CHUA_LAM',
        uocLuongGio: 3,
        phanTram: 0,
        daVuotMucNangSuat: false
      }
    ];

    // Cập nhật lại nv1 với giờ mới 4h (vẫn <= 5h)
    const kt = BoKiemTraNangSuat.kiemTra(
      capDo,
      nvs,
      { hanChot: '2026-11-05', uocLuongGio: 4 },
      'nv1'
    );
    expect(kt.hopLe).toBe(true);
  });

  it('raSoatViPhamHienCo cảnh báo đúng khi hạ mức năng suất (BR09)', () => {
    const nvs: NhiemVu[] = [
      {
        id: 'nv1',
        maMucTieu: 'mt1',
        ten: 'Việc 1',
        moTa: '',
        hanChot: '2026-11-05',
        uuTien: 'CAO',
        trangThai: 'CHUA_LAM',
        uocLuongGio: 4,
        phanTram: 0,
        daVuotMucNangSuat: false
      },
      {
        id: 'nv2',
        maMucTieu: 'mt1',
        ten: 'Việc 2',
        moTa: '',
        hanChot: '2026-11-05',
        uuTien: 'CAO',
        trangThai: 'CHUA_LAM',
        uocLuongGio: 4,
        phanTram: 0,
        daVuotMucNangSuat: false
      }
    ];

    // Hạ xuống mức 1 (tối đa 1 NV/ngày và 5h/tuần) -> Vi phạm cả ngày (2 NV) và tuần (8h)
    const canhBao = BoKiemTraNangSuat.raSoatViPhamHienCo(1, nvs);
    expect(canhBao.length).toBe(2);
    expect(canhBao.some(cb => cb.includes('vượt mức mới'))).toBe(true);
  });
});
