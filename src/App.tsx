import React, { useState, useEffect, useCallback } from 'react';
import { NguoiDung } from './domain/types';
import { TaiKhoanController } from './controller/TaiKhoanController';
import { KhoDuLieu, DuLieuNguoiDung } from './domain/KhoDuLieu';
import { ManHinhTaiKhoan } from './boundary/ManHinhTaiKhoan';
import { ManHinhMucTieu } from './boundary/ManHinhMucTieu';
import { ManHinhNhiemVu } from './boundary/ManHinhNhiemVu';
import { ManHinhHieuSuat } from './boundary/ManHinhHieuSuat';
import { Target, CheckSquare, BarChart3, LogOut, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<NguoiDung | null>(null);
  const [activeTab, setActiveTab] = useState<'MUCTIEU' | 'NHIEMVU' | 'HIEUSUAT'>('MUCTIEU');
  const [userData, setUserData] = useState<DuLieuNguoiDung>({
    mucTieu: [],
    nhiemVu: [],
    banGhiTienDo: []
  });

  const [selectedMucTieuId, setSelectedMucTieuId] = useState<string | undefined>();

  // Khôi phục phiên đăng nhập khi mở ứng dụng
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

  const handleDangXuat = () => {
    TaiKhoanController.dangXuat();
    setCurrentUser(null);
    setActiveTab('MUCTIEU');
  };

  const handleSelectMucTieu = (id: string) => {
    setSelectedMucTieuId(id);
    setActiveTab('NHIEMVU');
  };

  if (!currentUser) {
    return <ManHinhTaiKhoan onDangNhapThanhCong={user => setCurrentUser(user)} />;
  }

  return (
    <div>
      <header className="app-header">
        <div className="header-inner">
          <a
            href="#/pergoal"
            className="brand"
            onClick={e => {
              e.preventDefault();
              setActiveTab('MUCTIEU');
            }}
          >
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
            <button className="btn btn-sm btn-secondary" onClick={handleDangXuat} title="Đăng xuất khỏi phiên làm việc">
              <LogOut size={16} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Thanh điều hướng 3 tab chính */}
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
                className={`nav-tab-btn ${activeTab === 'HIEUSUAT' ? 'active' : ''}`}
                onClick={() => setActiveTab('HIEUSUAT')}
              >
                <BarChart3 size={18} />
                <span>Hiệu suất</span>
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
            banGhiTienDos={userData.banGhiTienDo}
            selectedMucTieuId={selectedMucTieuId}
            onDataChange={reloadData}
          />
        )}

        {activeTab === 'HIEUSUAT' && (
          <ManHinhHieuSuat
            tenDangNhap={currentUser.tenDangNhap}
            mucTieus={userData.mucTieu}
          />
        )}
      </main>
    </div>
  );
};

export default App;
