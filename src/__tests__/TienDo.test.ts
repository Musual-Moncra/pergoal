import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { NhiemVuController } from '../controller/NhiemVuController';
import { MucTieuController } from '../controller/MucTieuController';
import { KhoDuLieu } from '../domain/KhoDuLieu';
import { BoTinhHieuSuat } from '../domain/BoTinhHieuSuat';
import { ngayDiaPhuong } from '../domain/types';

describe('Cập nhật tiến độ (UC09, BR10, BR11)', () => {
  const testUser = 'user_tiendo_test';

  const storage = new Map<string, string>();
  beforeAll(() => {
    (globalThis as any).localStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, val: string) => storage.set(key, String(val)),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear()
    };
  });

  beforeEach(() => {
    localStorage.clear();
    // Tạo sẵn 1 mục tiêu
    MucTieuController.taoMucTieu(
      testUser,
      'Mục tiêu học tập',
      'Mô tả mục tiêu',
      '2026-11-01',
      '2026-11-30',
      'CAO',
      3
    );
  });

  it('từ chối phần trăm ngoài 0..100 hoặc số giờ âm (BR10)', () => {
    const data = KhoDuLieu.layDuLieu(testUser);
    const mt = data.mucTieu[0];

    const resTao = NhiemVuController.taoNhiemVu(
      testUser,
      mt.id,
      'Học bài',
      '',
      '2026-11-10',
      'TRUNG_BINH',
      2
    );
    const nvId = resTao.nhiemVu!.id;

    // Test phanTram < 0
    const resAm = NhiemVuController.capNhatTienDo(testUser, nvId, -5);
    expect(resAm.success).toBe(false);

    // Test phanTram > 100
    const resQua = NhiemVuController.capNhatTienDo(testUser, nvId, 105);
    expect(resQua.success).toBe(false);

    // Test soGioThucTe < 0
    const resGioAm = NhiemVuController.capNhatTienDo(testUser, nvId, 50, -1);
    expect(resGioAm.success).toBe(false);
  });

  it('chuyển trạng thái theo phần trăm: 0 -> CHUA_LAM, 1..99 -> DANG_LAM, 100 -> HOAN_THANH (BR11)', () => {
    const data = KhoDuLieu.layDuLieu(testUser);
    const mt = data.mucTieu[0];

    const resTao = NhiemVuController.taoNhiemVu(
      testUser,
      mt.id,
      'Làm bài tập',
      '',
      '2026-11-10',
      'TRUNG_BINH',
      3
    );
    const nvId = resTao.nhiemVu!.id;
    const homNay = ngayDiaPhuong();

    // 1. Cập nhật 50% -> DANG_LAM, ngayHoanThanh là null
    const res50 = NhiemVuController.capNhatTienDo(testUser, nvId, 50, 1.5, 'Xong nửa bài');
    expect(res50.success).toBe(true);

    let currentData = KhoDuLieu.layDuLieu(testUser);
    let nv = currentData.nhiemVu.find(n => n.id === nvId)!;
    expect(nv.phanTram).toBe(50);
    expect(nv.trangThai).toBe('DANG_LAM');
    expect(nv.ngayHoanThanh).toBeNull();
    expect(currentData.banGhiTienDo.length).toBe(1);
    expect(currentData.banGhiTienDo[0].phanTram).toBe(50);
    expect(currentData.banGhiTienDo[0].soGioThucTe).toBe(1.5);
    expect(currentData.banGhiTienDo[0].ghiChu).toBe('Xong nửa bài');

    // 2. Cập nhật 100% -> HOAN_THANH, ngayHoanThanh = homNay
    const res100 = NhiemVuController.capNhatTienDo(testUser, nvId, 100, 1.5, 'Hoàn thành bài');
    expect(res100.success).toBe(true);

    currentData = KhoDuLieu.layDuLieu(testUser);
    nv = currentData.nhiemVu.find(n => n.id === nvId)!;
    expect(nv.phanTram).toBe(100);
    expect(nv.trangThai).toBe('HOAN_THANH');
    expect(nv.ngayHoanThanh).toBe(homNay);
    expect(currentData.banGhiTienDo.length).toBe(2);

    // 3. Hạ phần trăm từ 100 xuống 60 -> Mở lại nhiệm vụ: DANG_LAM, ngayHoanThanh = null (BR11)
    const resHa = NhiemVuController.capNhatTienDo(testUser, nvId, 60, 0, 'Phát hiện thiếu sót, làm tiếp');
    expect(resHa.success).toBe(true);

    currentData = KhoDuLieu.layDuLieu(testUser);
    nv = currentData.nhiemVu.find(n => n.id === nvId)!;
    expect(nv.phanTram).toBe(60);
    expect(nv.trangThai).toBe('DANG_LAM');
    expect(nv.ngayHoanThanh).toBeNull();
    expect(currentData.banGhiTienDo.length).toBe(3);

    // 4. Hạ phần trăm về 0 -> CHUA_LAM, ngayHoanThanh = null
    const res0 = NhiemVuController.capNhatTienDo(testUser, nvId, 0);
    expect(res0.success).toBe(true);

    currentData = KhoDuLieu.layDuLieu(testUser);
    nv = currentData.nhiemVu.find(n => n.id === nvId)!;
    expect(nv.phanTram).toBe(0);
    expect(nv.trangThai).toBe('CHUA_LAM');
    expect(nv.ngayHoanThanh).toBeNull();
  });

  it('từ chối cập nhật tiến độ đối với nhiệm vụ đã hủy DA_HUY (BR11)', () => {
    const data = KhoDuLieu.layDuLieu(testUser);
    const mt = data.mucTieu[0];

    const resTao = NhiemVuController.taoNhiemVu(
      testUser,
      mt.id,
      'Việc sẽ hủy',
      '',
      '2026-11-10',
      'THAP',
      1
    );
    const nvId = resTao.nhiemVu!.id;

    NhiemVuController.huyNhiemVu(testUser, nvId);

    const resCapNhat = NhiemVuController.capNhatTienDo(testUser, nvId, 80);
    expect(resCapNhat.success).toBe(false);
    expect(resCapNhat.message).toContain('hủy');
  });

  it('tiến độ mục tiêu phản ánh đúng trung bình cộng % của các nhiệm vụ', () => {
    const data = KhoDuLieu.layDuLieu(testUser);
    const mt = data.mucTieu[0];

    const nv1 = NhiemVuController.taoNhiemVu(testUser, mt.id, 'Việc 1', '', '2026-11-10', 'TRUNG_BINH', 1).nhiemVu!;
    const nv2 = NhiemVuController.taoNhiemVu(testUser, mt.id, 'Việc 2', '', '2026-11-10', 'TRUNG_BINH', 1).nhiemVu!;

    // Cập nhật nv1 = 80%, nv2 = 40%
    NhiemVuController.capNhatTienDo(testUser, nv1.id, 80);
    NhiemVuController.capNhatTienDo(testUser, nv2.id, 40);

    const updatedData = KhoDuLieu.layDuLieu(testUser);
    const nvList = updatedData.nhiemVu.filter(n => n.maMucTieu === mt.id);
    const tienDoMT = BoTinhHieuSuat.tinhTienDoMucTieu(nvList);

    // (80 + 40) / 2 = 60%
    expect(tienDoMT).toBe(60);
  });

  it('NV đã xong ghi thêm ở 100% vẫn giữ ngày hoàn thành cũ (BR11)', () => {
    const data = KhoDuLieu.layDuLieu(testUser);
    const mt = data.mucTieu[0];
    data.nhiemVu.push({
      id: 'nv_xong', maMucTieu: mt.id, ten: 'Đã xong', moTa: '', hanChot: mt.ngayKetThuc, uuTien: 'THAP',
      trangThai: 'HOAN_THANH', uocLuongGio: 1, phanTram: 100, ngayHoanThanh: '2026-01-02', daVuotMucNangSuat: false
    });
    KhoDuLieu.luuDuLieu(testUser, data);

    expect(NhiemVuController.capNhatTienDo(testUser, 'nv_xong', 100, 1).success).toBe(true);
    const nv = KhoDuLieu.layDuLieu(testUser).nhiemVu.find(n => n.id === 'nv_xong')!;
    expect(nv.ngayHoanThanh).toBe('2026-01-02');
  });

  it('datMucNangSuat từ chối mức ngoài 1..5 và giữ mức cũ (BR06)', () => {
    const mt = KhoDuLieu.layDuLieu(testUser).mucTieu[0];
    for (const capDo of [0, 6, 2.5]) {
      expect(MucTieuController.datMucNangSuat(testUser, mt.id, capDo).success).toBe(false);
    }
    expect(KhoDuLieu.layDuLieu(testUser).mucTieu[0].capDo).toBe(mt.capDo);
    expect(MucTieuController.datMucNangSuat(testUser, mt.id, 5).success).toBe(true);
  });
});
