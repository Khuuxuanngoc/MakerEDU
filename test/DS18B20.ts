// Xóa toàn bộ nội dung trên LCD (nếu có)
lcd.clearScreen()

// Cho hiển thị tiêu đề "Nhiệt độ"
lcd.displayText("Temp:", 1, 1)

basic.forever(function () {
  // Đọc giá trị nhiệt độ hiện tại từ cảm biến DHT11, với đơn vị (°C)
  // Rồi cho hiển thị giá trị đó trên LCD sau tiêu đề "Nhiệt độ"
  lcd.displayText("" + ds18b20.readTemperature(ds18b20.PinKit.P0, ds18b20.TemperatureType.Celsius) + lcd.displaySymbol(lcd.Symbols.sym07) + "C   ", 7, 1)
})
