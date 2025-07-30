# Google Maps Crawler Extension

Extension Chrome để crawl dữ liệu từ Google Maps.

## Tính năng

- ✅ **Auto crawl tự động** - Tự động click qua các địa điểm
- ✅ **Auto scroll infinite** - Tự động scroll để load thêm items
- ✅ **Cải thiện tìm số điện thoại** - Tìm kiếm trong toàn bộ trang
- ✅ **Xóa dữ liệu cũ** - Tự động xóa khi bắt đầu crawl mới
- ✅ **Thông tin chi tiết** - Facebook, giờ mở cửa, mô tả
- ✅ **Giao diện real-time** - Hiển thị tiến độ auto click và scroll
- ✅ **Lưu trữ dữ liệu locally** - An toàn, không gửi ra ngoài
- ✅ **Xuất dữ liệu JSON** - Dễ dàng xử lý

## Cài đặt

1. Mở Chrome và vào `chrome://extensions/`
2. Bật "Developer mode" (góc trên bên phải)
3. Click "Load unpacked" và chọn thư mục này
4. Extension sẽ xuất hiện trong danh sách

## Sử dụng

1. **Mở Google Maps** (maps.google.com) và tìm kiếm
2. **Click icon extension** → **"Bắt đầu Crawl"**
3. **Extension tự động:**
   - Xóa dữ liệu cũ
   - Crawl địa điểm hiện tại
   - **Auto click và scroll thông minh** - Scroll khi đến item 6, 13, 20, ...
   - **Infinite scroll tự động** - Cứ 7 items thì scroll 1 lần
   - Thu thập thông tin chi tiết
4. **Theo dõi tiến độ** qua popup
5. **Click "Dừng Crawl"** khi muốn dừng
6. **Click "Xuất Dữ Liệu"** để tải file JSON
7. **Click "Xóa Dữ Liệu"** để xóa thủ công

## Dữ liệu được crawl

- **Tên địa điểm** - Tên chính thức
- **Địa chỉ** - Địa chỉ đầy đủ
- **Số điện thoại** - Cải thiện tìm kiếm trong toàn trang
- **Website** - Link website chính thức
- **Facebook** - Link Facebook (nếu có)
- **Rating** - Điểm đánh giá
- **Số reviews** - Số lượng đánh giá
- **Category** - Loại hình kinh doanh
- **Giờ mở cửa** - Thông tin giờ hoạt động
- **Mô tả** - Thông tin mô tả dịch vụ
- **Coordinates** - Tọa độ địa lý
- **Timestamp** - Thời gian crawl

## Cấu trúc file

```
Extension/
├── manifest.json      # Cấu hình extension
├── popup.html        # Giao diện popup
├── popup.js          # Logic popup
├── content.js        # Script crawl dữ liệu
├── background.js     # Background script
├── icons/            # Thư mục chứa icons
└── README.md         # Hướng dẫn này
```

## Lưu ý

- Extension chỉ hoạt động trên Google Maps
- Dữ liệu được lưu locally trong browser
- Cần quyền truy cập vào Google Maps
- Không crawl dữ liệu cá nhân

## Troubleshooting

Nếu extension không hoạt động:

1. Kiểm tra console để xem lỗi
2. Refresh trang Google Maps
3. Disable và enable lại extension
4. Kiểm tra quyền truy cập
