import React, { useState } from 'react';
import { DuLieuController } from '../controller/DuLieuController';
import { Download, Upload, AlertCircle, CheckCircle, FileText, Info } from 'lucide-react';

interface Props {
  tenDangNhap: string;
  onDataChange: () => void;
}

export const ManHinhDuLieu: React.FC<Props> = ({ tenDangNhap, onDataChange }) => {
  const [jsonText, setJsonText] = useState('');
  const [thongBao, setThongBao] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleXuat = () => {
    try {
      const dataStr = DuLieuController.xuatDuLieu(tenDangNhap);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pergoal_backup_${tenDangNhap}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setThongBao({ type: 'success', msg: 'Xuất dữ liệu JSON thành công!' });
    } catch (err: any) {
      setThongBao({ type: 'error', msg: 'Lỗi khi xuất dữ liệu: ' + err.message });
    }
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      setJsonText(content);
    };
    reader.readAsText(file);
  };

  const handleNhap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonText.trim()) {
      setThongBao({ type: 'error', msg: 'Vui lòng chọn tệp hoặc dán nội dung JSON.' });
      return;
    }

    if (!confirm('Bạn có chắc chắn muốn nhập tệp này? Toàn bộ dữ liệu hiện tại của tài khoản trên thiết bị này sẽ được thay thế (BR16).')) {
      return;
    }

    const res = DuLieuController.nhapDuLieu(tenDangNhap, jsonText);
    if (res.success) {
      setThongBao({ type: 'success', msg: res.message });
      setJsonText('');
      onDataChange();
    } else {
      setThongBao({ type: 'error', msg: res.message });
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={24} color="#2563eb" />
          <span>Sao lưu & Xuất / Nhập Dữ liệu JSON (UC13)</span>
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
          Xuất dữ liệu ra tệp JSON để lưu trữ cục bộ hoặc chuyển đổi dữ liệu sang thiết bị khác
        </p>
      </div>

      {thongBao && (
        <div className={`alert ${thongBao.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
          {thongBao.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{thongBao.msg}</span>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">
            <Download size={20} color="#2563eb" />
            <span>Xuất dữ liệu (Export JSON)</span>
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '16px' }}>
            Tải về toàn bộ mục tiêu, nhiệm vụ, hạn mức, tiến độ và lịch sử của tài khoản <strong>{tenDangNhap}</strong> dưới định dạng tệp JSON.
          </p>
          <button className="btn btn-primary" onClick={handleXuat}>
            <Download size={16} />
            <span>Tải tệp JSON về máy</span>
          </button>
        </div>

        <div className="card">
          <h3 className="card-title">
            <Upload size={20} color="#10b981" />
            <span>Nhập dữ liệu (Import JSON)</span>
          </h3>

          <div className="alert alert-warning" style={{ fontSize: '0.8rem', padding: '10px 14px' }}>
            <Info size={16} />
            <span>
              <strong>Quy tắc BR16:</strong> Hệ thống kiểm tra tính toàn vẹn cấu trúc tệp. Nếu tệp sai định dạng, hệ thống từ chối và bảo toàn nguyên vẹn dữ liệu cũ.
            </span>
          </div>

          <form onSubmit={handleNhap}>
            <div className="form-group">
              <label className="form-label">Chọn tệp sao lưu (.json)</label>
              <input
                type="file"
                accept=".json"
                className="form-input"
                onChange={handleUploadFile}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Hoặc dán chuỗi JSON trực tiếp</label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Dán nội dung JSON tại đây..."
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-success" style={{ width: '100%' }}>
              <Upload size={16} />
              <span>Tiến hành nhập dữ liệu (Xác nhận thay thế)</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
