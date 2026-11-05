import React, { useState } from 'react';
import { TaiKhoanController } from '../controller/TaiKhoanController';
import { NguoiDung } from '../domain/types';
import { ShieldCheck, UserCheck, KeyRound, AlertCircle, Info } from 'lucide-react';

interface Props {
  onDangNhapThanhCong: (user: NguoiDung) => void;
}

export const ManHinhTaiKhoan: React.FC<Props> = ({ onDangNhapThanhCong }) => {
  const [isDangKy, setIsDangKy] = useState(false);
  const [tenDangNhap, setTenDangNhap] = useState('');
  const [tenHienThi, setTenHienThi] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [matKhauXacNhan, setMatKhauXacNhan] = useState('');
  const [loi, setLoi] = useState<string | null>(null);
  const [thanhCong, setThanhCong] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoi(null);
    setThanhCong(null);
    setLoading(true);

    try {
      if (isDangKy) {
        if (matKhau !== matKhauXacNhan) {
          setLoi('Mật khẩu xác nhận không khớp.');
          setLoading(false);
          return;
        }
        const res = await TaiKhoanController.dangKy(tenDangNhap, matKhau, tenHienThi);
        if (res.success) {
          setThanhCong(res.message + ' Bạn có thể đăng nhập ngay.');
          setIsDangKy(false);
          setMatKhau('');
          setMatKhauXacNhan('');
        } else {
          setLoi(res.message);
        }
      } else {
        const res = await TaiKhoanController.dangNhap(tenDangNhap, matKhau);
        if (res.success && res.user) {
          onDangNhapThanhCong(res.user);
        } else {
          setLoi(res.message);
        }
      }
    } catch (err: any) {
      setLoi(err.message || 'Đã có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '40px auto', padding: '0 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'inline-flex', padding: '12px', background: '#dbeafe', borderRadius: '16px', color: '#2563eb', marginBottom: '12px' }}>
          <ShieldCheck size={40} />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b' }}>Pergoal</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
          Hệ thống Quản lý Mục tiêu Cá nhân với Hạn mức & Hiệu suất
        </p>
      </div>

      {/* Thông báo minh bạch theo yêu cầu Brief */}
      <div className="alert alert-info" style={{ flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
          <Info size={18} />
          <span>Lưu ý về bản Demo:</span>
        </div>
        <ul style={{ paddingLeft: '20px', fontSize: '0.825rem', lineHeight: 1.6 }}>
          <li>Tài khoản được lưu trữ <strong>cục bộ trên trình duyệt</strong> của thiết bị này.</li>
          <li>Mọi dữ liệu mục tiêu, nhiệm vụ lưu ở <strong>localStorage</strong>.</li>
          <li>Mật khẩu được băm chuẩn <strong>PBKDF2 (SHA-256) với muối (salt)</strong> bằng WebCrypto API.</li>
          <li>Hệ thống nhắc nhở chỉ hoạt động <strong>khi tab trình duyệt đang mở</strong>.</li>
        </ul>
      </div>

      <div className="card">
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => { setIsDangKy(false); setLoi(null); setThanhCong(null); }}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: 'transparent',
              fontWeight: !isDangKy ? 700 : 500,
              color: !isDangKy ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: !isDangKy ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => { setIsDangKy(true); setLoi(null); setThanhCong(null); }}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: 'transparent',
              fontWeight: isDangKy ? 700 : 500,
              color: isDangKy ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: isDangKy ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            Đăng ký tài khoản
          </button>
        </div>

        {loi && (
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            <span>{loi}</span>
          </div>
        )}

        {thanhCong && (
          <div className="alert alert-success">
            <UserCheck size={18} />
            <span>{thanhCong}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Tên đăng nhập</label>
            <input
              type="text"
              className="form-input"
              placeholder="VD: nguyenvana"
              value={tenDangNhap}
              onChange={e => setTenDangNhap(e.target.value)}
              required
            />
          </div>

          {isDangKy && (
            <div className="form-group">
              <label className="form-label">Tên hiển thị</label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: Nguyễn Văn A"
                value={tenHienThi}
                onChange={e => setTenHienThi(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input
              type="password"
              className="form-input"
              placeholder="Tối thiểu 8 ký tự (BR01)"
              value={matKhau}
              onChange={e => setMatKhau(e.target.value)}
              required
            />
            {isDangKy && (
              <div className="form-hint">Mật khẩu phải chứa ít nhất 8 ký tự theo quy tắc BR01.</div>
            )}
          </div>

          {isDangKy && (
            <div className="form-group">
              <label className="form-label">Xác nhận mật khẩu</label>
              <input
                type="password"
                className="form-input"
                placeholder="Nhập lại mật khẩu"
                value={matKhauXacNhan}
                onChange={e => setMatKhauXacNhan(e.target.value)}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '12px' }}
            disabled={loading}
          >
            <KeyRound size={16} />
            <span>{loading ? 'Đang xử lý...' : isDangKy ? 'Đăng ký' : 'Đăng nhập'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
