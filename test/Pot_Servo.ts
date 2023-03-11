// Giá trị góc điều khiển Servo
let angle = 0
// Giá trị Biến trở đọc được
let pot = 0

// Xóa toàn bộ nội dung trên LCD (nếu có)
lcd.clearScreen()
// Cho hiển thị tiêu đề trên LCD
lcd.displayText("Pot  :", 1, 1)
lcd.displayText("Servo:", 1, 2)

basic.forever(function () {
  // Đọc giá trị Biến trở
  pot = pins.analogReadPin(AnalogPin.P0)
  // Chuyển đổi giá trị trên sang Góc tương ứng
  angle = Math.round(Math.map(pot, 0, 1023, 0, 180))

  // Hiển thị giá trị Biến trở lên LCD
  lcd.displayText("" + pot + "   ", 8, 1)
  // Hiển thị giá trị Góc lên LCD
  lcd.displayText("" + angle + lcd.displaySymbol(lcd.Symbols.sym07) + "  ", 8, 2)

  // Điều khiển Servo với giá trị Góc
  pins.servoWritePin(AnalogPin.P12, angle)

  // Dừng 0.01s
  basic.pause(10)
})
