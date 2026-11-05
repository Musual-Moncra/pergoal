import React, { useState } from 'react';
import { MucTieu } from '../domain/types';
import { BaoCaoController } from '../controller/BaoCaoController';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { BarChart3, TrendingUp, CheckCircle, AlertOctagon, Flame, Target } from 'lucide-react';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface Props {
  tenDangNhap: string;
  mucTieus: MucTieu[];
}

export const ManHinhBaoCao: React.FC<Props> = ({ tenDangNhap, mucTieus }) => {
  const homNay = new Date().toISOString().split('T')[0];

  // Mặc định khoảng thời gian: 30 ngày qua đến 30 ngày tới
  const tinhMocMacDinh = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const tu = d.toISOString().split('T')[0];
    const d2 = new Date();
    d2.setDate(d2.getDate() + 30);
    const den = d2.toISOString().split('T')[0];
    return { tu, den };
  };

  const moc = tinhMocMacDinh();
  const [tuNgay, setTuNgay] = useState<string>(moc.tu);
  const [denNgay, setDenNgay] = useState<string>(moc.den);
  const [maMucTieu, setMaMucTieu] = useState<string>('ALL');

  const { baoCao, tienDoMucTieuList } = BaoCaoController.xemBaoCaoHieuSuat(
    tenDangNhap,
    tuNgay,
    denNgay,
    maMucTieu === 'ALL' ? undefined : maMucTieu
  );

  // Biểu đồ tròn: Đúng hạn vs Trễ hạn
  const donutData = {
    labels: ['Hoàn thành đúng hạn', 'Nhiệm vụ trễ hạn'],
    datasets: [
      {
        data: [baoCao.soDungHan, baoCao.soNhiemVuTre],
        backgroundColor: ['#10b981', '#ef4444'],
        hoverBackgroundColor: ['#059669', '#dc2626'],
        borderWidth: 1
      }
    ]
  };

  // Biểu đồ cột: Tiến độ các mục tiêu
  const barData = {
    labels: tienDoMucTieuList.map(mt => mt.ten.length > 20 ? mt.ten.substring(0, 18) + '...' : mt.ten),
    datasets: [
      {
        label: 'Tiến độ hoàn thành (%)',
        data: tienDoMucTieuList.map(mt => mt.tienDo),
        backgroundColor: '#2563eb',
        borderRadius: 6
      }
    ]
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={24} color="#2563eb" />
            <span>Báo cáo Hiệu suất & Đo lường (UC11)</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Tổng hợp tỷ lệ đúng hạn, chuỗi ngày liên tục và tỷ lệ đạt chỉ tiêu định lượng (Công thức mục 5)
          </p>
        </div>
      </div>

      {/* Bộ lọc thời gian và mục tiêu */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, minWidth: '150px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Từ ngày (Hạn chót)</label>
            <input
              type="date"
              className="form-input"
              value={tuNgay}
              onChange={e => setTuNgay(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0, minWidth: '150px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Đến ngày (Hạn chót)</label>
            <input
              type="date"
              className="form-input"
              value={denNgay}
              onChange={e => setDenNgay(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0, minWidth: '180px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Lọc theo mục tiêu</label>
            <select
              className="form-select"
              value={maMucTieu}
              onChange={e => setMaMucTieu(e.target.value)}
            >
              <option value="ALL">Tất cả mục tiêu ({mucTieus.length})</option>
              {mucTieus.map(mt => (
                <option key={mt.id} value={mt.id}>{mt.ten}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4 Chỉ số KPI cốt lõi */}
      <div className="grid-4" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-title">Tỷ lệ đúng hạn</span>
            <CheckCircle size={20} color="#10b981" />
          </div>
          <div className="stat-value" style={{ color: baoCao.tiLeDungHan === null ? '#64748b' : '#10b981' }}>
            {baoCao.tiLeDungHan === null ? '—' : `${baoCao.tiLeDungHan}%`}
          </div>
          <div className="stat-sub">
            {baoCao.soDungHan} đúng hạn / {baoCao.soNhiemVuTre} trễ hạn
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-title">Nhiệm vụ trễ hạn</span>
            <AlertOctagon size={20} color="#ef4444" />
          </div>
          <div className="stat-value" style={{ color: '#ef4444' }}>
            {baoCao.soNhiemVuTre}
          </div>
          <div className="stat-sub">Đã xong trễ + Quá hạn chưa làm</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-title">Chuỗi ngày liên tục</span>
            <Flame size={20} color="#f59e0b" />
          </div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>
            {baoCao.chuoiNgayLienTuc} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>ngày</span>
          </div>
          <div className="stat-sub">Streak hoạt động (lùi từ hôm nay)</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-title">Đạt chỉ tiêu tuần</span>
            <Target size={20} color="#2563eb" />
          </div>
          <div className="stat-value" style={{ color: baoCao.phanTramDatChiTieu === null ? '#64748b' : '#2563eb' }}>
            {baoCao.phanTramDatChiTieu === null ? '—' : `${baoCao.phanTramDatChiTieu}%`}
          </div>
          <div className="stat-sub">Trung bình các hạn mức định lượng</div>
        </div>
      </div>

      {/* Biểu đồ trực quan */}
      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">Phân bổ Đúng hạn vs Trễ hạn</h3>
          {baoCao.soDungHan === 0 && baoCao.soNhiemVuTre === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
              Chưa có dữ liệu nhiệm vụ đã xong hoặc quá hạn trong khoảng thời gian này.
            </div>
          ) : (
            <div style={{ maxHeight: '260px', display: 'flex', justifyContent: 'center' }}>
              <Doughnut
                data={donutData}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">Tiến độ từng Mục tiêu (%)</h3>
          {tienDoMucTieuList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
              Chưa có mục tiêu nào được tạo.
            </div>
          ) : (
            <div style={{ maxHeight: '260px', height: '240px' }}>
              <Bar
                data={barData}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      ticks: { callback: v => `${v}%` }
                    }
                  },
                  plugins: {
                    legend: { display: false }
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
