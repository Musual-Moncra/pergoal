import React, { useState } from 'react';
import { MucTieu, NhiemVu, BanGhiTienDo, UuTien, TrangThaiNhiemVu } from '../domain/types';
import { NhiemVuController } from '../controller/NhiemVuController';
import { CheckSquare, Plus, AlertTriangle, CheckCircle2, Trash2, XCircle, Edit3, Sliders, History, Calendar, Clock } from 'lucide-react';
import { ngayDiaPhuong } from '../domain/NgayThang';

interface Props {
  tenDangNhap: string;
  mucTieus: MucTieu[];
  nhiemVus: NhiemVu[];
  banGhiTienDos?: BanGhiTienDo[];
  selectedMucTieuId?: string;
  onDataChange: () => void;
}

export const ManHinhNhiemVu: React.FC<Props> = ({
  tenDangNhap,
  mucTieus,
  nhiemVus,
  banGhiTienDos = [],
  selectedMucTieuId,
  onDataChange
}) => {
  const [filterMucTieu, setFilterMucTieu] = useState<string>(selectedMucTieuId || 'ALL');
  const [filterTrangThai, setFilterTrangThai] = useState<string>('ALL');

  // Modal tạo nhiệm vụ
  const [showTaoModal, setShowTaoModal] = useState(false);
  const [maMT, setMaMT] = useState(selectedMucTieuId || (mucTieus[0]?.id || ''));
  const [ten, setTen] = useState('');
  const [moTa, setMoTa] = useState('');
  const [hanChot, setHanChot] = useState(ngayDiaPhuong());
  const [uuTien, setUuTien] = useState<UuTien>('TRUNG_BINH');
  const [uocLuongGio, setUocLuongGio] = useState<number>(2);

  // Cảnh báo tạo nhiệm vụ
  const [loiCoBan, setLoiCoBan] = useState<string | null>(null);
  const [danhSachViPhamNangSuat, setDanhSachViPhamNangSuat] = useState<string[] | null>(null);

  // Modal sửa nhiệm vụ
  const [editingNV, setEditingNV] = useState<NhiemVu | null>(null);

  // Modal cập nhật tiến độ in-place
  const [progressNV, setProgressNV] = useState<NhiemVu | null>(null);
  const [progressValue, setProgressValue] = useState<number>(0);
  const [progressHours, setProgressHours] = useState<number>(0);
  const [progressNote, setProgressNote] = useState<string>('');
  const [progressError, setProgressError] = useState<string | null>(null);

  const homNay = ngayDiaPhuong();

  const handleKiemTraVaTao = (e: React.FormEvent) => {
    e.preventDefault();
    setLoiCoBan(null);
    setDanhSachViPhamNangSuat(null);

    const res = NhiemVuController.taoNhiemVu(
      tenDangNhap,
      maMT,
      ten,
      moTa,
      hanChot,
      uuTien,
      Number(uocLuongGio)
    );

    if (res.success) {
      resetTaoForm();
      onDataChange();
    } else {
      if (res.canhBaoVuotMuc && res.canhBaoVuotMuc.length > 0) {
        setDanhSachViPhamNangSuat(res.canhBaoVuotMuc);
      } else {
        setLoiCoBan(res.message);
      }
    }
  };

  // Xác nhận vượt mức năng suất khi tạo
  const handleXacNhanTaoVuotMuc = () => {
    const res = NhiemVuController.xacNhanVuotMuc(tenDangNhap, true);
    if (res.success) {
      resetTaoForm();
      onDataChange();
    } else {
      setLoiCoBan(res.message);
    }
  };

  const handleHuyTaoVuotMuc = () => {
    NhiemVuController.xacNhanVuotMuc(tenDangNhap, false);
    setDanhSachViPhamNangSuat(null);
  };

  const resetTaoForm = () => {
    setShowTaoModal(false);
    setDanhSachViPhamNangSuat(null);
    setLoiCoBan(null);
    setTen('');
    setMoTa('');
    setUocLuongGio(2);
  };

  // Hoàn thành một chạm (100%)
  const handleHoanThanhNhanh = (nv: NhiemVu) => {
    const res = NhiemVuController.capNhatTienDo(tenDangNhap, nv.id, 100);
    if (res.success) {
      onDataChange();
    } else {
      alert(res.message);
    }
  };

  // Mở modal cập nhật tiến độ
  const handleOpenProgressModal = (nv: NhiemVu) => {
    setProgressNV(nv);
    setProgressValue(nv.phanTram); // Thanh kéo bắt đầu từ % hiện tại
    setProgressHours(0);
    setProgressNote('');
    setProgressError(null);
  };

  // Lưu tiến độ từ modal
  const handleSaveProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressNV) return;

    const res = NhiemVuController.capNhatTienDo(
      tenDangNhap,
      progressNV.id,
      Number(progressValue),
      Number(progressHours),
      progressNote
    );

    if (res.success) {
      setProgressNV(null);
      onDataChange();
    } else {
      setProgressError(res.message);
    }
  };

  // Sửa nhiệm vụ
  const handleCapNhatNV = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNV) return;

    const thongTinMoi = {
      ten: editingNV.ten,
      moTa: editingNV.moTa,
      hanChot: editingNV.hanChot,
      uuTien: editingNV.uuTien,
      uocLuongGio: Number(editingNV.uocLuongGio)
    };

    let res = NhiemVuController.capNhatNhiemVu(tenDangNhap, editingNV.id, thongTinMoi);

    if (!res.success && res.canhBaoVuotMuc && res.canhBaoVuotMuc.length > 0) {
      const dongY = confirm(
        'Thay đổi này vượt mức năng suất của mục tiêu:\n- ' +
          res.canhBaoVuotMuc.join('\n- ') +
          '\n\nBạn có muốn xác nhận và lưu tiếp tục không?'
      );
      if (!dongY) return;
      res = NhiemVuController.capNhatNhiemVu(tenDangNhap, editingNV.id, { ...thongTinMoi }, true);
    }

    if (res.success) {
      setEditingNV(null);
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
    if (confirm(`Xóa hoàn toàn nhiệm vụ "${nv.ten}" cùng lịch sử tiến độ liên quan?`)) {
      NhiemVuController.xoaNhiemVu(tenDangNhap, nv.id);
      onDataChange();
    }
  };

  const filteredNhiemVus = nhiemVus.filter(nv => {
    if (filterMucTieu !== 'ALL' && nv.maMucTieu !== filterMucTieu) return false;
    if (filterTrangThai !== 'ALL') {
      if (filterTrangThai === 'TRE') {
        return nv.trangThai !== 'HOAN_THANH' && nv.trangThai !== 'DA_HUY' && nv.hanChot < homNay;
      }
      return nv.trangThai === filterTrangThai;
    }
    return true;
  });

  const getTrangThaiText = (trangThai: TrangThaiNhiemVu, isTre: boolean) => {
    if (trangThai === 'DA_HUY') return 'Đã hủy';
    if (trangThai === 'HOAN_THANH') return 'Hoàn thành';
    if (isTre) return 'Đang trễ hạn';
    if (trangThai === 'DANG_LAM') return 'Đang làm';
    return 'Chưa làm';
  };

  const getTrangThaiBadgeClass = (trangThai: TrangThaiNhiemVu, isTre: boolean) => {
    if (trangThai === 'HOAN_THANH') return 'badge-success';
    if (trangThai === 'DA_HUY') return 'badge-secondary';
    if (isTre) return 'badge-danger';
    if (trangThai === 'DANG_LAM') return 'badge-primary';
    return 'badge-warning';
  };

  const getUuTienText = (uuTien: UuTien) => {
    if (uuTien === 'CAO') return 'Cao';
    if (uuTien === 'TRUNG_BINH') return 'Trung bình';
    return 'Thấp';
  };

  // Mục tiêu khả dụng để tạo nhiệm vụ (chưa hoàn thành và chưa hủy)
  const mucTieuKhaDung = mucTieus.filter(mt => mt.trangThai !== 'HOAN_THANH' && mt.trangThai !== 'DA_HUY');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare size={24} color="#2563eb" />
            <span>Danh sách Nhiệm vụ ({filteredNhiemVus.length})</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Theo dõi đầu việc, cập nhật tiến độ trực tiếp và kiểm soát mức năng suất</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (mucTieuKhaDung.length === 0) {
              alert('Không có mục tiêu nào đang thực hiện để thêm nhiệm vụ mới.');
              return;
            }
            setMaMT(selectedMucTieuId || mucTieuKhaDung[0].id);
            setLoiCoBan(null);
            setDanhSachViPhamNangSuat(null);
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
          <table className="bang-nhiem-vu">
            <thead>
              <tr>
                <th style={{ minWidth: '180px' }}>Tên nhiệm vụ</th>
                <th>Mục tiêu</th>
                <th>Hạn chót</th>
                <th>Ước lượng</th>
                <th>Ưu tiên</th>
                <th style={{ minWidth: '150px' }}>Tiến độ</th>
                <th>Trạng thái</th>
                <th style={{ minWidth: '160px', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredNhiemVus.map(nv => {
                const mt = mucTieus.find(m => m.id === nv.maMucTieu);
                const isTre = nv.trangThai !== 'HOAN_THANH' && nv.trangThai !== 'DA_HUY' && nv.hanChot < homNay;
                const isCompleted = nv.trangThai === 'HOAN_THANH';
                const isCancelled = nv.trangThai === 'DA_HUY';

                return (
                  <tr key={nv.id} style={{ opacity: isCancelled ? 0.6 : 1 }}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{nv.ten}</div>
                      {nv.moTa && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{nv.moTa}</div>}
                      {nv.daVuotMucNangSuat && (
                        <span
                          className="badge"
                          style={{
                            background: '#fef3c7',
                            color: '#b45309',
                            border: '1px solid #fde68a',
                            fontSize: '0.72rem',
                            marginTop: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          ⚡ Vượt mức
                        </span>
                      )}
                    </td>

                    <td>
                      <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 500 }}>
                        {mt ? mt.ten : '—'}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                        <Calendar size={14} color="#64748b" />
                        <span style={{ color: isTre ? '#dc2626' : '#334155', fontWeight: isTre ? 600 : 400 }}>
                          {nv.hanChot}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                        <Clock size={14} color="#64748b" />
                        <span>{nv.uocLuongGio}h</span>
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${nv.uuTien === 'CAO' ? 'badge-danger' : nv.uuTien === 'TRUNG_BINH' ? 'badge-primary' : 'badge-secondary'}`}>
                        {getUuTienText(nv.uuTien)}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="progress-bar-container" style={{ flex: 1, minWidth: '70px', height: '8px' }}>
                          <div
                            className={`progress-bar-fill ${isCompleted ? 'success' : ''}`}
                            style={{ width: `${nv.phanTram}%` }}
                          />
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, minWidth: '35px', textAlign: 'right' }}>
                          {nv.phanTram}%
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${getTrangThaiBadgeClass(nv.trangThai, isTre)}`}>
                        {getTrangThaiText(nv.trangThai, isTre)}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {/* Nút cập nhật tiến độ mở modal tại chỗ */}
                        {!isCancelled && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleOpenProgressModal(nv)}
                            title="Cập nhật tiến độ nhiệm vụ này"
                          >
                            <Sliders size={13} />
                            <span>Tiến độ</span>
                          </button>
                        )}

                        {/* Nút một chạm hoàn thành */}
                        {!isCancelled && !isCompleted && (
                          <button
                            className="btn btn-success"
                            style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleHoanThanhNhanh(nv)}
                            title="Đánh dấu hoàn thành ngay (100%)"
                          >
                            <CheckCircle2 size={13} />
                            <span>Xong</span>
                          </button>
                        )}

                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                          onClick={() => setEditingNV({ ...nv })}
                          title="Sửa thông tin nhiệm vụ"
                        >
                          <Edit3 size={13} />
                        </button>

                        {!isCancelled && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.8rem', color: '#b45309' }}
                            onClick={() => handleHuyNhiemVu(nv)}
                            title="Hủy nhiệm vụ"
                          >
                            <XCircle size={13} />
                          </button>
                        )}

                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.8rem', color: '#dc2626' }}
                          onClick={() => handleXoaNhiemVu(nv)}
                          title="Xóa nhiệm vụ"
                        >
                          <Trash2 size={13} />
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

      {/* Modal Cập nhật tiến độ tại chỗ */}
      {progressNV && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={20} color="#2563eb" />
                  <span>Cập nhật tiến độ</span>
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                  Nhiệm vụ: <strong>{progressNV.ten}</strong>
                </p>
              </div>
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 8px', border: 'none', background: 'transparent' }}
                onClick={() => setProgressNV(null)}
              >
                ✕
              </button>
            </div>

            {progressError && (
              <div className="alert alert-danger" style={{ marginBottom: '14px', fontSize: '0.85rem' }}>
                {progressError}
              </div>
            )}

            <form onSubmit={handleSaveProgress}>
              {/* Thanh kéo tiến độ (bắt đầu từ % hiện tại) */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Mức tiến độ hoàn thành:</label>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2563eb' }}>
                    {progressValue}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={progressValue}
                  onChange={e => setProgressValue(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />

                {/* Các nút chọn nhanh */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  {[0, 25, 50, 75, 100].map(val => (
                    <button
                      key={val}
                      type="button"
                      className={`btn ${progressValue === val ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, padding: '4px 0', fontSize: '0.8rem' }}
                      onClick={() => setProgressValue(val)}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '6px' }}>
                  * Lưu ý: Đưa về 100% đánh dấu hoàn thành; hạ tiến độ dưới 100% sẽ mở lại nhiệm vụ.
                </span>
              </div>

              {/* Số giờ thực tế */}
              <div className="form-group">
                <label className="form-label">Số giờ thực tế làm việc (lần này):</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  step="any"
                  value={progressHours}
                  onChange={e => setProgressHours(Number(e.target.value))}
                  placeholder="Ví dụ: 1.5"
                />
              </div>

              {/* Ghi chú */}
              <div className="form-group">
                <label className="form-label">Ghi chú tiến độ:</label>
                <input
                  type="text"
                  className="form-input"
                  value={progressNote}
                  onChange={e => setProgressNote(e.target.value)}
                  placeholder="Ghi chú nội dung đã hoàn thành..."
                />
              </div>

              {/* Lịch sử cập nhật của chính nhiệm vụ này */}
              <div style={{ marginTop: '16px', marginBottom: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', marginBottom: '8px' }}>
                  <History size={15} />
                  <span>Lịch sử cập nhật của nhiệm vụ này</span>
                </h4>
                {(() => {
                  const lichSu = banGhiTienDos
                    .filter(bg => bg.maNhiemVu === progressNV.id)
                    .sort((a, b) => (b.ngayGhi > a.ngayGhi ? 1 : b.ngayGhi < a.ngayGhi ? -1 : 0));

                  if (lichSu.length === 0) {
                    return (
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                        Chưa có lượt cập nhật nào trước đây.
                      </p>
                    );
                  }

                  return (
                    <div style={{ maxHeight: '130px', overflowY: 'auto', fontSize: '0.8rem', background: '#f8fafc', borderRadius: '6px', padding: '6px 10px', border: '1px solid #e2e8f0' }}>
                      {lichSu.map(bg => (
                        <div key={bg.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #e2e8f0' }}>
                          <div>
                            <span style={{ fontWeight: 600, color: '#334155' }}>{bg.ngayGhi}:</span>{' '}
                            <span>{bg.phanTram}%</span>
                            {bg.soGioThucTe > 0 && <span style={{ color: '#64748b' }}> (+{bg.soGioThucTe}h)</span>}
                            {bg.ghiChu && <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{bg.ghiChu}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setProgressNV(null)}
                >
                  Đóng
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu tiến độ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tạo nhiệm vụ */}
      {showTaoModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Tạo nhiệm vụ mới</h3>

            {loiCoBan && (
              <div className="alert alert-danger" style={{ marginBottom: '14px', fontSize: '0.85rem' }}>
                {loiCoBan}
              </div>
            )}

            {/* Cảnh báo vượt mức năng suất */}
            {danhSachViPhamNangSuat && (
              <div className="alert alert-warning" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '6px' }}>
                  <AlertTriangle size={18} color="#b45309" />
                  <span>Cảnh báo vượt mức năng suất!</span>
                </div>
                <p style={{ fontSize: '0.85rem', marginBottom: '8px' }}>
                  Nhiệm vụ này sẽ làm vượt mức năng suất cam kết của mục tiêu:
                </p>
                <ul style={{ margin: '0 0 12px 18px', fontSize: '0.82rem', lineHeight: 1.4 }}>
                  {danhSachViPhamNangSuat.map((vp, idx) => (
                    <li key={idx}>{vp}</li>
                  ))}
                </ul>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={handleHuyTaoVuotMuc}>
                    Hủy bỏ
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleXacNhanTaoVuotMuc}>
                    Xác nhận tạo (Chấp nhận vượt mức)
                  </button>
                </div>
              </div>
            )}

            {!danhSachViPhamNangSuat && (
              <form onSubmit={handleKiemTraVaTao}>
                <div className="form-group">
                  <label className="form-label">Thuộc mục tiêu *</label>
                  <select
                    className="form-select"
                    value={maMT}
                    onChange={e => setMaMT(e.target.value)}
                    required
                  >
                    {mucTieuKhaDung.map(mt => (
                      <option key={mt.id} value={mt.id}>
                        {mt.ten} (từ {mt.ngayBatDau} đến {mt.ngayKetThuc})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Tên nhiệm vụ *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={ten}
                    onChange={e => setTen(e.target.value)}
                    placeholder="Ví dụ: Đọc tài liệu chương 1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mô tả</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={moTa}
                    onChange={e => setMoTa(e.target.value)}
                    placeholder="Mô tả chi tiết nội dung cần làm..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                    <label className="form-label">Ước lượng (giờ) *</label>
                    <input
                      type="number"
                      className="form-input"
                      min="0.1"
                      step="any"
                      value={uocLuongGio}
                      onChange={e => setUocLuongGio(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Mức ưu tiên</label>
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

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                  <button type="button" className="btn btn-secondary" onClick={resetTaoForm}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Tạo nhiệm vụ
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Sửa nhiệm vụ */}
      {editingNV && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Sửa nhiệm vụ</h3>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                  <label className="form-label">Ước lượng (giờ) *</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0.1"
                    step="any"
                    value={editingNV.uocLuongGio}
                    onChange={e => setEditingNV({ ...editingNV, uocLuongGio: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mức ưu tiên</label>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingNV(null)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
