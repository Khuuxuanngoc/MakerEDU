// Xóa toàn bộ nội dung trên LCD (nếu có)
lcd.clearScreen()

// Cho hiển thị tiêu đề "Nhiệt độ"
lcd.displayText("Temp:", 1, 1)

// Cho hiển thị tiêu đề "Độ ẩm"
lcd.displayText("Humi:", 1, 2)

basic.forever(function () {
  // Đọc giá trị nhiệt độ hiện tại từ cảm biến DHT11, với đơn vị (°C)
  // Rồi cho hiển thị giá trị đó trên LCD sau tiêu đề "Nhiệt độ"
  lcd.displayText("" + dht11.readTemperature(dht11.TemperatureType.Celsius, dht11.PinKit.P0) + lcd.displaySymbol(lcd.Symbols.sym07) + "C   ", 7, 1)

  // Đọc giá trị độ ẩm hiện tại từ cảm biến DHT, với đơn vị (%)
  // Rồi cho hiển thị giá trị đó trên LCD sau tiêu đề "Độ ẩm"
  lcd.displayText("" + dht11.readHumidity(dht11.PinKit.P0) + "%   ", 7, 2)

  // Dừng 0.5s
  basic.pause(500)
})
