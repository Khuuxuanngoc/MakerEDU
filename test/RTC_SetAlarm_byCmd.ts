/**
 * Để cài đặt báo thức cho RTC, ta cần gửi chuỗi theo đúng cú pháp sau: "SA-hh:mm"
 * Nếu Micro:bit nhận lệnh đúng cú pháp
 * Nó sẽ báo "Set Success Alarm", ngược lại là "Set Failure Alarm"
 * 
 * Bên cạnh khi đến đúng thời điểm báo thức
 * Micro:bit sẽ bật còi liên tục trong một phút
 */

serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
  if (ds3231.setAlarm_byCommands(serial.readUntil(serial.delimiters(Delimiters.NewLine)), ds3231.Alarm.OneTime)) {
      lcd.displayText("Set Success Alarm", 1, 3)
  } else {
      lcd.displayText("Set Failure Alarm", 1, 3)
  }
  basic.pause(3000)
  lcd.displayText("                    ", 1, 3)
  lcd.displayText(ds3231.getCalendar(), 1, 1)
})
serial.setTxBufferSize(32)
serial.setRxBufferSize(32)
music.setVolume(255)
lcd.clearScreen()
lcd.displayText(ds3231.getCalendar(), 1, 1)
loops.everyInterval(1000, function () {
  lcd.displayText(ds3231.getTime(), 1, 2)
})
basic.forever(function () {
  if (ds3231.checkAlarm()) {
      lcd.displayText("Wake Up!", 1, 4)
      for (let index = 0; index < 60; index++) {
          music.playSoundEffect(music.createSoundEffect(WaveShape.Square, 1600, 1, 255, 0, 1000, SoundExpressionEffect.None, InterpolationCurve.Curve), SoundExpressionPlayMode.UntilDone)
      }
      lcd.displayText("                    ", 1, 4)
  }
})
