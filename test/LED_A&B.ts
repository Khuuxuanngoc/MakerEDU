// Cho biết trạng thái hoạt động hiện tại của LED
let statusLED = 0
// Cho biết chế độ hoạt động của LED là "bình thường" hay "chớp tắt"
let blink = 0

// Xóa toàn bộ nội dung trên LCD (nếu có)
lcd.clearScreen()
// Cho hiển thị tiêu đề trên LCD và tắt LED
lcd.displayText("LED: OFF", 1, 1)
pins.digitalWritePin(DigitalPin.P0, 0)

// Khi nhấn nút A, chỉ bật LED
input.onButtonPressed(Button.A, function () {
  lcd.displayText("ON   ", 6, 1)
  blink = 0
  statusLED = 1
})

// Khi nhấn nút B, chỉ tắt LED
input.onButtonPressed(Button.B, function () {
  lcd.displayText("OFF  ", 6, 1)
  blink = 0
  statusLED = 0
})

// Khi nhấn cùng lúc cả nút A+B, cho chớp tắt LED
input.onButtonPressed(Button.AB, function () {
  lcd.displayText("Blink", 6, 1)
  blink = 1
})

// Kiểm tra liên tục chế độ của LED để điều khiển
basic.forever(function () {
  if (blink == 1) {
    pins.digitalWritePin(DigitalPin.P0, 1)
    basic.pause(250)
    pins.digitalWritePin(DigitalPin.P0, 0)
    basic.pause(250)
  } else {
    if (statusLED == 1) {
      pins.digitalWritePin(DigitalPin.P0, 1)
    } else {
      pins.digitalWritePin(DigitalPin.P0, 0)
    }
  }
})
