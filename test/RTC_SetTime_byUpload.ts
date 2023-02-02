ds3231.setTime_byChoose(31, ds3231.Month.Jan, 2023, 13, 31)
lcd.clearScreen()
basic.forever(function () {
  lcd.displayText(ds3231.getTime(), 1, 1)
  basic.pause(1000)
})
