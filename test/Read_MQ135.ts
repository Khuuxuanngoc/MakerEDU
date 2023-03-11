// Giá trị Analog của cảm biến
let dataAnalog = 0
// Giá trị (%) của cảm biến
let dataPercent = 0

// Bật cổng Serial
serial.setBaudRate(BaudRate.BaudRate115200)
// Xóa toàn bộ nội dung trên LCD (nếu có)
lcd.clearScreen()

// Cho đếm ngược (60s), chờ cảm biến làm nóng xong
let wait = 60
lcd.displayText("Pls, wait in", 1, 1)
for (let index = 0; index < 60; index++) {
  // Cho hiển thị tiêu đề trước
  lcd.displayText("" + wait + "s ", 14, 1)
  basic.pause(1000)
  wait += -1
}

// Xóa toàn bộ nội dung trên LCD
lcd.clearScreen()
// Cho hiển thị tiêu đề trước
lcd.displayText("Air Quality", 1, 1)
lcd.displayText("[MQ135] " + lcd.displaySymbol(lcd.Symbols.sym02), 1, 2)

// Cho hiển thị giá trị (%) của cảm biến trên LCD mỗi 0.5s
loops.everyInterval(500, function () {
  lcd.displayText("" + dataPercent + "%  ", 11, 2)
})

basic.forever(function () {
  // Đọc giá trị Analog của cảm biến và đổi ra thang (%)
  dataAnalog = pins.analogReadPin(AnalogPin.P0)
  dataPercent = Math.round(Math.map(dataAnalog, 0, 1023, 0, 100))

  // Gửi giá trị (%) của cảm biến lên Serial
  serial.writeLine("" + (dataPercent))

  // Dừng 0.01s
  basic.pause(10)
})