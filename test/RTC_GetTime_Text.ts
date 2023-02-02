lcd.clearScreen()
lcd.displayText(ds3231.getCalendar(), 1, 1)
basic.forever(function () {
  lcd.displayText(ds3231.getTime(), 1, 2)
  basic.pause(1000)
})
