import React, { useState } from 'react';
import { MucTieu, HanMuc, LoaiHanMuc } from '../domain/types';
import { HanMucController } from '../controller/HanMucController';
import { Sliders, Plus, Trash2, AlertCircle, Info, Calendar, Clock, Activity } from 'lucide-react';

interface Props {
  tenDangNhap: string;
  mucTieus: MucTieu[];
  hanMucs: HanMuc[];
  selectedMucTieuId?: string;
  onDataChange: () => void;
}

export const ManHinhHanMuc: React.FC<Props> = ({
  tenDangNhap,
  mucTieus,
  hanMucs,
  selectedMucTieuId,
  onDataChange
}) => {
  const [filterMucTieu, setFilterMucTieu] = useState<string>(selectedMucTieuId || (mucTieus[0]?.id || 'ALL'));
  const [showModal, setShowModal] = useState(false);

  // Form thiết lập
  const [maMT, setMaMT] = useState(selectedMucTieuId || (mucTieus[0]?.id || ''));
  const [loai, setLoai] = useState<LoaiHanMuc>('DEADLINE');
  const [giaTri, setGiaTri] = useState<string>('');
  const [donVi, setDonVi] = useState<string>('');

  const [thongBaoLoi, setThongBaoLoi] = useState<string | null>(null);
  const [canhBaoHienCo, setCanhBaoHienCo] = useState<string[] | null>(null);

  const selectedGoal = mucTieus.find(m => m.id === maMT);

  const handleThietLap = (e: React.FormEvent) => {
    e.preventDefault();
    setThongBaoLoi(null);
    setCanhBaoHienCo(null);

    const res = HanMucController.thietLapHanMuc(
      tenDangNhap,
      maMT,
      loai,
      giaTri,
      donVi
    );

    if (res.success) {
      if (res.viPhamHienCo && res.viPhamHienCo.length > 0) {
        setCanhBaoHienCo(res.viPhamHienCo);
      } else {
        setShowModal(false);
        resetForm();
      }
      onDataChange();
    } else {
      setThongBaoLoi(res.message);
    }
  };

  const resetForm = () => {
    setGiaTri('');
    setDonVi('');
    setThongBaoLoi(null);
    setCanhBaoHienCo(null);
  };

  const handleXoa = (hm: HanMuc) => {
    if (confirm(`Xóa hạn mức ${hm.loai}?`)) {
      HanMucController.xoaHanMuc(tenDangNhap, hm.id);
      onDataChange();
    }
  };

  const filteredHanMucs = hanMucs.filter(hm => {
    if (filterMucTieu === 'ALL') return true;
    return hm.maMucTieu === filterMucTieu;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={24} color="#2563eb" />
            <span>Thiết lập Hạn mức ({filteredHanMucs.length})</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Quản lý trần tải công việc, hạn chót tổng và các chỉ tiêu định lượng hàng tuần</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (mucTieus.length === 0) {
              alert('Vui lòng tạo ít nhất một Mục tiêu trước khi thiết lập Hạn mức!');
              return;
            }
            setMaMT(selectedMucTieuId || mucTieus[0].id);
            resetForm();
            setShowModal(true);
          }}
        >
          <Plus size={16} />
          <span>Thêm hạn mức</span>
        </button>
      </div>

      {/* Lọc theo mục tiêu */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Lọc theo mục tiêu:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
            value={filterMucTieu}
            onChange={e => setFilterMucTieu(e.target.value)}
          >
            <option value="ALL">Tất cả mục tiêu ({mucTieus.length})</option>
            {mucTieus.map(mt => (
              <option key={mt.id} value={mt.id}>{mt.ten}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Danh sách hạn mức */}
      {filteredHanMucs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
          <Sliders size={40} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
          <p style={{ fontWeight: 600 }}>Chưa có hạn mức nào được thiết lập cho mục tiêu này.</p>
          <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Bấm "Thêm hạn mức" để đặt hạn ngạch kiểm soát (DEADLINE, NV tối đa/ngày, Giờ tối đa/tuần...).</p>
        </div>
      ) : (
        <div className="grid-2">
          {filteredHanMucs.map(hm => {
            const mt = mucTieus.find(m => m.id === hm.maMucTieu);
            return (
              <div key={hm.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="tag tag-blue" style={{ fontWeight: 700 }}>
                      {hm.loai}
                    </span>
                    <button className="btn btn-sm btn-danger" onClick={() => handleXoa(hm)}>
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>
                    Mục tiêu: <strong>{mt?.ten || '(Mục tiêu đã xoá)'}</strong>
                  </div>

                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', margin: '8px 0' }}>
                    {hm.giaTri} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>{hm.donVi}</span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Ngày hiệu lực: {hm.ngayHieuLuc}
                  </div>
                </div>

                <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border)', fontSize: '0.75rem', color: '#64748b' }}>
                  {hm.loai === 'DEADLINE' && 'Hạn chót tổng: Nhiệm vụ có hạn sau ngày này sẽ bị cảnh báo.'}
                  {hm.loai === 'NV_TOI_DA_NGAY' && 'Giới hạn số nhiệm vụ tối đa được giao hoàn thành trong cùng 1 ngày.'}
                  {hm.loai === 'GIO_TOI_DA_TUAN' && 'Khống chế tổng giờ làm việc trong tuần (Thứ 2 đến Chủ nhật).'}
                  {hm.loai === 'CHI_TIEU_DINH_LUONG' && 'Chỉ tiêu tuần đo lường định lượng (tính vào Báo cáo hiệu suất).'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Thêm hạn mức (UC09) */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Thiết lập hạn mức</h3>
              <button className="btn btn-sm btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>✕</button>
            </div>

            {thongBaoLoi && (
              <div className="alert alert-danger">
                <AlertCircle size={18} />
                <span>{thongBaoLoi}</span>
              </div>
            )}

            {/* Thông báo rà soát BR10 */}
            {canhBaoHienCo && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1d4ed8', fontWeight: 700, marginBottom: '8px' }}>
                  <Info size={18} />
                  <span>RÀ SOÁT NHIỆM VỤ HIỆN CÓ (BR10 - KHÔNG HỒI TỐ)</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#1e40af', marginBottom: '8px' }}>
                  Hạn mức đã được thiết lập thành công. Tuy nhiên, hệ thống phát hiện các nhiệm vụ hiện có đã vượt hạn mức mới này:
                </p>
                <ul style={{ paddingLeft: '20px', fontSize: '0.825rem', color: '#1e3a8a', lineHeight: 1.5, marginBottom: '12px' }}>
                  {canhBaoHienCo.map((vp, idx) => (
                    <li key={idx}>{vp}</li>
                  ))}
                </ul>
                <p style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', marginBottom: '12px' }}>
                  Theo quy tắc BR10, các nhiệm vụ này vẫn được giữ nguyên trạng, không bị chỉnh sửa hay xóa bỏ.
                </p>
                <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setShowModal(false); resetForm(); }}>
                  Đã hiểu và Đóng
                </button>
              </div>
            )}

            {!canhBaoHienCo && (
              <form onSubmit={handleThietLap}>
                <div className="form-group">
                  <label className="form-label">Chọn mục tiêu áp dụng *</label>
                  <select
                    className="form-select"
                    value={maMT}
                    onChange={e => setMaMT(e.target.value)}
                    required
                  >
                    {mucTieus.map(mt => (
                      <option key={mt.id} value={mt.id}>{mt.ten} [{mt.ngayBatDau} ~ {mt.ngayKetThuc}]</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Loại hạn mức *</label>
                  <select
                    className="form-select"
                    value={loai}
                    onChange={e => {
                      const newLoai = e.target.value as LoaiHanMuc;
                      setLoai(newLoai);
                      setGiaTri('');
                      if (newLoai === 'NV_TOI_DA_NGAY') setDonVi('nhiệm vụ/ngày');
                      else if (newLoai === 'GIO_TOI_DA_TUAN') setDonVi('giờ/tuần');
                      else if (newLoai === 'DEADLINE') setDonVi('ngày');
                      else setDonVi('km/tuần');
                    }}
                  >
                    <option value="DEADLINE">Hạn chót tổng (DEADLINE)</option>
                    <option value="NV_TOI_DA_NGAY">Nhiệm vụ tối đa / ngày (NV_TOI_DA_NGAY)</option>
                    <option value="GIO_TOI_DA_TUAN">Giờ tối đa / tuần (GIO_TOI_DA_TUAN)</option>
                    <option value="CHI_TIEU_DINH_LUONG">Chỉ tiêu định lượng (CHI_TIEU_DINH_LUONG)</option>
                  </select>
                </div>

                {loai === 'DEADLINE' ? (
                  <div className="form-group">
                    <label className="form-label">Ngày hạn chót tổng *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={giaTri}
                      min={selectedGoal?.ngayBatDau}
                      max={selectedGoal?.ngayKetThuc}
                      onChange={e => setGiaTri(e.target.value)}
                      required
                    />
                    <div className="form-hint">
                      Phải nằm trong khoảng [{selectedGoal?.ngayBatDau} đến {selectedGoal?.ngayKetThuc}] của mục tiêu (BR07).
                    </div>
                  </div>
                ) : loai === 'NV_TOI_DA_NGAY' ? (
                  <div className="form-group">
                    <label className="form-label">Số nhiệm vụ tối đa trong 1 ngày (số nguyên {'>'} 0) *</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="form-input"
                      placeholder="VD: 3"
                      value={giaTri}
                      onChange={e => setGiaTri(e.target.value)}
                      required
                    />
                  </div>
                ) : loai === 'GIO_TOI_DA_TUAN' ? (
                  <div className="form-group">
                    <label className="form-label">Tổng số giờ tối đa trong 1 tuần (số thực {'>'} 0) *</label>
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      className="form-input"
                      placeholder="VD: 20"
                      value={giaTri}
                      onChange={e => setGiaTri(e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Mục tiêu định lượng ({'>'} 0) *</label>
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        className="form-input"
                        placeholder="VD: 30"
                        value={giaTri}
                        onChange={e => setGiaTri(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Đơn vị đo *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="VD: km/tuần, bài/tuần"
                        value={donVi}
                        onChange={e => setDonVi(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="form-hint" style={{ marginBottom: '16px' }}>
                  * BR06: Mỗi mục tiêu có tối đa 1 hạn mức cho DEADLINE, NV tối đa/ngày, Giờ tối đa/tuần (thiết lập lại sẽ thay thế hạn mức cũ).
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>Hủy</button>
                  <button type="submit" className="btn btn-primary">Lưu hạn mức</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
