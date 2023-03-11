// Giá trị Analog của cảm biến
let dataAnalog = 0
// Giá trị (%) của cảm biến
let dataPercent = 0

// Bật cổng Serial
serial.setBaudRate(BaudRate.BaudRate115200)

// Xóa toàn bộ nội dung trên LCD (nếu có)
lcd.clearScreen()

// Cho hiển thị tiêu đề trước
lcd.displayText("Noise Detector", 1, 1)
lcd.displayText(lcd.displaySymbol(lcd.Symbols.sym02), 1, 2)

// Cho hiển thị giá trị (%) của cảm biến trên LCD, với tần suất 0.5s
loops.everyInterval(500, function () {
  lcd.displayText("" + dataPercent + "%  ", 3, 2)
})

basic.forever(function () {
  // Đọc giá trị Analog 25 lần, lấy trung bình cộng
  dataAnalog = 0
  for (let index = 0; index < 25; index++) {
    dataAnalog += pins.analogReadPin(AnalogPin.P0)
    basic.pause(1)
  }
  dataAnalog = dataAnalog / 25

  // Đọc giá trị Analog của cảm biến và đổi ra thang (%)
  dataPercent = Math.round(Math.map(dataAnalog, 0, 1023, -100, 100))
  // Gửi giá trị (%) của cảm biến lên Serial
  serial.writeLine("" + (dataPercent))

  // Dừng 0.025s
  basic.pause(25)
})
