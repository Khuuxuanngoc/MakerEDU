// Cho biết trạng thái hoạt động hiện tại của còi
let statusBuzz = 0
// Cho biết chế độ còi đang bật hay tắt
let modeBuzz = 0

// Xóa toàn bộ nội dung trên LCD (nếu có)
lcd.clearScreen()
// Cho hiển thị tiêu đề trên LCD và tắt còi
lcd.displayText("Buzzer: OFF", 1, 1)
pins.digitalWritePin(DigitalPin.P0, 0)

// Khi nhấn nút A, còi được phép bật
input.onButtonPressed(Button.A, function () {
  modeBuzz = 1
  lcd.displayText("ON ", 9, 1)
})

// Khi nhấn nút B, còi bị tắt
input.onButtonPressed(Button.B, function () {
  modeBuzz = 0
  lcd.displayText("OFF", 9, 1)
})

// Mỗi 0.5s sẽ đảo trạng thái còi, nếu còi được bật
loops.everyInterval(500, function () {
  if (modeBuzz == 1) {
    if (statusBuzz == 0) {
      statusBuzz = 1
    } else {
      statusBuzz = 0
    }
    pins.digitalWritePin(DigitalPin.P0, statusBuzz)
  } else {
    pins.digitalWritePin(DigitalPin.P0, 0)
  }
})
