# Thư mục chứa Poster Phim

Thư mục này chứa các file ảnh poster cho các bộ phim.

## Các file ảnh cần có:

1. **Dune2.jpg** - Poster cho phim "Dune: Hành Tinh Cát - Phần 2"
2. **KungFuPanda4.jpg** - Poster cho phim "Kung Fu Panda 4"
3. **GodzillaxKongĐế Chế Mới.jpg** ✅ (Đã có)
4. **Exhuma.jpg** - Poster cho phim "Quật Mộ Trùng Ma"
5. **18x2.jpg** ✅ (Đã có)
6. **Oppenheimer.jpg** - Poster cho phim "Oppenheimer"

## Cách thêm ảnh:

1. Đặt file ảnh vào thư mục này với tên chính xác như trên
2. Định dạng: JPG hoặc PNG
3. Kích thước khuyến nghị: 500x750px (tỷ lệ 2:3)
4. Sau khi thêm ảnh, chạy lại seed script:
   ```bash
   npm run seed:movies
   ```

## Lưu ý:

- Tên file phải khớp chính xác với tên trong seed script
- Backend sẽ serve các file này tại: `http://localhost:5137/assets/img/[tên-file]`
- Nếu thiếu file, poster sẽ không hiển thị trên frontend

