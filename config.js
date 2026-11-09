// Cấu hình chế độ nhiều người khi chạy trên Vercel.
// Để trống (null) thì bảo tàng chạy chế độ một người.
// Cách lấy cấu hình: xem README.md, mục "Bật chế độ nhiều người".
window.FIREBASE_CONFIG = null;
/* Ví dụ sau khi tạo project Firebase:
window.FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "ten-project.firebaseapp.com",
  databaseURL: "https://ten-project-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ten-project",
  appId: "1:123:web:abc",
};
*/
// Tượng Chủ tịch Hồ Chí Minh trước cửa bảo tàng.
// Bỏ file mô hình 3D (.glb) vào thư mục models/ với tên dưới đây. Chưa có file thì bệ tượng để trống.
// rotationY: xoay tượng (radian) nếu mô hình bị quay lưng lại; thử 3.14 (nửa vòng) hoặc 1.57 (một phần tư vòng).
// Khi chưa có file .glb, dùng ảnh chụp mô hình (image) đã tách nền; cropBottom = phần chiều cao ảnh giữ lại (bỏ bệ trong ảnh).
window.STATUE = { url: "models/tuong_bac_ho.glb", rotationY: 0, height: 3.4, image: "models/tuong_bac_ho_anh.png", cropBottom: 0.868, backImage: "models/tuong_bac_ho_sau.png", backCropBottom: 0.85, backTolerance: 10, tolerance: 6 };

// Ảnh tượng chụp ở nhiều góc (ưu tiên dùng nếu có): mỗi ô là [x, y, rộng, cao] trên ảnh, a = góc nhìn (độ).
window.STATUE.sheet = "models/tuong_bac_ho_9goc.png";
window.STATUE.sheetCrop = 0.84;
window.STATUE.views = [
  { a: 0, r: [0, 0, 256, 510] }, { a: 36, r: [256, 0, 256, 510] }, { a: 72, r: [512, 0, 256, 510] }, { a: 108, r: [768, 0, 256, 510] },
  { a: 180, r: [0, 512, 205, 512] }, { a: 216, r: [205, 512, 205, 512] }, { a: 252, r: [410, 512, 205, 512] },
  { a: 288, r: [615, 512, 205, 512] }, { a: 324, r: [820, 512, 204, 512] },
];

// Tên phòng: đổi tên khác nếu muốn tách riêng từng buổi thuyết trình.
window.MUSEUM_ROOM = "bao-tang-vnr";

// Bật/tắt tượng và bệ tượng trước cửa (true = hiện, false = ẩn).
window.STATUE.enabled = false;
