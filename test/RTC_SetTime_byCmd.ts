/**
 * Để cài đặt thời gian cho RTC, ta cần gửi chuỗi theo đúng cú pháp sau: "ST-dd/mm/yyyy-hh:mm:ss"
 * Nếu Micro:bit nhận lệnh đúng cú pháp
 * Nó sẽ báo "Set Success Time", ngược lại là "Set Failure Time"
 */

serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
  if (ds3231.setTime_byCommands(serial.readUntil(serial.delimiters(Delimiters.NewLine)))) {
    lcd.displayText("Set Success Time", 1, 3)
  } else {
    lcd.displayText("Set Failure Time", 1, 3)
  }
  basic.pause(3000)
  lcd.displayText("                    ", 1, 3)
  lcd.displayText(ds3231.getCalendar(), 1, 1)
})
serial.setTxBufferSize(32)
serial.setRxBufferSize(32)
lcd.clearScreen()
lcd.displayText(ds3231.getCalendar(), 1, 1)
basic.forever(function () {
  lcd.displayText(ds3231.getTime(), 1, 2)
  basic.pause(1000)
})
