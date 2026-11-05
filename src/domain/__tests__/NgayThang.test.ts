import { describe, it, expect } from 'vitest';
import { ngayDiaPhuong } from '../NgayThang';

describe('ngayDiaPhuong', () => {
  it('lấy ngày theo giờ địa phương', () => {
    expect(ngayDiaPhuong(new Date(2026, 10, 6, 1, 30))).toBe('2026-11-06');
    expect(ngayDiaPhuong(new Date(2026, 10, 5, 23, 59))).toBe('2026-11-05');
  });
});
