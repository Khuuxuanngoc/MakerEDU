// Xóa toàn bộ nội dung trên LCD (nếu có)
lcd.clearScreen()

// Cho hiển thị nội dung sau trên LCD
lcd.displayText("   LCD1602 I2C  ", 1, 1)
lcd.displayText("   MakerLab.vn  ", 1, 2)

// Dừng 5s để hiển thị, rồi xóa toàn bộ nội dung
basic.pause(5000)
lcd.clearScreen()

// Cho hiển thị tiêu đề "Đếm"
lcd.displayText("Count:", 1, 1)
// Tạo 1 biến lưu số đếm, bắt đầu từ số 0
let count = 0

basic.forever(function () {
  // Tăng giá trị số đếm lên 1 đơn vị
  count += 1
  // Hiển thị giá trị đó trên LCD sau tiêu đề "Đếm"
  lcd.displayText(convertToText(count), 8, 1)

  // Dừng 0.5s
  basic.pause(500)
})
