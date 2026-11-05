import { KhoDuLieu } from '../domain/KhoDuLieu';
import { BoTinhHieuSuat } from '../domain/BoTinhHieuSuat';
import { BaoCaoHieuSuat, ngayDiaPhuong } from '../domain/types';

export class BaoCaoController {
  /**
   * UC10: xemBaoCaoHieuSuat(tuNgay, denNgay, maMucTieu)
   */
  public static xemBaoCaoHieuSuat(
    tenDangNhap: string,
    tuNgay: string,
    denNgay: string,
    maMucTieu?: string | null
  ): {
    baoCao: BaoCaoHieuSuat;
    tienDoMucTieuList: Array<{ id: string; ten: string; tienDo: number; capDo: number }>;
  } {
    const data = KhoDuLieu.layDuLieu(tenDangNhap);
    const homNay = ngayDiaPhuong();

    const baoCao = BoTinhHieuSuat.tinhBaoCaoHieuSuat(
      tuNgay,
      denNgay,
      data.nhiemVu,
      data.banGhiTienDo,
      homNay,
      maMucTieu
    );

    // Tính tiến độ của từng mục tiêu (Information Expert)
    const tienDoMucTieuList = data.mucTieu.map(mt => {
      const nvCuaMT = data.nhiemVu.filter(n => n.maMucTieu === mt.id);
      return {
        id: mt.id,
        ten: mt.ten,
        tienDo: BoTinhHieuSuat.tinhTienDoMucTieu(nvCuaMT),
        capDo: mt.capDo
      };
    });

    return {
      baoCao,
      tienDoMucTieuList
    };
  }
}
