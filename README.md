# Pergoal — Bản demo quản lý mục tiêu

Pergoal giúp một người tạo mục tiêu, chia thành nhiệm vụ, đặt **mức năng suất 1–5 ⚡**, cập nhật tiến độ và xem hiệu suất. Toàn bộ ứng dụng chạy trong trình duyệt.

Đây là bản demo cho Báo cáo lần 1 môn Phân tích thiết kế hướng đối tượng. Ứng dụng là SPA viết bằng Vite + React + TypeScript, dữ liệu lưu trong `localStorage` với nhóm khoá `pergoal_v2_*`.

## 1. Yêu cầu môi trường

- Node.js 20 trở lên.
- npm đi kèm Node.

## 2. Chạy tại máy

```bash
cd web
npm ci
npm run dev
```

Mở địa chỉ Vite in ra (mặc định `http://localhost:5173/pergoal/`).

Build và xem thử bản tĩnh:

```bash
npm run build
npm run preview
```

## 3. Kiểm thử

```bash
npm test        # tương đương npx vitest run
```

Bộ test tập trung vào nghiệp vụ thuần, không phụ thuộc giao diện:

| Tệp | Nội dung |
|---|---|
| `src/domain/__tests__/BoKiemTraNangSuat.test.ts` | BR07: trần nhiệm vụ/ngày, trần giờ/tuần, ranh giới tuần thứ Hai – Chủ nhật, bỏ qua nhiệm vụ đã huỷ |
| `src/domain/__tests__/BoTinhHieuSuat.test.ts` | Tỉ lệ đúng hạn (kể cả mẫu số 0), nhiệm vụ trễ, chuỗi ngày có cập nhật, tiến độ trung bình |
| `src/domain/__tests__/TienDo.test.ts` | BR10, BR11: cập nhật phần trăm, hoàn thành, mở lại nhiệm vụ đã xong |
| `src/domain/__tests__/NgayThang.test.ts` | Ngày địa phương và ranh giới tuần |

## 4. Cấu trúc mã nguồn

```
web/
├── index.html
├── public/
│   ├── icon.svg
│   └── manifest.webmanifest        # PWA: cài như ứng dụng
├── src/
│   ├── main.tsx
│   ├── App.tsx                     # khung ứng dụng, điều hướng ba tab
│   ├── index.css
│   ├── domain/                     # entity + logic thuần, không phụ thuộc React
│   │   ├── types.ts
│   │   ├── BaoMat.ts               # PBKDF2 + salt qua WebCrypto
│   │   ├── NgayThang.ts            # ngày địa phương, ranh giới tuần
│   │   ├── BoKiemTraNangSuat.ts    # BR07
│   │   ├── BoTinhHieuSuat.ts       # công thức hiệu suất
│   │   ├── NhiemVu.ts              # cập nhật tiến độ (BR10, BR11)
│   │   └── KhoDuLieu.ts            # bọc localStorage
│   ├── controller/
│   │   ├── TaiKhoanController.ts
│   │   ├── MucTieuController.ts
│   │   ├── NhiemVuController.ts
│   │   └── BaoCaoController.ts
│   └── boundary/
│       ├── ManHinhTaiKhoan.tsx
│       ├── ManHinhMucTieu.tsx
│       ├── ManHinhNhiemVu.tsx
│       └── ManHinhHieuSuat.tsx
├── .github/workflows/deploy.yml    # test + build + deploy GitHub Pages
├── package.json
├── tsconfig.json
└── vite.config.ts                  # base: '/pergoal/'
```

Phân lớp theo Boundary–Controller–Entity. `BoKiemTraNangSuat`, `BoTinhHieuSuat` và phần cập nhật tiến độ của `NhiemVu` là code thuần, nhận `homNay` làm tham số để kiểm thử độc lập, không phụ thuộc React hay `localStorage`.

## 5. Chức năng

Giao diện chỉ có ba tab:

- **Mục tiêu:** thẻ gồm tên, thời gian, thanh tiến độ, trạng thái; sửa, xoá; 5 biểu tượng ⚡ bấm trực tiếp để đổi mức năng suất, kèm dòng "tối đa x nhiệm vụ/ngày, y giờ/tuần".
- **Nhiệm vụ:** mỗi dòng hiện thanh tiến độ và số % hiện tại; **Cập nhật tiến độ** mở hộp thoại tại chỗ (thanh kéo bắt đầu từ % hiện tại, nút nhanh 0/25/50/75/100, số giờ thực tế, ghi chú, lịch sử của chính nhiệm vụ); **Hoàn thành** một chạm đặt 100%. Nhiệm vụ đã xong vẫn hạ được % để mở lại.
- **Hiệu suất:** lọc khoảng ngày và mục tiêu, hiển thị bốn chỉ số dạng số (tỉ lệ đúng hạn, số nhiệm vụ trễ, chuỗi ngày, tiến độ trung bình).

Vượt mức năng suất sẽ hiện cảnh báo và yêu cầu xác nhận trước khi ghi, áp dụng cả khi tạo và khi sửa nhiệm vụ.

## 6. Mức năng suất

| Cấp | Hiển thị | Nhiệm vụ tối đa/ngày | Giờ tối đa/tuần |
|---|---|---|---|
| 1 | ⚡ | 1 | 5 |
| 2 | ⚡⚡ | 2 | 10 |
| 3 | ⚡⚡⚡ | 3 | 20 |
| 4 | ⚡⚡⚡⚡ | 5 | 30 |
| 5 | ⚡⚡⚡⚡⚡ | 8 | 40 |

Mức mặc định khi tạo mục tiêu là 3. Đổi mức không sửa nhiệm vụ đã có; nếu nhiệm vụ hiện có vượt mức mới, ứng dụng báo cho người dùng.

## 7. Dữ liệu và giới hạn

- Tài khoản là **tài khoản cục bộ trên trình duyệt**, chỉ tách dữ liệu giữa các tài khoản trên cùng máy; **không phải cơ chế bảo mật máy chủ**.
- Mật khẩu được băm **PBKDF2 có salt** bằng WebCrypto, không lưu mật khẩu rõ.
- Dữ liệu mục tiêu, nhiệm vụ và bản ghi tiến độ lưu trong `localStorage` dưới nhóm khoá `pergoal_v2_*`, không mã hoá.
- Xoá dữ liệu trình duyệt sẽ mất dữ liệu; bản demo chưa có sao lưu hay đồng bộ.
- Không đồng bộ giữa các thiết bị; không có máy chủ.

## 8. Triển khai GitHub Pages

Workflow `.github/workflows/deploy.yml` chạy khi push lên nhánh `main` (hoặc chạy tay):

1. `npm ci`
2. `npx vitest run`
3. `npm run build`
4. Upload thư mục `dist` và deploy lên GitHub Pages.

Cấu hình: `vite.config.ts` đặt `base: '/pergoal/'`, vì vậy repository phải có tên `pergoal` (hoặc sửa `base` cho khớp tên repository). Trong **Settings → Pages → Build and deployment**, chọn **Source: GitHub Actions**.

Liên kết bản demo: cập nhật sau khi triển khai thật.

## 9. Quy ước

- Lớp nghiệp vụ dùng tên tiếng Việt không dấu đúng theo Bảng thuật ngữ và quy tắc: `MucTieu`, `MucNangSuat`, `NhiemVu`, `taoMucTieu`, `BoTinhHieuSuat`…
- Component React dùng tiền tố `ManHinh*`; phần phụ trợ dùng tiếng Anh.
- Không ghi tên thật, thông tin cá nhân, mật khẩu hay token vào mã nguồn.
