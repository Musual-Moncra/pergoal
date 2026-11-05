import React, { useState, useEffect } from 'react';
import { NhacNho } from '../domain/types';
import { NhacNhoController } from '../controller/NhacNhoController';
import { Bell, Check, Trash2, BellRing, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface Props {
  tenDangNhap: string;
  nhacNhos: NhacNho[];
  onDataChange: () => void;
}

export const ManHinhNhacNho: React.FC<Props> = ({
  tenDangNhap,
  nhacNhos,
  onDataChange
}) => {
  const [quyenThongBao, setQuyenThongBao] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setQuyenThongBao(Notification.permission);
    } else {
      setQuyenThongBao('unsupported');
    }
  }, []);

  const handleYeuCauQuyen = async () => {
    const res = await NhacNhoController.yeuCauQuyenThongBao();
    setQuyenThongBao(res);
  };

  const handleDanhDauDaDoc = (id: string) => {
    NhacNhoController.danhDauDaDoc(tenDangNhap, id);
    onDataChange();
  };

  const handleDanhDauDocTatCa = () => {
    NhacNhoController.danhDauDaDocTatCa(tenDangNhap);
    onDataChange();
  };

  const handleXoa = (id: string) => {
    NhacNhoController.xoaNhacNho(tenDangNhap, id);
    onDataChange();
  };

  const unreadCount = nhacNhos.filter(n => !n.daDoc).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={24} color="#2563eb" />
            <span>Trung tâm Nhắc nhở (UC12)</span>
            {unreadCount > 0 && <span className="badge-count">{unreadCount}</span>}
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Tự động cảnh báo khi sắp đến hạn, quá hạn hoặc khi phát hiện nhiệm vụ vượt trần hạn mức (BR14, BR15)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {unreadCount > 0 && (
            <button className="btn btn-secondary" onClick={handleDanhDauDocTatCa}>
              <Check size={16} />
              <span>Đánh dấu đã đọc tất cả</span>
            </button>
          )}

          {quyenThongBao !== 'granted' && quyenThongBao !== 'unsupported' && (
            <button className="btn btn-primary" onClick={handleYeuCauQuyen}>
              <BellRing size={16} />
              <span>Bật thông báo trình duyệt</span>
            </button>
          )}
        </div>
      </div>

      {/* Thông tin hỗ trợ thông báo trình duyệt */}
      <div className="alert alert-info">
        <Info size={18} />
        <div>
          <strong>Quy tắc BR15:</strong> Nhắc nhở luôn hiển thị trong ứng dụng này. Thông báo trình duyệt (Notification API) là tuỳ chọn và chỉ phát khi tab trình duyệt đang mở. Trạng thái cấp quyền hiện tại: <strong>{quyenThongBao}</strong>.
        </div>
      </div>

      {nhacNhos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 16px', color: '#64748b' }}>
          <Bell size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontWeight: 600 }}>Không có thông báo hoặc nhắc nhở nào.</p>
          <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Hệ thống tự động rà soát khi mở ứng dụng và định kỳ mỗi 60 giây khi tab đang mở.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {nhacNhos.map(nn => {
            const isUnread = !nn.daDoc;
            return (
              <div
                key={nn.id}
                className="card"
                style={{
                  margin: 0,
                  padding: '14px 18px',
                  background: isUnread ? '#ffffff' : '#f8fafc',
                  borderLeft: isUnread
                    ? nn.loai === 'VUOT_HAN_MUC' ? '4px solid #f59e0b' : nn.loai === 'QUA_HAN' ? '4px solid #ef4444' : '4px solid #2563eb'
                    : '4px solid #cbd5e1'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ marginTop: '2px' }}>
                      {nn.loai === 'VUOT_HAN_MUC' ? (
                        <AlertTriangle size={20} color="#f59e0b" />
                      ) : nn.loai === 'QUA_HAN' ? (
                        <AlertCircle size={20} color="#ef4444" />
                      ) : (
                        <Bell size={20} color="#2563eb" />
                      )}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className={`tag ${nn.loai === 'VUOT_HAN_MUC' ? 'tag-yellow' : nn.loai === 'QUA_HAN' ? 'tag-red' : 'tag-blue'}`}>
                          {nn.loai}
                        </span>
                        {isUnread && (
                          <span className="tag tag-blue" style={{ fontSize: '0.7rem' }}>Mới</span>
                        )}
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {new Date(nn.thoiDiemTao).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: isUnread ? 600 : 400 }}>
                        {nn.noiDung}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {isUnread && (
                      <button className="btn btn-sm btn-secondary" title="Đánh dấu đã đọc" onClick={() => handleDanhDauDaDoc(nn.id)}>
                        <Check size={14} />
                      </button>
                    )}
                    <button className="btn btn-sm btn-danger" title="Xóa" onClick={() => handleXoa(nn.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
