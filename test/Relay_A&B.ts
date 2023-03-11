// Xóa toàn bộ nội dung trên LCD (nếu có)
lcd.clearScreen()
// Cho hiển thị tiêu đề trên LCD và tắt Relay
lcd.displayText("Relay: OFF", 1, 1)
pins.digitalWritePin(DigitalPin.P0, 1)

// Khi nhấn nút A, Relay được bật
input.onButtonPressed(Button.A, function () {
  lcd.displayText("ON ", 8, 1)
  pins.digitalWritePin(DigitalPin.P0, 0)
})

// Khi nhấn nút B, Relay bị tắt
input.onButtonPressed(Button.B, function () {
  lcd.displayText("OFF", 8, 1)
  pins.digitalWritePin(DigitalPin.P0, 1)
})
