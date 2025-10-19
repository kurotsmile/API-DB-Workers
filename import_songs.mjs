import fs from "fs";
import { execSync } from "child_process";

// Đọc file JSON
const json = JSON.parse(fs.readFileSync("song-en.json", "utf8"));

// Lấy danh sách bài hát
const songs = json.all_item;

for (const s of songs) {
  // Chuẩn bị các cột
  const keys = [
    "id","name","artist","album","genre","lang","year","date",
    "publishedAt","link_ytb","mp3","avatar","lyrics"
  ];

  // Chuẩn bị giá trị, escape ký tự ' để SQL không lỗi
  const values = keys.map(k => {
    const val = s[k] ?? "";  // nếu trường undefined, dùng ""
    return `'${String(val).replace(/'/g, "''")}'`;
  });

  // Tạo câu lệnh SQL
  const sql = `INSERT OR REPLACE INTO song (${keys.join(",")}) VALUES (${values.join(",")});`;

  // Chạy lệnh thông qua Wrangler CLI
  try {
    execSync(`npx wrangler d1 execute carrot --remote --command="${sql}"`, { stdio: "inherit" });
  } catch (err) {
    console.error("❌ Lỗi insert song:", s.id, err);
  }
}

console.log("✅ Hoàn tất import tất cả bài hát!");
