import React, { useState, useEffect } from 'react';
import { MucTieu } from '../domain/types';
import { BaoCaoController } from '../controller/BaoCaoController';
import { ngayDiaPhuong } from '../domain/NgayThang';
import { BarChart3, Calendar, CheckCircle2, AlertOctagon, Flame, Percent, Target } from 'lucide-react';

interface Props {
  tenDangNhap: string;
  mucTieus: MucTieu[];
}

export const ManHinhHieuSuat: React.FC<Props> = ({ tenDangNhap, mucTieus }) => {
  // Khoảng thời gian mặc định: đầu tháng đến cuối tháng hiện tại
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [tuNgay, setTuNgay] = useState<string>(ngayDiaPhuong(firstDay));
  const [denNgay, setDenNgay] = useState<string>(ngayDiaPhuong(lastDay));
  const [selectedMT, setSelectedMT] = useState<string>('ALL');

  const [baoCao, setBaoCao] = useState<any>(null);
  const [tienDoMucTieuList, setTienDoMucTieuList] = useState<any[]>([]);

  const khoangNgayHopLe = tuNgay <= denNgay;

  useEffect(() => {
    // Khoảng ngày sai thì giữ nguyên số liệu của lần xem hợp lệ trước đó
    if (!khoangNgayHopLe) return;
    const maMT = selectedMT === 'ALL' ? null : selectedMT;
    const res = BaoCaoController.xemBaoCaoHieuSuat(tenDangNhap, tuNgay, denNgay, maMT);
    setBaoCao(res.baoCao);
    setTienDoMucTieuList(res.tienDoMucTieuList);
  }, [tenDangNhap, tuNgay, denNgay, selectedMT, khoangNgayHopLe]);

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={24} color="#2563eb" />
          <span>Báo cáo Hiệu suất</span>
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
          Tổng hợp kết quả thực hiện, tỷ lệ đúng hạn và chuỗi ngày rèn luyện liên tục
        </p>
      </div>

      {/* Bộ lọc khoảng ngày và mục tiêu */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} /> Từ ngày:
            </label>
            <input
              type="date"
              className="form-input"
              value={tuNgay}
              onChange={e => setTuNgay(e.target.value)}
              style={{ width: 'auto' }}
            />
          </div>

          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} /> Đến ngày:
            </label>
            <input
              type="date"
              className="form-input"
              value={denNgay}
              onChange={e => setDenNgay(e.target.value)}
              style={{ width: 'auto' }}
            />
          </div>

          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Target size={14} /> Lọc theo mục tiêu:
            </label>
            <select
              className="form-select"
              value={selectedMT}
              onChange={e => setSelectedMT(e.target.value)}
              style={{ width: 'auto', minWidth: '180px' }}
            >
              <option value="ALL">Tất cả mục tiêu ({mucTieus.length})</option>
              {mucTieus.map(mt => (
                <option key={mt.id} value={mt.id}>{mt.ten}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!khoangNgayHopLe && (
        <div className="alert alert-danger">
          <span>Từ ngày không được lớn hơn Đến ngày. Vui lòng chọn lại khoảng thời gian.</span>
        </div>
      )}

      {/* 4 chỉ số hiệu suất dạng thẻ số (KPI cards, không biểu đồ) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* 1. Tỷ lệ đúng hạn */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>TỶ LỆ ĐÚNG HẠN</span>
            <CheckCircle2 size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, color: '#0f172a' }}>
            {baoCao && baoCao.tiLeDungHan !== null ? `${baoCao.tiLeDungHan.toFixed(1)}%` : '—'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
            {baoCao ? `${baoCao.soDungHan} nhiệm vụ đúng hạn` : ''}
          </div>
        </div>

        {/* 2. Số nhiệm vụ trễ */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>SỐ NHIỆM VỤ TRỄ</span>
            <AlertOctagon size={20} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, color: '#ef4444' }}>
            {baoCao ? baoCao.soNhiemVuTre : 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
            Đã hoàn thành muộn hoặc quá hạn
          </div>
        </div>

        {/* 3. Chuỗi ngày liên tục */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>CHUỖI NGÀY LIÊN TỤC</span>
            <Flame size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, color: '#0f172a' }}>
            {baoCao ? `${baoCao.chuoiNgayLienTuc} ngày` : '0 ngày'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
            Số ngày liên tiếp có cập nhật tiến độ
          </div>
        </div>

        {/* 4. Tiến độ trung bình */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #2563eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>TIẾN ĐỘ TRUNG BÌNH</span>
            <Percent size={20} color="#2563eb" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, color: '#2563eb' }}>
            {baoCao && baoCao.tienDoTrungBinh !== null ? `${baoCao.tienDoTrungBinh.toFixed(1)}%` : '—'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
            Trung bình cộng các nhiệm vụ trong kỳ
          </div>
        </div>
      </div>

      {/* Bảng tổng hợp tiến độ các Mục tiêu */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={18} color="#2563eb" />
          <span>Tiến độ tổng quát theo Mục tiêu</span>
        </h3>

        {tienDoMucTieuList.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>Chưa có mục tiêu nào được tạo.</p>
        ) : (
          <div className="table-container" style={{ margin: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Tên mục tiêu</th>
                  <th>Mức năng suất cam kết</th>
                  <th style={{ minWidth: '200px' }}>Tiến độ trung bình</th>
                </tr>
              </thead>
              <tbody>
                {tienDoMucTieuList.map(mt => (
                  <tr key={mt.id}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{mt.ten}</td>
                    <td>
                      <span style={{ color: '#b45309', fontWeight: 600 }}>
                        {'⚡'.repeat(mt.capDo)} (Mức {mt.capDo})
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="progress-bar-container" style={{ flex: 1, height: '8px' }}>
                          <div
                            className={`progress-bar-fill ${mt.tienDo === 100 ? 'success' : ''}`}
                            style={{ width: `${mt.tienDo}%` }}
                          />
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, minWidth: '40px', textAlign: 'right' }}>
                          {mt.tienDo}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
