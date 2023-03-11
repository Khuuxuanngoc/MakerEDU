/* Các hằng số trong công thức của NTC */
let A = 0.001009249522
let B = 0.0002378405444
let C = 2.019202697e-7

// Giá trị Analog của NTC
let analog_NTC
// Giá trị (%) của NTC
let percent_NTC

// Giá trị điện trở phân áp (1k Ohm) với NTC
let R = 1000
// Giá trị điện trở hiện tại của NTC
let rNTC
// Logarit tự nhiên của điện trở NTC
let log_rNTC

// Giá trị nhiệt độ °K của NTC
let tempK
// Giá trị nhiệt độ °C của NTC
let tempC

// Bật cổng Serial
serial.setBaudRate(BaudRate.BaudRate115200)

// Xóa toàn bộ nội dung trên LCD (nếu có)
lcd.clearScreen()

// Cho hiển thị tiêu đề trước
lcd.displayText("Temperature NTC", 1, 1)
lcd.displayText(lcd.displaySymbol(lcd.Symbols.sym02), 1, 2)

basic.forever(function () {
  // Đọc giá trị Analog của NTC và đổi ra thang (%)
  analog_NTC = pins.analogReadPin(AnalogPin.P0)
  percent_NTC = Math.round(Math.map(analog_NTC, 0, 1023, 100, 0))

  /**
   * Các bước tính nhiệt độ của NTC
   * 1. Tính giá trị Điện trở hiện tại của NTC dựa trên giá trị Analog
   * 2. Tính Logarit của giá trị Điện trở NTC
   * 3. Áp dụng công thức của NTC, tính ra nhiệt độ °K
   * 4. Chuyển đổi °K sang °C
   * 5. Lấy giá trị °C với 2 chữ số thập phân
   */
  rNTC = R / ((1024 / analog_NTC) - 1)
  log_rNTC = Math.log(rNTC)
  tempK = (1 / (A + B * log_rNTC + C * log_rNTC * log_rNTC * log_rNTC))
  tempC = tempK - 273.15
  tempC = Math.trunc(tempC * 100) / 100

  // Cho hiển thị giá trị nhiệt độ °C của NTC trên LCD sau tiêu đề
  lcd.displayText("" + tempC + lcd.displaySymbol(lcd.Symbols.sym07) + "C  ", 3, 2)

  // Gửi giá trị (%) của NTC lên Serial
  serial.writeLine("" + (percent_NTC))

  // Dừng 0.5s
  basic.pause(500)
})
