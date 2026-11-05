import React, { useState, useEffect, useCallback } from 'react';
import { NguoiDung, NhiemVu, NhacNho } from './domain/types';
import { TaiKhoanController } from './controller/TaiKhoanController';
import { NhacNhoController } from './controller/NhacNhoController';
import { KhoDuLieu, DuLieuNguoiDung } from './domain/KhoDuLieu';
import { ManHinhTaiKhoan } from './boundary/ManHinhTaiKhoan';
import { ManHinhMucTieu } from './boundary/ManHinhMucTieu';
import { ManHinhNhiemVu } from './boundary/ManHinhNhiemVu';
import { ManHinhHanMuc } from './boundary/ManHinhHanMuc';
import { ManHinhTienDo } from './boundary/ManHinhTienDo';
import { ManHinhBaoCao } from './boundary/ManHinhBaoCao';
import { ManHinhNhacNho } from './boundary/ManHinhNhacNho';
import { ManHinhDuLieu } from './boundary/ManHinhDuLieu';
import { Target, CheckSquare, Sliders, Activity, BarChart3, Bell, FileText, LogOut, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<NguoiDung | null>(null);
  const [activeTab, setActiveTab] = useState<'MUCTIEU' | 'NHIEMVU' | 'HANMUC' | 'TIENDO' | 'BAOCAO' | 'NHACNHO' | 'DULIEU'>('MUCTIEU');
  const [userData, setUserData] = useState<DuLieuNguoiDung>({
    danhMuc: [],
    mucTieu: [],
    nhiemVu: [],
    hanMuc: [],
    banGhiTienDo: [],
    nhacNho: []
  });

  const [selectedMucTieuId, setSelectedMucTieuId] = useState<string | undefined>();
  const [preSelectedNV, setPreSelectedNV] = useState<NhiemVu | null>(null);

  // Khôi phục phiên đăng nhập khi tải ứng dụng
  useEffect(() => {
    const user = TaiKhoanController.layNguoiDungHienTai();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  // Tải dữ liệu khi người dùng thay đổi
  const reloadData = useCallback(() => {
    if (!currentUser) return;
    const data = KhoDuLieu.layDuLieu(currentUser.tenDangNhap);
    setUserData(data);
  }, [currentUser]);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  // Bộ định thời kiểm tra nhắc nhở (Actor: BoDinhThoi, kiểm tra khi mở app và mỗi 60 giây khi tab mở)
  useEffect(() => {
    if (!currentUser) return;

    const kiemTra = () => {
      const homNay = new Date().toISOString().split('T')[0];
      const nhacMoi = NhacNhoController.kiemTraNhacNho(currentUser.tenDangNhap, homNay);
      if (nhacMoi.length > 0) {
        reloadData();
      }
    };

    // Kiểm tra ngay khi mở app
    kiemTra();

    // Lặp lại mỗi 60 giây khi tab mở
    const timerId = setInterval(kiemTra, 60000);
    return () => clearInterval(timerId);
  }, [currentUser, reloadData]);

  const handleDangXuat = () => {
    TaiKhoanController.dangXuat();
    setCurrentUser(null);
    setActiveTab('MUCTIEU');
  };

  const handleSelectMucTieu = (id: string) => {
    setSelectedMucTieuId(id);
    setActiveTab('NHIEMVU');
  };

  const handleOpenCapNhatTienDo = (nv: NhiemVu) => {
    setPreSelectedNV(nv);
    setActiveTab('TIENDO');
  };

  if (!currentUser) {
    return <ManHinhTaiKhoan onDangNhapThanhCong={user => setCurrentUser(user)} />;
  }

  const unreadNhacNhoCount = userData.nhacNho.filter((nn: NhacNho) => !nn.daDoc).length;

  return (
    <div>
      <header className="app-header">
        <div className="header-inner">
          <a href="#/pergoal" className="brand" onClick={e => { e.preventDefault(); setActiveTab('MUCTIEU'); }}>
            <div style={{ display: 'flex', padding: '6px', background: '#dbeafe', borderRadius: '10px' }}>
              <ShieldCheck size={22} color="#2563eb" />
            </div>
            <span>Pergoal</span>
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '0.85rem', color: '#475569', textAlign: 'right' }}>
              <div><strong>{currentUser.tenHienThi}</strong></div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>@{currentUser.tenDangNhap} (Cục bộ)</div>
            </div>
            <button className="btn btn-sm btn-secondary" onClick={handleDangXuat} title="Đăng xuất (UC03)">
              <LogOut size={16} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Thanh điều hướng chính (Tabs) */}
        <div style={{ borderTop: '1px solid var(--border)', background: '#ffffff' }}>
          <div className="container" style={{ padding: '4px 16px' }}>
            <nav className="nav-tabs">
              <button
                className={`nav-tab-btn ${activeTab === 'MUCTIEU' ? 'active' : ''}`}
                onClick={() => setActiveTab('MUCTIEU')}
              >
                <Target size={18} />
                <span>Mục tiêu ({userData.mucTieu.length})</span>
              </button>

              <button
                className={`nav-tab-btn ${activeTab === 'NHIEMVU' ? 'active' : ''}`}
                onClick={() => setActiveTab('NHIEMVU')}
              >
                <CheckSquare size={18} />
                <span>Nhiệm vụ ({userData.nhiemVu.length})</span>
              </button>

              <button
                className={`nav-tab-btn ${activeTab === 'HANMUC' ? 'active' : ''}`}
                onClick={() => setActiveTab('HANMUC')}
              >
                <Sliders size={18} />
                <span>Hạn mức ({userData.hanMuc.length})</span>
              </button>

              <button
                className={`nav-tab-btn ${activeTab === 'TIENDO' ? 'active' : ''}`}
                onClick={() => setActiveTab('TIENDO')}
              >
                <Activity size={18} />
                <span>Tiến độ</span>
              </button>

              <button
                className={`nav-tab-btn ${activeTab === 'BAOCAO' ? 'active' : ''}`}
                onClick={() => setActiveTab('BAOCAO')}
              >
                <BarChart3 size={18} />
                <span>Báo cáo hiệu suất</span>
              </button>

              <button
                className={`nav-tab-btn ${activeTab === 'NHACNHO' ? 'active' : ''}`}
                onClick={() => setActiveTab('NHACNHO')}
              >
                <Bell size={18} />
                <span>Nhắc nhở</span>
                {unreadNhacNhoCount > 0 && <span className="badge-count">{unreadNhacNhoCount}</span>}
              </button>

              <button
                className={`nav-tab-btn ${activeTab === 'DULIEU' ? 'active' : ''}`}
                onClick={() => setActiveTab('DULIEU')}
              >
                <FileText size={18} />
                <span>Dữ liệu JSON</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container" style={{ marginTop: '20px', paddingBottom: '40px' }}>
        {activeTab === 'MUCTIEU' && (
          <ManHinhMucTieu
            tenDangNhap={currentUser.tenDangNhap}
            mucTieus={userData.mucTieu}
            danhMucs={userData.danhMuc}
            nhiemVus={userData.nhiemVu}
            onDataChange={reloadData}
            onSelectMucTieu={handleSelectMucTieu}
          />
        )}

        {activeTab === 'NHIEMVU' && (
          <ManHinhNhiemVu
            tenDangNhap={currentUser.tenDangNhap}
            mucTieus={userData.mucTieu}
            nhiemVus={userData.nhiemVu}
            selectedMucTieuId={selectedMucTieuId}
            onDataChange={reloadData}
            onOpenCapNhatTienDo={handleOpenCapNhatTienDo}
          />
        )}

        {activeTab === 'HANMUC' && (
          <ManHinhHanMuc
            tenDangNhap={currentUser.tenDangNhap}
            mucTieus={userData.mucTieu}
            hanMucs={userData.hanMuc}
            selectedMucTieuId={selectedMucTieuId}
            onDataChange={reloadData}
          />
        )}

        {activeTab === 'TIENDO' && (
          <ManHinhTienDo
            tenDangNhap={currentUser.tenDangNhap}
            nhiemVus={userData.nhiemVu}
            hanMucs={userData.hanMuc}
            banGhiTienDos={userData.banGhiTienDo}
            preSelectedNhiemVu={preSelectedNV}
            onDataChange={reloadData}
            onClose={() => setPreSelectedNV(null)}
          />
        )}

        {activeTab === 'BAOCAO' && (
          <ManHinhBaoCao
            tenDangNhap={currentUser.tenDangNhap}
            mucTieus={userData.mucTieu}
          />
        )}

        {activeTab === 'NHACNHO' && (
          <ManHinhNhacNho
            tenDangNhap={currentUser.tenDangNhap}
            nhacNhos={userData.nhacNho}
            onDataChange={reloadData}
          />
        )}

        {activeTab === 'DULIEU' && (
          <ManHinhDuLieu
            tenDangNhap={currentUser.tenDangNhap}
            onDataChange={reloadData}
          />
        )}
      </main>
    </div>
  );
};
export default App;
