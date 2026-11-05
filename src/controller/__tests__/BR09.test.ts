import { describe, it, expect, beforeEach } from 'vitest';
import { NhiemVuController } from '../NhiemVuController';
import { KhoDuLieu, DuLieuNguoiDung } from '../../domain/KhoDuLieu';
import type { MucTieu, NhiemVu, HanMuc } from '../../domain/types';

const USER = 'nguoidung1';

function taoKho(): Map<string, string> {
  const store = new Map<string, string>();
  const shim = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => store.set(k, String(v)),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
    key: (_i: number) => null,
    get length() {
      return store.size;
    },
  };
  (globalThis as any).localStorage = shim;
  return store;
}

function mucTieu(): MucTieu {
  return {
    id: 'mt1',
    ten: 'Mục tiêu 1',
    moTa: '',
    ngayBatDau: '2026-11-01',
    ngayKetThuc: '2026-11-30',
    uuTien: 'TRUNG_BINH',
    trangThai: 'DANG_THUC_HIEN',
    tenDangNhap: USER,
  };
}

function nhiemVu(id: string, patch: Partial<NhiemVu> = {}): NhiemVu {
  return {
    id,
    maMucTieu: 'mt1',
    ten: 'NV ' + id,
    moTa: '',
    hanChot: '2026-11-10',
    uuTien: 'TRUNG_BINH',
    trangThai: 'CHUA_LAM',
    uocLuongGio: 1,
    daGhiDeHanMuc: false,
    ...patch,
  };
}

function hanMuc(id: string, loai: HanMuc['loai'], giaTri: number | string): HanMuc {
  return {
    id,
    maMucTieu: 'mt1',
    loai,
    giaTri,
    donVi: '',
    ngayHieuLuc: '2026-11-01',
  };
}

function luu(dsNhiemVu: NhiemVu[], dsHanMuc: HanMuc[]): void {
  const data: DuLieuNguoiDung = {
    danhMuc: [],
    mucTieu: [mucTieu()],
    nhiemVu: dsNhiemVu,
    hanMuc: dsHanMuc,
    banGhiTienDo: [],
    nhacNho: [],
  };
  KhoDuLieu.luuDuLieu(USER, data);
}

beforeEach(() => {
  taoKho();
});

describe('NhiemVuController - BR09 khi tạo nhiệm vụ', () => {
  it('một NhacNho VUOT_HAN_MUC cho mỗi hạn mức bị vi phạm, có maHanMuc', () => {
    // Hai hạn mức cùng bị vi phạm: DEADLINE và NV_TOI_DA_NGAY
    luu(
      [nhiemVu('nv1', { hanChot: '2026-11-10' })],
      [
        hanMuc('h1', 'DEADLINE', '2026-11-05'),
        hanMuc('h2', 'NV_TOI_DA_NGAY', 1),
      ]
    );

    const kqTao = NhiemVuController.taoNhiemVu(
      USER, 'mt1', 'NV mới', '', '2026-11-10', 'TRUNG_BINH', 1
    );
    expect(kqTao.success).toBe(false);
    expect(kqTao.canhBaoHanMuc).toHaveLength(2);

    const kq = NhiemVuController.xacNhanVuotHanMuc(USER, true);
    expect(kq.success).toBe(true);

    const data = KhoDuLieu.layDuLieu(USER);
    const nhacVHM = data.nhacNho.filter(nn => nn.loai === 'VUOT_HAN_MUC');
    expect(nhacVHM).toHaveLength(2);
    expect(nhacVHM.every(nn => !!nn.maHanMuc)).toBe(true);
    expect(new Set(nhacVHM.map(nn => nn.maHanMuc))).toEqual(new Set(['h1', 'h2']));
  });
});

describe('NhiemVuController - BR09 khi cập nhật nhiệm vụ', () => {
  it('chưa ghi gì khi vi phạm và chưa xác nhận', () => {
    // Trần 1 giờ/tuần; hai NV cùng tuần, mỗi NV 1 giờ.
    luu(
      [
        nhiemVu('nv1', { hanChot: '2026-11-10', uocLuongGio: 1 }),
        nhiemVu('nv2', { hanChot: '2026-11-11', uocLuongGio: 1 }),
      ],
      [hanMuc('h1', 'GIO_TOI_DA_TUAN', 1)]
    );

    const kq = NhiemVuController.capNhatNhiemVu(USER, 'nv1', { uocLuongGio: 2 });
    expect(kq.canhBaoHanMuc).toBeDefined();

    const data = KhoDuLieu.layDuLieu(USER);
    const nv1 = data.nhiemVu.find(n => n.id === 'nv1')!;
    expect(nv1.uocLuongGio).toBe(1);
  });
});
