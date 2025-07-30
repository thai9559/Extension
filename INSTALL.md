# Hướng dẫn cài đặt Google Maps Crawler Extension

## Bước 1: Chuẩn bị

1. Đảm bảo bạn đang sử dụng Google Chrome
2. Tải về hoặc clone project này về máy

## Bước 2: Tạo Icons (Tùy chọn)

Nếu bạn muốn tạo icons tùy chỉnh:

1. Mở file `create_icons.html` trong trình duyệt
2. Icons sẽ được tải về tự động
3. Di chuyển các file `icon16.png`, `icon48.png`, `icon128.png` vào thư mục `icons/`

## Bước 3: Cài đặt Extension

### Cách 1: Load từ thư mục (Khuyến nghị cho development)

1. Mở Chrome và truy cập `chrome://extensions/`
2. Bật "Developer mode" (toggle ở góc trên bên phải)
3. Click "Load unpacked"
4. Chọn thư mục chứa extension này
5. Extension sẽ xuất hiện trong danh sách

### Cách 2: Pack extension (Cho production)

1. Sau khi load unpacked thành công
2. Click "Pack extension" trong trang extensions
3. Chọn thư mục extension
4. Chrome sẽ tạo file `.crx` và `.pem`
5. Cài đặt file `.crx` bằng cách kéo thả vào Chrome

## Bước 4: Kiểm tra cài đặt

1. Extension icon sẽ xuất hiện trên thanh công cụ
2. Click vào icon để mở popup
3. Đảm bảo popup hiển thị đúng

## Bước 5: Sử dụng

1. Mở Google Maps (maps.google.com)
2. Click vào icon extension
3. Click "Bắt đầu Crawl"
4. Di chuyển giữa các địa điểm
5. Click "Dừng Crawl" khi hoàn thành
6. Click "Xuất Dữ Liệu" để tải file JSON

## Troubleshooting

### Extension không hiển thị

- Kiểm tra Developer mode đã bật chưa
- Refresh trang extensions
- Restart Chrome

### Extension không hoạt động trên Google Maps

- Kiểm tra console để xem lỗi
- Đảm bảo đang ở đúng trang Google Maps
- Thử refresh trang

### Không crawl được dữ liệu

- Kiểm tra quyền truy cập
- Đảm bảo trang đã load hoàn toàn
- Thử di chuyển đến địa điểm khác

### Lỗi permission

- Vào `chrome://extensions/`
- Tìm extension và click "Details"
- Kiểm tra các quyền đã được cấp

## Cấu trúc file sau khi cài đặt

```
Extension/
├── manifest.json
├── popup.html
├── popup.js
├── content.js
├── background.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── README.md
├── INSTALL.md
└── package.json
```

## Lưu ý bảo mật

- Extension chỉ truy cập Google Maps
- Dữ liệu được lưu locally
- Không gửi dữ liệu ra ngoài
- Có thể xóa dữ liệu bằng cách clear storage
