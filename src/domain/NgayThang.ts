/**
 * Trả về ngày YYYY-MM-DD theo múi giờ trình duyệt (không dùng toISOString vì đó là giờ UTC).
 */
export function ngayDiaPhuong(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
