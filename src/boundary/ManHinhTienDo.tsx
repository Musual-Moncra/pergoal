import React, { useState } from 'react';
import { NhiemVu, HanMuc, BanGhiTienDo } from '../domain/types';
import { TienDoController } from '../controller/TienDoController';
import { Activity, Plus, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Props {
  tenDangNhap: string;
  nhiemVus: NhiemVu[];
  hanMucs: HanMuc[];
  banGhiTienDos: BanGhiTienDo[];
  preSelectedNhiemVu?: NhiemVu | null;
  onDataChange: () => void;
  onClose?: () => void;
}

export const ManHinhTienDo: React.FC<Props> = ({
  tenDangNhap,
  nhiemVus,
  hanMucs,
  banGhiTienDos,
  preSelectedNhiemVu,
  onDataChange,
  onClose
}) => {
  const [tab, setTab] = useState<'NHIEM_VU' | 'CHI_TIEU'>('NHIEM_VU');

  // Form cập nhật tiến độ nhiệm vụ
  const [maNV, setMaNV] = useState<string>(preSelectedNhiemVu?.id || (nhiemVus[0]?.id || ''));
  const [phanTram, setPhanTram] = useState<number>(50);
  const [soGioThucTe, setSoGioThucTe] = useState<number>(1);
  const [ghiChuNV, setGhiChuNV] = useState<string>('');

  // Form ghi nhận chỉ tiêu định lượng
  const chiTieuList = hanMucs.filter(hm => hm.loai === 'CHI_TIEU_DINH_LUONG');
  const [maHM, setMaHM] = useState<string>(chiTieuList[0]?.id || '');
  const [giaTriDinhLuong, setGiaTriDinhLuong] = useState<number>(5);
  const [ngayGhiChiTieu, setNgayGhiChiTieu] = useState<string>(new Date().toISOString().split('T')[0]);
  const [ghiChuChiTieu, setGhiChuChiTieu] = useState<string>('');

  const [thongBaoLoi, setThongBaoLoi] = useState<string | null>(null);
  const [thongBaoThanhCong, setThongBaoThanhCong] = useState<string | null>(null);

  const handleCapNhatTienDoNV = (e: React.FormEvent) => {
    e.preventDefault();
    setThongBaoLoi(null);
    setThongBaoThanhCong(null);

    const res = TienDoController.capNhatTienDo(
      tenDangNhap,
      maNV,
      phanTram,
      soGioThucTe,
      ghiChuNV
    );

    if (res.success) {
      setThongBaoThanhCong(res.message);
      setGhiChuNV('');
      onDataChange();
      if (onClose) setTimeout(onClose, 800);
    } else {
      setThongBaoLoi(res.message);
    }
  };

  const handleGhiNhanChiTieu = (e: React.FormEvent) => {
    e.preventDefault();
    setThongBaoLoi(null);
    setThongBaoThanhCong(null);

    const res = TienDoController.ghiNhanChiTieu(
      tenDangNhap,
      maHM,
      giaTriDinhLuong,
      ngayGhiChiTieu,
      ghiChuChiTieu
    );

    if (res.success) {
      setThongBaoThanhCong(res.message);
      setGhiChuChiTieu('');
      onDataChange();
    } else {
      setThongBaoLoi(res.message);
    }
  };

  const availableTasks = nhiemVus.filter(nv => nv.trangThai !== 'HOAN_THANH' && nv.trangThai !== 'DA_HUY');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={24} color="#2563eb" />
            <span>Ghi nhận Tiến độ & Chỉ tiêu (UC10)</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Cập nhật giờ lao động thực tế, tỷ lệ hoàn thành hoặc tích lũy chỉ tiêu định lượng tuần
          </p>
        </div>
        {onClose && (
          <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          className={`btn ${tab === 'NHIEM_VU' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setTab('NHIEM_VU'); setThongBaoLoi(null); setThongBaoThanhCong(null); }}
        >
          Tiến độ Nhiệm vụ (BR11, BR12)
        </button>
        <button
          className={`btn ${tab === 'CHI_TIEU' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setTab('CHI_TIEU'); setThongBaoLoi(null); setThongBaoThanhCong(null); }}
        >
          Chỉ tiêu định lượng (BR13)
        </button>
      </div>

      {thongBaoLoi && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{thongBaoLoi}</span>
        </div>
      )}

      {thongBaoThanhCong && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <span>{thongBaoThanhCong}</span>
        </div>
      )}

      {tab === 'NHIEM_VU' ? (
        <div className="grid-2">
          <div className="card">
            <h3 className="card-title">Cập nhật tiến độ nhiệm vụ</h3>
            {availableTasks.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                Hiện không có nhiệm vụ nào đang mở (tất cả đã hoàn thành hoặc bị hủy).
              </p>
            ) : (
              <form onSubmit={handleCapNhatTienDoNV}>
                <div className="form-group">
                  <label className="form-label">Chọn nhiệm vụ *</label>
                  <select
                    className="form-select"
                    value={maNV}
                    onChange={e => setMaNV(e.target.value)}
                    required
                  >
                    {availableTasks.map(nv => (
                      <option key={nv.id} value={nv.id}>
                        {nv.ten} (Hạn: {nv.hanChot} | Trạng thái: {nv.trangThai})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Tiến độ tích lũy: {phanTram}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={phanTram}
                      onChange={e => setPhanTram(parseInt(e.target.value, 10))}
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                      <span>0%</span>
                      <span>50%</span>
                      <span>100% (Xong)</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Số giờ thực tế lần này (h)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="form-input"
                      value={soGioThucTe}
                      onChange={e => setSoGioThucTe(parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Ghi chú tiến độ</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VD: Đã đọc xong 20 trang đầu..."
                    value={ghiChuNV}
                    onChange={e => setGhiChuNV(e.target.value)}
                  />
                </div>

                <div className="form-hint" style={{ marginBottom: '16px' }}>
                  * BR11: Nếu phần trăm &lt; 100%, nhiệm vụ chuyển trạng thái ĐANG_LAM. Nếu đạt 100%, tự động chuyển HOAN_THANH (BR12).
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Lưu tiến độ
                </button>
              </form>
            )}
          </div>

          <div className="card">
            <h3 className="card-title">Lịch sử ghi nhận gần đây</h3>
            {banGhiTienDos.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Chưa có bản ghi tiến độ nào.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
                {banGhiTienDos.slice().reverse().map(bg => {
                  const nv = nhiemVus.find(n => n.id === bg.maNhiemVu);
                  const hm = hanMucs.find(h => h.id === bg.maHanMuc);

                  return (
                    <div key={bg.id} style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
                        <span>{bg.ngayGhi}</span>
                        {bg.soGioThucTe > 0 && <span>+{bg.soGioThucTe} giờ</span>}
                        {bg.giaTriDinhLuong !== undefined && bg.giaTriDinhLuong > 0 && (
                          <span style={{ fontWeight: 700, color: '#2563eb' }}>
                            +{bg.giaTriDinhLuong} {hm?.donVi}
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: '2px' }}>
                        {nv ? nv.ten : hm ? `Chỉ tiêu: ${hm.giaTri} ${hm.donVi}` : 'Ghi nhận'}
                      </div>
                      {bg.phanTram > 0 && (
                        <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                          Tiến độ: {bg.phanTram}%
                        </div>
                      )}
                      {bg.ghiChu && (
                        <div style={{ fontSize: '0.75rem', color: '#475569', fontStyle: 'italic', marginTop: '2px' }}>
                          "{bg.ghiChu}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid-2">
          <div className="card">
            <h3 className="card-title">Ghi nhận chỉ tiêu định lượng tuần</h3>
            {chiTieuList.length === 0 ? (
              <div>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '12px' }}>
                  Chưa có hạn mức loại "Chỉ tiêu định lượng" nào được tạo.
                </p>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Vào tab <strong>Hạn mức</strong> &gt; <strong>Thêm hạn mức</strong> &gt; Chọn loại <strong>Chỉ tiêu định lượng</strong> (ví dụ: Chạy bộ 30 km/tuần).
                </p>
              </div>
            ) : (
              <form onSubmit={handleGhiNhanChiTieu}>
                <div className="form-group">
                  <label className="form-label">Chọn chỉ tiêu định lượng *</label>
                  <select
                    className="form-select"
                    value={maHM}
                    onChange={e => setMaHM(e.target.value)}
                    required
                  >
                    {chiTieuList.map(hm => (
                      <option key={hm.id} value={hm.id}>
                        {hm.giaTri} {hm.donVi} (Mã: {hm.id.substring(0, 8)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Số lượng thực hiện thêm ({'>'} 0) *</label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      className="form-input"
                      value={giaTriDinhLuong}
                      onChange={e => setGiaTriDinhLuong(parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ngày thực hiện *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={ngayGhiChiTieu}
                      onChange={e => setNgayGhiChiTieu(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Ghi chú</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VD: Chạy bộ quanh công viên sáng nay"
                    value={ghiChuChiTieu}
                    onChange={e => setGhiChuChiTieu(e.target.value)}
                  />
                </div>

                <div className="form-hint" style={{ marginBottom: '16px' }}>
                  * BR13: Giá trị định lượng &gt; 0, được cộng dồn theo tuần (thứ Hai đến Chủ nhật) để tính tỷ lệ đạt chỉ tiêu trong Báo cáo hiệu suất.
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Ghi nhận chỉ tiêu
                </button>
              </form>
            )}
          </div>

          <div className="card">
            <h3 className="card-title">Các chỉ tiêu đang theo dõi</h3>
            {chiTieuList.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Chưa có chỉ tiêu định lượng.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {chiTieuList.map(hm => {
                  const homNay = new Date().toISOString().split('T')[0];
                  // Tính tổng giá trị tuần hiện tại
                  const tongTuan = banGhiTienDos
                    .filter(bg => bg.maHanMuc === hm.id)
                    .reduce((sum, bg) => sum + (bg.giaTriDinhLuong || 0), 0);
                  const mucTieuSo = Number(hm.giaTri);
                  const pt = mucTieuSo > 0 ? Math.min(100, (tongTuan / mucTieuSo) * 100) : 0;

                  return (
                    <div key={hm.id} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span>Chỉ tiêu: {hm.giaTri} {hm.donVi}</span>
                        <span style={{ color: '#2563eb' }}>{pt.toFixed(1)}%</span>
                      </div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${pt}%`, background: pt >= 100 ? '#10b981' : '#2563eb' }}></div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Đã ghi: {tongTuan} {hm.donVi}</span>
                        <span>Cần: {hm.giaTri} {hm.donVi}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
