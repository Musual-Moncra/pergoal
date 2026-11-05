import React, { useState } from 'react';
import { MucTieu, NhiemVu, UuTien, TrangThaiNhiemVu } from '../domain/types';
import { NhiemVuController } from '../controller/NhiemVuController';
import { TienDoController } from '../controller/TienDoController';
import { CheckSquare, Plus, AlertTriangle, CheckCircle2, Clock, Trash2, XCircle, Edit3 } from 'lucide-react';

interface Props {
  tenDangNhap: string;
  mucTieus: MucTieu[];
  nhiemVus: NhiemVu[];
  selectedMucTieuId?: string;
  onDataChange: () => void;
  onOpenCapNhatTienDo: (nv: NhiemVu) => void;
}

export const ManHinhNhiemVu: React.FC<Props> = ({
  tenDangNhap,
  mucTieus,
  nhiemVus,
  selectedMucTieuId,
  onDataChange,
  onOpenCapNhatTienDo
}) => {
  const [filterMucTieu, setFilterMucTieu] = useState<string>(selectedMucTieuId || 'ALL');
  const [filterTrangThai, setFilterTrangThai] = useState<string>('ALL');

  const [showTaoModal, setShowTaoModal] = useState(false);
  const [editingNV, setEditingNV] = useState<NhiemVu | null>(null);

  // Form tạo nhiệm vụ
  const [maMT, setMaMT] = useState(selectedMucTieuId || (mucTieus[0]?.id || ''));
  const [ten, setTen] = useState('');
  const [moTa, setMoTa] = useState('');
  const [hanChot, setHanChot] = useState(new Date().toISOString().split('T')[0]);
  const [uuTien, setUuTien] = useState<UuTien>('TRUNG_BINH');
  const [uocLuongGio, setUocLuongGio] = useState<number>(2);

  // Cảnh báo lỗi và cảnh báo vượt hạn mức (BR08, BR09)
  const [loiCoBan, setLoiCoBan] = useState<string | null>(null);
  const [danhSachViPhamHanMuc, setDanhSachViPhamHanMuc] = useState<string[] | null>(null);

  const handleKiemTraVaTao = (e: React.FormEvent) => {
    e.preventDefault();
    setLoiCoBan(null);
    setDanhSachViPhamHanMuc(null);

    const res = NhiemVuController.taoNhiemVu(
      tenDangNhap,
      maMT,
      ten,
      moTa,
      hanChot,
      uuTien,
      uocLuongGio
    );

    if (res.success) {
      resetForm();
      onDataChange();
    } else {
      if (res.canhBaoHanMuc && res.canhBaoHanMuc.length > 0) {
        setDanhSachViPhamHanMuc(res.canhBaoHanMuc);
      } else {
        setLoiCoBan(res.message);
      }
    }
  };

  // Xác nhận ghi đè hạn mức BR09
  const handleXacNhanGhiDe = () => {
    const res = NhiemVuController.xacNhanVuotHanMuc(tenDangNhap, true);
    if (res.success) {
      resetForm();
      onDataChange();
    } else {
      setLoiCoBan(res.message);
    }
  };

  const handleHuyGhiDe = () => {
    NhiemVuController.xacNhanVuotHanMuc(tenDangNhap, false);
    setDanhSachViPhamHanMuc(null);
  };

  const resetForm = () => {
    setShowTaoModal(false);
    setDanhSachViPhamHanMuc(null);
    setLoiCoBan(null);
    setTen('');
    setMoTa('');
    setUocLuongGio(2);
  };

  const handleHoanThanhNhanh = (nv: NhiemVu) => {
    const res = TienDoController.hoanThanhNhiemVu(tenDangNhap, nv.id);
    if (res.success) {
      onDataChange();
    } else {
      alert(res.message);
    }
  };

  const handleHuyNhiemVu = (nv: NhiemVu) => {
    if (confirm(`Hủy nhiệm vụ "${nv.ten}"?`)) {
      NhiemVuController.huyNhiemVu(tenDangNhap, nv.id);
      onDataChange();
    }
  };

  const handleXoaNhiemVu = (nv: NhiemVu) => {
    if (confirm(`Xóa hoàn toàn nhiệm vụ "${nv.ten}"?`)) {
      NhiemVuController.xoaNhiemVu(tenDangNhap, nv.id);
      onDataChange();
    }
  };

  const handleCapNhatNV = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNV) return;

    const res = NhiemVuController.capNhatNhiemVu(tenDangNhap, editingNV.id, {
      ten: editingNV.ten,
      moTa: editingNV.moTa,
      hanChot: editingNV.hanChot,
      uuTien: editingNV.uuTien,
      uocLuongGio: editingNV.uocLuongGio
    });

    if (res.success) {
      if (res.canhBaoHanMuc && res.canhBaoHanMuc.length > 0) {
        alert('Cập nhật thành công nhưng nhiệm vụ này đang vượt hạn mức:\n' + res.canhBaoHanMuc.join('\n'));
      }
      setEditingNV(null);
      onDataChange();
    } else {
      alert(res.message);
    }
  };

  const homNay = new Date().toISOString().split('T')[0];

  const filteredNhiemVus = nhiemVus.filter(nv => {
    if (filterMucTieu !== 'ALL' && nv.maMucTieu !== filterMucTieu) return false;
    if (filterTrangThai !== 'ALL') {
      if (filterTrangThai === 'TRE') {
        // Suy ra: chưa hoàn thành và hanChot < homNay
        return nv.trangThai !== 'HOAN_THANH' && nv.trangThai !== 'DA_HUY' && nv.hanChot < homNay;
      }
      return nv.trangThai === filterTrangThai;
    }
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare size={24} color="#2563eb" />
            <span>Danh sách Nhiệm vụ ({filteredNhiemVus.length})</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Theo dõi đầu việc, kiểm soát hạn chót và phát hiện vượt hạn mức</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (mucTieus.length === 0) {
              alert('Vui lòng tạo ít nhất 1 Mục tiêu trước khi tạo Nhiệm vụ!');
              return;
            }
            setMaMT(selectedMucTieuId || mucTieus[0].id);
            setLoiCoBan(null);
            setDanhSachViPhamHanMuc(null);
            setShowTaoModal(true);
          }}
        >
          <Plus size={16} />
          <span>Tạo nhiệm vụ</span>
        </button>
      </div>

      {/* Bộ lọc */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Mục tiêu:</span>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '6px 10px', fontSize: '0.85rem' }}
              value={filterMucTieu}
              onChange={e => setFilterMucTieu(e.target.value)}
            >
              <option value="ALL">Tất cả mục tiêu ({mucTieus.length})</option>
              {mucTieus.map(mt => (
                <option key={mt.id} value={mt.id}>{mt.ten}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Trạng thái:</span>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '6px 10px', fontSize: '0.85rem' }}
              value={filterTrangThai}
              onChange={e => setFilterTrangThai(e.target.value)}
            >
              <option value="ALL">Tất cả</option>
              <option value="CHUA_LAM">Chưa làm</option>
              <option value="DANG_LAM">Đang làm</option>
              <option value="HOAN_THANH">Đã hoàn thành</option>
              <option value="TRE">Đang trễ hạn</option>
              <option value="DA_HUY">Đã hủy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Danh sách nhiệm vụ dạng bảng/card responsive */}
      {filteredNhiemVus.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
          <CheckSquare size={40} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
          <p style={{ fontWeight: 600 }}>Không tìm thấy nhiệm vụ nào phù hợp.</p>
        </div>
      ) : (
        <div className="table-container card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Tên nhiệm vụ</th>
                <th>Mục tiêu</th>
                <th>Hạn chót</th>
                <th>Ước lượng</th>
                <th>Ưu tiên</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredNhiemVus.map(nv => {
                const mt = mucTieus.find(m => m.id === nv.maMucTieu);
                const isTre = nv.trangThai !== 'HOAN_THANH' && nv.trangThai !== 'DA_HUY' && nv.hanChot < homNay;

                return (
                  <tr key={nv.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{nv.ten}</div>
                      {nv.moTa && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{nv.moTa}</div>}
                      {nv.daGhiDeHanMuc && (
                        <span className="tag tag-yellow" style={{ marginTop: '4px', fontSize: '0.7rem' }}>
                          <AlertTriangle size={10} style={{ marginRight: '2px' }} />
                          Ghi đè hạn mức
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: '#475569' }}>{mt?.ten || '(Mục tiêu đã xoá)'}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isTre ? '#dc2626' : '#1e293b' }}>
                        {nv.hanChot}
                      </div>
                      {isTre && (
                        <span className="tag tag-red" style={{ fontSize: '0.7rem' }}>Trễ hạn</span>
                      )}
                      {nv.ngayHoanThanh && (
                        <div style={{ fontSize: '0.75rem', color: '#059669' }}>Xong: {nv.ngayHoanThanh}</div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>{nv.uocLuongGio} giờ</span>
                    </td>
                    <td>
                      <span className={`tag ${nv.uuTien === 'CAO' ? 'tag-red' : nv.uuTien === 'TRUNG_BINH' ? 'tag-blue' : 'tag-gray'}`}>
                        {nv.uuTien}
                      </span>
                    </td>
                    <td>
                      <span className={`tag ${nv.trangThai === 'HOAN_THANH' ? 'tag-green' : nv.trangThai === 'DANG_LAM' ? 'tag-blue' : nv.trangThai === 'CHUA_LAM' ? 'tag-yellow' : 'tag-gray'}`}>
                        {nv.trangThai}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {nv.trangThai !== 'HOAN_THANH' && nv.trangThai !== 'DA_HUY' && (
                          <>
                            <button
                              className="btn btn-sm btn-success"
                              title="Hoàn thành nhanh (100%)"
                              onClick={() => handleHoanThanhNhanh(nv)}
                            >
                              <CheckCircle2 size={14} />
                            </button>
                            <button
                              className="btn btn-sm btn-primary"
                              title="Cập nhật tiến độ / giờ thực tế"
                              onClick={() => onOpenCapNhatTienDo(nv)}
                            >
                              <Clock size={14} />
                            </button>
                          </>
                        )}
                        <button
                          className="btn btn-sm btn-secondary"
                          title="Sửa"
                          onClick={() => setEditingNV(nv)}
                        >
                          <Edit3 size={14} />
                        </button>
                        {nv.trangThai !== 'DA_HUY' && (
                          <button
                            className="btn btn-sm btn-secondary"
                            title="Hủy nhiệm vụ"
                            onClick={() => handleHuyNhiemVu(nv)}
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-danger"
                          title="Xóa"
                          onClick={() => handleXoaNhiemVu(nv)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Tạo Nhiệm vụ (UC07) */}
      {showTaoModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Tạo nhiệm vụ mới</h3>
              <button className="btn btn-sm btn-secondary" onClick={resetForm}>✕</button>
            </div>

            {loiCoBan && (
              <div className="alert alert-danger">
                <span>{loiCoBan}</span>
              </div>
            )}

            {/* Hộp thoại CẢNH BÁO VƯỢT HẠN MỨC (BR08, BR09) */}
            {danhSachViPhamHanMuc ? (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 700, marginBottom: '8px' }}>
                  <AlertTriangle size={20} />
                  <span>CẢNH BÁO VI PHẠM HẠN MỨC (BR08, BR09)</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#92400e', marginBottom: '10px' }}>
                  Nhiệm vụ bạn dự định tạo vi phạm các giới hạn hạn mức sau:
                </p>
                <ul style={{ paddingLeft: '20px', fontSize: '0.825rem', color: '#b45309', marginBottom: '16px', lineHeight: 1.5 }}>
                  {danhSachViPhamHanMuc.map((vp, i) => (
                    <li key={i}>{vp}</li>
                  ))}
                </ul>
                <p style={{ fontSize: '0.8rem', color: '#78350f', marginBottom: '16px', fontStyle: 'italic' }}>
                  Bạn có muốn ghi đè hạn mức để tiếp tục tạo nhiệm vụ này không? (Nếu đồng ý, nhiệm vụ sẽ được đánh dấu "Đã ghi đè hạn mức" và sinh thông báo nhắc nhở theo quy tắc BR09).
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={handleHuyGhiDe}>
                    Hủy bỏ
                  </button>
                  <button type="button" className="btn btn-primary" style={{ background: '#d97706', borderColor: '#b45309' }} onClick={handleXacNhanGhiDe}>
                    Xác nhận ghi đè hạn mức
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleKiemTraVaTao}>
                <div className="form-group">
                  <label className="form-label">Thuộc mục tiêu *</label>
                  <select
                    className="form-select"
                    value={maMT}
                    onChange={e => setMaMT(e.target.value)}
                    required
                  >
                    {mucTieus.map(mt => (
                      <option key={mt.id} value={mt.id}>
                        {mt.ten} ({mt.ngayBatDau} ~ {mt.ngayKetThuc}) {mt.trangThai === 'HOAN_THANH' || mt.trangThai === 'DA_HUY' ? `[${mt.trangThai}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Tên nhiệm vụ *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VD: Làm bài tập Unit 4"
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
                    placeholder="Chi tiết công việc..."
                    value={moTa}
                    onChange={e => setMoTa(e.target.value)}
                  />
                </div>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Hạn chót *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={hanChot}
                      onChange={e => setHanChot(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ước lượng giờ *</label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      className="form-input"
                      value={uocLuongGio}
                      onChange={e => setUocLuongGio(parseFloat(e.target.value) || 0)}
                      required
                    />
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

                <div className="form-hint" style={{ marginBottom: '16px' }}>
                  * Quy tắc BR04: Hạn chót phải nằm trong khoảng thời gian của mục tiêu, giờ ước lượng {'>'} 0.
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>Hủy</button>
                  <button type="submit" className="btn btn-primary">Tạo nhiệm vụ</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Sửa Nhiệm vụ (UC08) */}
      {editingNV && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Chỉnh sửa nhiệm vụ</h3>
              <button className="btn btn-sm btn-secondary" onClick={() => setEditingNV(null)}>✕</button>
            </div>
            <form onSubmit={handleCapNhatNV}>
              <div className="form-group">
                <label className="form-label">Tên nhiệm vụ *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingNV.ten}
                  onChange={e => setEditingNV({ ...editingNV, ten: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={editingNV.moTa}
                  onChange={e => setEditingNV({ ...editingNV, moTa: e.target.value })}
                />
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Hạn chót *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editingNV.hanChot}
                    onChange={e => setEditingNV({ ...editingNV, hanChot: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ước lượng giờ *</label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    className="form-input"
                    value={editingNV.uocLuongGio}
                    onChange={e => setEditingNV({ ...editingNV, uocLuongGio: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Độ ưu tiên</label>
                  <select
                    className="form-select"
                    value={editingNV.uuTien}
                    onChange={e => setEditingNV({ ...editingNV, uuTien: e.target.value as UuTien })}
                  >
                    <option value="THAP">Thấp</option>
                    <option value="TRUNG_BINH">Trung bình</option>
                    <option value="CAO">Cao</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingNV(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
