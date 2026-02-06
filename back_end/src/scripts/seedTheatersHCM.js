import dotenv from "dotenv";
import { mysqlPool } from "../services/mysql.js";

dotenv.config();

const theatersHCM = [
  {
    name: "CGV Vincom Landmark 81",
    address: "Tầng 3, Vincom Landmark 81, 720A Điện Biên Phủ, P.22, Q.Bình Thạnh",
    city: "Hồ Chí Minh",
    phone: "1900 6017",
    is_active: 1,
  },
  {
    name: "CGV Crescent Mall",
    address: "Tầng 4, Crescent Mall, 101 Tôn Dật Tiên, P.Tân Phú, Q.7",
    city: "Hồ Chí Minh",
    phone: "1900 6017",
    is_active: 1,
  },
  {
    name: "CGV Saigon Centre",
    address: "Tầng 4, Saigon Centre, 65 Lê Lợi, P.Bến Nghé, Q.1",
    city: "Hồ Chí Minh",
    phone: "1900 6017",
    is_active: 1,
  },
  {
    name: "CGV Pandora City",
    address: "Tầng 3, Pandora City, 1/1 Trường Chinh, P.Tân Thới Nhất, Q.12",
    city: "Hồ Chí Minh",
    phone: "1900 6017",
    is_active: 1,
  },
  {
    name: "CGV Aeon Mall Bình Tân",
    address: "Tầng 3, Aeon Mall Bình Tân, Số 1 Đường số 17A, P.Bình Trị Đông B, Q.Bình Tân",
    city: "Hồ Chí Minh",
    phone: "1900 6017",
    is_active: 1,
  },
  {
    name: "Lotte Cinema Diamond",
    address: "Tầng 13, Diamond Plaza, 34 Lê Duẩn, P.Bến Nghé, Q.1",
    city: "Hồ Chí Minh",
    phone: "1900 1091",
    is_active: 1,
  },
  {
    name: "Lotte Cinema Cantavil",
    address: "Tầng 4, Cantavil Premier, Xa Lộ Hà Nội, P.An Phú, Q.2",
    city: "Hồ Chí Minh",
    phone: "1900 1091",
    is_active: 1,
  },
  {
    name: "Lotte Cinema Nowzone",
    address: "Tầng 4, Nowzone Shopping Mall, 235 Nguyễn Văn Cừ, P.Nguyễn Cư Trinh, Q.1",
    city: "Hồ Chí Minh",
    phone: "1900 1091",
    is_active: 1,
  },
  {
    name: "Galaxy Cinema Nguyễn Du",
    address: "116 Nguyễn Du, P.Bến Thành, Q.1",
    city: "Hồ Chí Minh",
    phone: "1900 2224",
    is_active: 1,
  },
  {
    name: "Galaxy Cinema Quang Trung",
    address: "Lầu 5, Co.opmart Quang Trung, 304A Quang Trung, P.10, Q.Gò Vấp",
    city: "Hồ Chí Minh",
    phone: "1900 2224",
    is_active: 1,
  },
  {
    name: "Galaxy Cinema Tân Bình",
    address: "246 Nguyễn Hồng Đào, P.14, Q.Tân Bình",
    city: "Hồ Chí Minh",
    phone: "1900 2224",
    is_active: 1,
  },
  {
    name: "BHD Star Cineplex Vincom Thủ Đức",
    address: "Tầng 4, Vincom Plaza Thủ Đức, 216 Võ Văn Ngân, P.Bình Thọ, Q.Thủ Đức",
    city: "Hồ Chí Minh",
    phone: "1900 2099",
    is_active: 1,
  },
  {
    name: "BHD Star Cineplex Vincom Đồng Khởi",
    address: "Tầng 4, Vincom Center Đồng Khởi, 72 Lê Thánh Tôn, P.Bến Nghé, Q.1",
    city: "Hồ Chí Minh",
    phone: "1900 2099",
    is_active: 1,
  },
  {
    name: "BHD Star Cineplex Vincom Lê Văn Việt",
    address: "Tầng 4, Vincom Plaza Lê Văn Việt, 50 Lê Văn Việt, P.Hiệp Phú, Q.9",
    city: "Hồ Chí Minh",
    phone: "1900 2099",
    is_active: 1,
  },
  {
    name: "Mega GS Cinemas Cao Thắng",
    address: "Tầng 4, Mega GS Cao Thắng, 19 Cao Thắng, P.2, Q.10",
    city: "Hồ Chí Minh",
    phone: "1900 2224",
    is_active: 1,
  },
  {
    name: "Mega GS Cinemas Bình Dương",
    address: "Tầng 3, Mega GS Bình Dương, 1 Đại Lộ Bình Dương, P.Chánh Nghĩa, TP.Thủ Dầu Một, Bình Dương",
    city: "Hồ Chí Minh",
    phone: "1900 2224",
    is_active: 1,
  },
  {
    name: "Cinestar Quốc Thanh",
    address: "271 Nguyễn Trãi, P.Nguyễn Cư Trinh, Q.1",
    city: "Hồ Chí Minh",
    phone: "028 3925 2005",
    is_active: 1,
  },
  {
    name: "Cinestar Hai Bà Trưng",
    address: "135 Hai Bà Trưng, P.Bến Nghé, Q.1",
    city: "Hồ Chí Minh",
    phone: "028 3829 2005",
    is_active: 1,
  },
  {
    name: "Platinum Cineplex",
    address: "Tầng 4, Platinum Plaza, 634 Điện Biên Phủ, P.22, Q.Bình Thạnh",
    city: "Hồ Chí Minh",
    phone: "1900 2224",
    is_active: 1,
  },
  {
    name: "Beta Cinemas",
    address: "Tầng 3, E.Town Center, 364 Cộng Hòa, P.13, Q.Tân Bình",
    city: "Hồ Chí Minh",
    phone: "1900 2224",
    is_active: 1,
  },
  {
    name: "CGV VivoCity",
    address: "Tầng 4, VivoCity, 1058 Nguyễn Văn Linh, P.Tân Phong, Q.7",
    city: "Hồ Chí Minh",
    phone: "1900 6017",
    is_active: 1,
  },
];

const seedTheatersHCM = async () => {
  try {
    // Kiểm tra kết nối MySQL
    const [mysqlRows] = await mysqlPool.query("SELECT 1");
    console.log("✅ Đã kết nối MySQL");

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Thêm từng rạp
    for (const theater of theatersHCM) {
      try {
        // Kiểm tra xem rạp đã tồn tại chưa (theo name và address)
        const [existing] = await mysqlPool.query(
          "SELECT id FROM theaters WHERE name = ? AND address = ?",
          [theater.name, theater.address]
        );

        if (existing.length > 0) {
          console.log(`⏭️  Đã bỏ qua: "${theater.name}" (đã tồn tại)`);
          skipCount++;
          continue;
        }

        // Insert vào MySQL
        const [result] = await mysqlPool.query(
          `INSERT INTO theaters 
          (name, address, city, phone, is_active) 
          VALUES (?, ?, ?, ?, ?)`,
          [
            theater.name,
            theater.address,
            theater.city,
            theater.phone || null,
            theater.is_active,
          ]
        );

        console.log(`✅ Đã thêm: "${theater.name}" (ID: ${result.insertId})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Lỗi khi thêm rạp "${theater.name}":`, error.message);
        errorCount++;
      }
    }

    // Tổng kết
    console.log("\n=== KẾT QUẢ SEED RẠP TP.HCM ===");
    console.log(`✅ Thành công: ${successCount} rạp`);
    console.log(`⏭️  Đã bỏ qua: ${skipCount} rạp (đã tồn tại)`);
    console.log(`❌ Lỗi: ${errorCount} rạp`);
    console.log(`📊 Tổng: ${theatersHCM.length} rạp`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi khi seed rạp:", error);
    process.exit(1);
  }
};

seedTheatersHCM();

