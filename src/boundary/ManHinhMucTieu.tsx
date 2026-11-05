import React, { useState } from 'react';
import { MucTieu, NhiemVu, UuTien, TrangThaiMucTieu, BANG_MUC_NANG_SUAT, ngayDiaPhuong } from '../domain/types';
import { MucTieuController } from '../controller/MucTieuController';
import { BoTinhHieuSuat } from '../domain/BoTinhHieuSuat';
import { Target, Plus, Trash2, Edit3, CheckCircle2, Clock, PauseCircle, XCircle, Zap, AlertCircle } from 'lucide-react';

interface Props {
  tenDangNhap: string;
  mucTieus: MucTieu[];
  nhiemVus: NhiemVu[];
  onDataChange: () => void;
  onSelectMucTieu: (id: string) => void;
}

export const ManHinhMucTieu: React.FC<Props> = ({
  tenDangNhap,
  mucTieus,
  nhiemVus,
  onDataChange,
  onSelectMucTieu
}) => {
  const [showTaoModal, setShowTaoModal] = useState(false);
  const [editingMucTieu, setEditingMucTieu] = useState<MucTieu | null>(null);

  // Form tạo mục tiêu
  const [ten, setTen] = useState('');
  const [moTa, setMoTa] = useState('');
  const [ngayBatDau, setNgayBatDau] = useState(ngayDiaPhuong());
  const [ngayKetThuc, setNgayKetThuc] = useState('');
  const [uuTien, setUuTien] = useState<UuTien>('TRUNG_BINH');
  const [capDo, setCapDo] = useState<number>(3);
  const [thongBaoLoi, setThongBaoLoi] = useState<string | null>(null);

  // Hộp thoại cảnh báo đổi mức năng suất (BR09)
  const [canhBaoDoiMuc, setCanhBaoDoiMuc] = useState<{ tenMT: string; capDo: number; viPham: string[] } | null>(null);

  const handleTaoMucTieu = (e: React.FormEvent) => {
    e.preventDefault();
    setThongBaoLoi(null);

    const res = MucTieuController.taoMucTieu(
      tenDangNhap,
      ten,
      moTa,
      ngayBatDau,
      ngayKetThuc,
      uuTien,
      capDo
    );

    if (res.success) {
      setShowTaoModal(false);
      setTen('');
      setMoTa('');
      setCapDo(3);
      onDataChange();
    } else {
      setThongBaoLoi(res.message);
    }
  };

  const handleCapNhatMucTieu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMucTieu) return;
    setThongBaoLoi(null);

    const res = MucTieuController.capNhatMucTieu(tenDangNhap, editingMucTieu.id, {
      ten: editingMucTieu.ten,
      moTa: editingMucTieu.moTa,
      ngayBatDau: editingMucTieu.ngayBatDau,
      ngayKetThuc: editingMucTieu.ngayKetThuc,
      uuTien: editingMucTieu.uuTien,
      capDo: editingMucTieu.capDo
    });

    if (res.success) {
      setEditingMucTieu(null);
      onDataChange();
    } else {
      setThongBaoLoi(res.message);
    }
  };

  const handleDoiTrangThai = (id: string, tt: TrangThaiMucTieu) => {
    MucTieuController.doiTrangThaiMucTieu(tenDangNhap, id, tt);
    onDataChange();
  };

  const handleXoaMucTieu = (id: string, tenMT: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa mục tiêu "${tenMT}"? Toàn bộ nhiệm vụ và lịch sử tiến độ liên quan cũng sẽ bị xóa.`)) {
      MucTieuController.xoaMucTieu(tenDangNhap, id);
      onDataChange();
    }
  };

  const handleDoiCapDoTrucTiep = (mt: MucTieu, capMoi: number) => {
    if (mt.capDo === capMoi) return;
    const res = MucTieuController.datMucNangSuat(tenDangNhap, mt.id, capMoi);
    if (res.success) {
      if (res.viPhamHienCo && res.viPhamHienCo.length > 0) {
        setCanhBaoDoiMuc({ tenMT: mt.ten, capDo: capMoi, viPham: res.viPhamHienCo });
      }
      onDataChange();
    } else {
      alert(res.message);
    }
  };

  const nhanTrangThai = (tt: TrangThaiMucTieu) => {
    switch (tt) {
      case 'DANG_THUC_HIEN': return { label: 'Đang thực hiện', cls: 'tag-blue' };
      case 'TAM_DUNG': return { label: 'Tạm dừng', cls: 'tag-yellow' };
      case 'HOAN_THANH': return { label: 'Hoàn thành', cls: 'tag-green' };
      case 'DA_HUY': return { label: 'Đã hủy', cls: 'tag-gray' };
    }
  };

  const nhanUuTien = (ut: UuTien) => {
    switch (ut) {
      case 'CAO': return { label: 'Ưu tiên cao', cls: 'tag-red' };
      case 'TRUNG_BINH': return { label: 'Ưu tiên trung bình', cls: 'tag-blue' };
      case 'THAP': return { label: 'Ưu tiên thấp', cls: 'tag-gray' };
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={24} color="#2563eb" />
            <span>Mục tiêu ({mucTieus.length})</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Quản lý mục tiêu, mức năng suất cam kết và theo dõi tiến độ tổng thể
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setThongBaoLoi(null); setShowTaoModal(true); }}>
          <Plus size={16} />
          <span>Tạo mục tiêu</span>
        </button>
      </div>

      {mucTieus.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 16px', color: '#64748b' }}>
          <Target size={48} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ fontWeight: 600 }}>Chưa có mục tiêu nào được tạo.</p>
          <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Bắt đầu bằng cách bấm "Tạo mục tiêu" ở phía trên.</p>
        </div>
      ) : (
        <div className="grid-2">
          {mucTieus.map(mt => {
            const nvCuaMT = nhiemVus.filter(n => n.maMucTieu === mt.id);
            const tienDo = BoTinhHieuSuat.tinhTienDoMucTieu(nvCuaMT);
            const tt = nhanTrangThai(mt.trangThai);
            const ut = nhanUuTien(mt.uuTien);
            const infoNangSuat = BANG_MUC_NANG_SUAT[mt.capDo] || BANG_MUC_NANG_SUAT[3];

            return (
              <div key={mt.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span className={`tag ${tt.cls}`}>{tt.label}</span>
                      <span className={`tag ${ut.cls}`}>{ut.label}</span>
                    </div>

                    {/* Mức năng suất 5 tia chớp bấm trực tiếp */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#f8fafc', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border)' }} title="Bấm để đổi mức năng suất">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleDoiCapDoTrucTiep(mt, star)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '1px',
                            color: star <= mt.capDo ? '#eab308' : '#cbd5e1',
                            fontSize: '1rem',
                            lineHeight: 1
                          }}
                        >
                          ⚡
                        </button>
                      ))}
                    </div>
                  </div>

                  <h3
                    style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px', cursor: 'pointer', color: '#1e293b' }}
                    onClick={() => onSelectMucTieu(mt.id)}
                  >
                    {mt.ten}
                  </h3>
                  {mt.moTa && <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '10px' }}>{mt.moTa}</p>}

                  {/* Thông tin mức năng suất chi tiết */}
                  <div style={{ fontSize: '0.75rem', color: '#475569', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', marginBottom: '12px' }}>
                    Mức năng suất <strong>{mt.capDo} ⚡</strong>: Tối đa <strong>{infoNangSuat.soNhiemVuToiDaNgay}</strong> nhiệm vụ/ngày, <strong>{infoNangSuat.soGioToiDaTuan}</strong> giờ/tuần
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '16px', marginBottom: '12px' }}>
                    <div>Bắt đầu: <strong>{mt.ngayBatDau}</strong></div>
                    <div>Kết thúc: <strong>{mt.ngayKetThuc}</strong></div>
                  </div>

                  {/* Thanh tiến độ mục tiêu */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span>Tiến độ mục tiêu (trung bình %)</span>
                      <span>{tienDo}% ({nvCuaMT.filter(n => n.trangThai !== 'DA_HUY').length} nhiệm vụ)</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${tienDo}%`, background: tienDo === 100 ? '#10b981' : '#2563eb' }}></div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '12px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {mt.trangThai !== 'HOAN_THANH' && (
                      <button className="btn btn-sm btn-success" title="Hoàn thành mục tiêu" onClick={() => handleDoiTrangThai(mt.id, 'HOAN_THANH')}>
                        <CheckCircle2 size={14} />
                      </button>
                    )}
                    {mt.trangThai === 'DANG_THUC_HIEN' && (
                      <button className="btn btn-sm btn-secondary" title="Tạm dừng mục tiêu" onClick={() => handleDoiTrangThai(mt.id, 'TAM_DUNG')}>
                        <PauseCircle size={14} />
                      </button>
                    )}
                    {mt.trangThai === 'TAM_DUNG' && (
                      <button className="btn btn-sm btn-secondary" title="Tiếp tục thực hiện" onClick={() => handleDoiTrangThai(mt.id, 'DANG_THUC_HIEN')}>
                        <Clock size={14} />
                      </button>
                    )}
                    {mt.trangThai !== 'DA_HUY' && (
                      <button className="btn btn-sm btn-secondary" title="Hủy mục tiêu" onClick={() => handleDoiTrangThai(mt.id, 'DA_HUY')}>
                        <XCircle size={14} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => onSelectMucTieu(mt.id)}>
                      Xem nhiệm vụ
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => { setThongBaoLoi(null); setEditingMucTieu(mt); }}>
                      <Edit3 size={14} />
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleXoaMucTieu(mt.id, mt.ten)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cảnh báo đổi mức năng suất (BR09) */}
      {canhBaoDoiMuc && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309' }}>
                <AlertCircle size={22} />
                <span>Nhiệm vụ vượt mức năng suất mới</span>
              </h3>
              <button className="btn btn-sm btn-secondary" onClick={() => setCanhBaoDoiMuc(null)}>✕</button>
            </div>
            <p style={{ fontSize: '0.875rem', marginBottom: '12px' }}>
              Mục tiêu <strong>{canhBaoDoiMuc.tenMT}</strong> đã chuyển sang mức năng suất <strong>{canhBaoDoiMuc.capDo} ⚡</strong>. Các nhiệm vụ hiện có đã vượt mức này:
            </p>
            <ul style={{ paddingLeft: '20px', fontSize: '0.825rem', color: '#b45309', marginBottom: '16px', lineHeight: 1.5 }}>
              {canhBaoDoiMuc.viPham.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
            <p style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', marginBottom: '16px' }}>
              Quy tắc không hồi tố: Các nhiệm vụ hiện có được giữ nguyên vẹn, không bị chỉnh sửa hay xóa bỏ.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setCanhBaoDoiMuc(null)}>
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo Mục tiêu (UC04) */}
      {showTaoModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Tạo mục tiêu mới</h3>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowTaoModal(false)}>✕</button>
            </div>
            {thongBaoLoi && <div className="alert alert-danger">{thongBaoLoi}</div>}
            <form onSubmit={handleTaoMucTieu}>
              <div className="form-group">
                <label className="form-label">Tên mục tiêu *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Đạt IELTS 7.5 trong quý này"
                  value={ten}
                  onChange={e => setTen(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Mục đích, kế hoạch..."
                  value={moTa}
                  onChange={e => setMoTa(e.target.value)}
                />
              </div>

              {/* Mức năng suất 1-5 ⚡ */}
              <div className="form-group">
                <label className="form-label">
                  Mức năng suất cam kết: <strong>{capDo} ⚡</strong> (Tối đa {BANG_MUC_NANG_SUAT[capDo].soNhiemVuToiDaNgay} NV/ngày, {BANG_MUC_NANG_SUAT[capDo].soGioToiDaTuan} giờ/tuần)
                </label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  {[1, 2, 3, 4, 5].map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      className={`btn ${capDo === lvl ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, padding: '8px 4px', fontSize: '0.9rem' }}
                      onClick={() => setCapDo(lvl)}
                    >
                      {lvl} ⚡
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Ngày bắt đầu *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={ngayBatDau}
                    onChange={e => setNgayBatDau(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ngày kết thúc *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={ngayKetThuc}
                    onChange={e => setNgayKetThuc(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Độ ưu tiên</label>
                <select
                  className="form-select"
                  value={uuTien}
                  onChange={e => setUuTien(e.target.value as UuTien)}
                >
                  <option value="THAP">Thấp</option>
                  <option value="TRUNG_BINH">Trung bình</option>
                  <option value="CAO">Cao</option>
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaoModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Tạo mục tiêu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Sửa Mục tiêu (UC05) */}
      {editingMucTieu && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Chỉnh sửa mục tiêu</h3>
              <button className="btn btn-sm btn-secondary" onClick={() => setEditingMucTieu(null)}>✕</button>
            </div>
            {thongBaoLoi && <div className="alert alert-danger">{thongBaoLoi}</div>}
            <form onSubmit={handleCapNhatMucTieu}>
              <div className="form-group">
                <label className="form-label">Tên mục tiêu *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingMucTieu.ten}
                  onChange={e => setEditingMucTieu({ ...editingMucTieu, ten: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={editingMucTieu.moTa}
                  onChange={e => setEditingMucTieu({ ...editingMucTieu, moTa: e.target.value })}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Ngày bắt đầu</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editingMucTieu.ngayBatDau}
                    onChange={e => setEditingMucTieu({ ...editingMucTieu, ngayBatDau: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ngày kết thúc</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editingMucTieu.ngayKetThuc}
                    onChange={e => setEditingMucTieu({ ...editingMucTieu, ngayKetThuc: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Mức năng suất</label>
                  <select
                    className="form-select"
                    value={editingMucTieu.capDo}
                    onChange={e => setEditingMucTieu({ ...editingMucTieu, capDo: parseInt(e.target.value, 10) || 3 })}
                  >
                    {[1, 2, 3, 4, 5].map(l => (
                      <option key={l} value={l}>
                        Mức {l} ⚡ (Tối đa {BANG_MUC_NANG_SUAT[l].soNhiemVuToiDaNgay} NV/ngày, {BANG_MUC_NANG_SUAT[l].soGioToiDaTuan}h/tuần)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Độ ưu tiên</label>
                  <select
                    className="form-select"
                    value={editingMucTieu.uuTien}
                    onChange={e => setEditingMucTieu({ ...editingMucTieu, uuTien: e.target.value as UuTien })}
                  >
                    <option value="THAP">Thấp</option>
                    <option value="TRUNG_BINH">Trung bình</option>
                    <option value="CAO">Cao</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingMucTieu(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
