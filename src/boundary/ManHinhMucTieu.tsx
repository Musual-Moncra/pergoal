import React, { useState } from 'react';
import { MucTieu, DanhMuc, UuTien, TrangThaiMucTieu, NhiemVu } from '../domain/types';
import { MucTieuController } from '../controller/MucTieuController';
import { BoTinhHieuSuat } from '../domain/BoTinhHieuSuat';
import { Target, Plus, FolderPlus, Trash2, Edit3, CheckCircle2, Clock, PauseCircle, XCircle } from 'lucide-react';

interface Props {
  tenDangNhap: string;
  mucTieus: MucTieu[];
  danhMucs: DanhMuc[];
  nhiemVus: NhiemVu[];
  onDataChange: () => void;
  onSelectMucTieu: (id: string) => void;
}

export const ManHinhMucTieu: React.FC<Props> = ({
  tenDangNhap,
  mucTieus,
  danhMucs,
  nhiemVus,
  onDataChange,
  onSelectMucTieu
}) => {
  const [showTaoModal, setShowTaoModal] = useState(false);
  const [showDanhMucModal, setShowDanhMucModal] = useState(false);
  const [editingMucTieu, setEditingMucTieu] = useState<MucTieu | null>(null);

  // Form tạo mục tiêu
  const [ten, setTen] = useState('');
  const [moTa, setMoTa] = useState('');
  const [maDanhMuc, setMaDanhMuc] = useState<string>('');
  const [ngayBatDau, setNgayBatDau] = useState(new Date().toISOString().split('T')[0]);
  const [ngayKetThuc, setNgayKetThuc] = useState('');
  const [uuTien, setUuTien] = useState<UuTien>('TRUNG_BINH');
  const [thongBaoLoi, setThongBaoLoi] = useState<string | null>(null);

  // Form tạo danh mục
  const [tenDM, setTenDM] = useState('');
  const [mauSacDM, setMauSacDM] = useState('#2563eb');

  // Lọc
  const [filterDanhMuc, setFilterDanhMuc] = useState<string>('ALL');

  const handleTaoMucTieu = (e: React.FormEvent) => {
    e.preventDefault();
    setThongBaoLoi(null);

    const res = MucTieuController.taoMucTieu(
      tenDangNhap,
      ten,
      moTa,
      maDanhMuc || null,
      ngayBatDau,
      ngayKetThuc,
      uuTien
    );

    if (res.success) {
      setShowTaoModal(false);
      setTen('');
      setMoTa('');
      setMaDanhMuc('');
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
      maDanhMuc: editingMucTieu.maDanhMuc,
      ngayBatDau: editingMucTieu.ngayBatDau,
      ngayKetThuc: editingMucTieu.ngayKetThuc,
      uuTien: editingMucTieu.uuTien
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
    if (confirm(`Bạn có chắc chắn muốn xóa mục tiêu "${tenMT}"? Toàn bộ nhiệm vụ và hạn mức trực thuộc cũng sẽ bị xóa (quan hệ Composition).`)) {
      MucTieuController.xoaMucTieu(tenDangNhap, id);
      onDataChange();
    }
  };

  const handleTaoDanhMuc = (e: React.FormEvent) => {
    e.preventDefault();
    const res = MucTieuController.taoDanhMuc(tenDangNhap, tenDM, mauSacDM);
    if (res.success) {
      setTenDM('');
      onDataChange();
    } else {
      alert(res.message);
    }
  };

  const handleXoaDanhMuc = (id: string, tenDMName: string) => {
    if (confirm(`Xóa danh mục "${tenDMName}"? Các mục tiêu trực thuộc sẽ chuyển về "Không danh mục" (BR17).`)) {
      MucTieuController.xoaDanhMuc(tenDangNhap, id);
      onDataChange();
    }
  };

  const filteredMucTieus = mucTieus.filter(mt => {
    if (filterDanhMuc === 'ALL') return true;
    if (filterDanhMuc === 'NONE') return !mt.maDanhMuc;
    return mt.maDanhMuc === filterDanhMuc;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={24} color="#2563eb" />
            <span>Mục tiêu của tôi ({filteredMucTieus.length})</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Quản lý kế hoạch, danh mục và giám sát tiến độ hoàn thành</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setShowDanhMucModal(true)}>
            <FolderPlus size={16} />
            <span>Danh mục</span>
          </button>
          <button className="btn btn-primary" onClick={() => { setThongBaoLoi(null); setShowTaoModal(true); }}>
            <Plus size={16} />
            <span>Tạo mục tiêu</span>
          </button>
        </div>
      </div>

      {/* Bộ lọc danh mục */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '16px', paddingBottom: '6px' }}>
        <button
          className={`btn btn-sm ${filterDanhMuc === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterDanhMuc('ALL')}
        >
          Tất cả ({mucTieus.length})
        </button>
        {danhMucs.map(dm => (
          <button
            key={dm.id}
            className={`btn btn-sm ${filterDanhMuc === dm.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderColor: dm.mauSac }}
            onClick={() => setFilterDanhMuc(dm.id)}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dm.mauSac }}></span>
            <span>{dm.ten}</span>
          </button>
        ))}
      </div>

      {/* Danh sách mục tiêu */}
      {filteredMucTieus.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 16px', color: '#64748b' }}>
          <Target size={48} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ fontWeight: 600 }}>Chưa có mục tiêu nào được tạo.</p>
          <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Hãy bắt đầu bằng cách nhấn "Tạo mục tiêu" ở trên!</p>
        </div>
      ) : (
        <div className="grid-2">
          {filteredMucTieus.map(mt => {
            const nvCuaMT = nhiemVus.filter(n => n.maMucTieu === mt.id);
            const tienDo = BoTinhHieuSuat.tinhTienDoMucTieu(nvCuaMT);
            const dm = danhMucs.find(d => d.id === mt.maDanhMuc);

            return (
              <div key={mt.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span className={`tag ${mt.trangThai === 'HOAN_THANH' ? 'tag-green' : mt.trangThai === 'DANG_THUC_HIEN' ? 'tag-blue' : mt.trangThai === 'TAM_DUNG' ? 'tag-yellow' : 'tag-gray'}`}>
                      {mt.trangThai}
                    </span>
                    {dm && (
                      <span className="tag" style={{ background: dm.mauSac + '20', color: dm.mauSac, border: `1px solid ${dm.mauSac}40` }}>
                        {dm.ten}
                      </span>
                    )}
                  </div>

                  <h3
                    style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px', cursor: 'pointer', color: '#1e293b' }}
                    onClick={() => onSelectMucTieu(mt.id)}
                  >
                    {mt.ten}
                  </h3>
                  {mt.moTa && <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '12px' }}>{mt.moTa}</p>}

                  <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '16px', marginBottom: '12px' }}>
                    <div>Bắt đầu: <strong>{mt.ngayBatDau}</strong></div>
                    <div>Kết thúc: <strong>{mt.ngayKetThuc}</strong></div>
                  </div>

                  {/* Tiến độ (Information Expert) */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span>Tiến độ thực hiện</span>
                      <span>{tienDo}% ({nvCuaMT.filter(n => n.trangThai === 'HOAN_THANH').length}/{nvCuaMT.filter(n => n.trangThai !== 'DA_HUY').length} NV)</span>
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
                      <button className="btn btn-sm btn-secondary" title="Tạm dừng" onClick={() => handleDoiTrangThai(mt.id, 'TAM_DUNG')}>
                        <PauseCircle size={14} />
                      </button>
                    )}
                    {mt.trangThai === 'TAM_DUNG' && (
                      <button className="btn btn-sm btn-secondary" title="Tiếp tục" onClick={() => handleDoiTrangThai(mt.id, 'DANG_THUC_HIEN')}>
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
                      Xem NV & Hạn mức
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
                  placeholder="Mục đích, kế hoạch chi tiết..."
                  value={moTa}
                  onChange={e => setMoTa(e.target.value)}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Danh mục</label>
                  <select
                    className="form-select"
                    value={maDanhMuc}
                    onChange={e => setMaDanhMuc(e.target.value)}
                  >
                    <option value="">(Không thuộc danh mục)</option>
                    {danhMucs.map(dm => (
                      <option key={dm.id} value={dm.id}>{dm.ten}</option>
                    ))}
                  </select>
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
              <div className="form-hint" style={{ marginBottom: '16px' }}>
                * Quy tắc BR03: Tên bắt buộc, Ngày kết thúc ≥ Ngày bắt đầu.
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
                  <label className="form-label">Danh mục</label>
                  <select
                    className="form-select"
                    value={editingMucTieu.maDanhMuc || ''}
                    onChange={e => setEditingMucTieu({ ...editingMucTieu, maDanhMuc: e.target.value || null })}
                  >
                    <option value="">(Không danh mục)</option>
                    {danhMucs.map(dm => (
                      <option key={dm.id} value={dm.id}>{dm.ten}</option>
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

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingMucTieu(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Quản lý Danh mục (UC06) */}
      {showDanhMucModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Quản lý danh mục</h3>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowDanhMucModal(false)}>✕</button>
            </div>

            <form onSubmit={handleTaoDanhMuc} style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '10px' }}>Thêm danh mục mới</h4>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Tên danh mục (VD: Học tập, Sức khỏe...)"
                  value={tenDM}
                  onChange={e => setTenDM(e.target.value)}
                  required
                />
                <input
                  type="color"
                  value={mauSacDM}
                  onChange={e => setMauSacDM(e.target.value)}
                  style={{ width: '42px', height: '42px', border: 'none', background: 'none', cursor: 'pointer' }}
                />
                <button type="submit" className="btn btn-primary">Thêm</button>
              </div>
            </form>

            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '10px' }}>Danh mục hiện có</h4>
            {danhMucs.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Chưa có danh mục nào.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {danhMucs.map(dm => (
                  <div key={dm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: dm.mauSac }}></span>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{dm.ten}</span>
                    </div>
                    <button className="btn btn-sm btn-danger" onClick={() => handleXoaDanhMuc(dm.id, dm.ten)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="form-hint" style={{ marginTop: '16px' }}>
              * BR17: Xóa danh mục sẽ chuyển các mục tiêu liên quan về "Không danh mục", không xóa mục tiêu.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
