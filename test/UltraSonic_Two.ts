lcd.clearScreen()
lcd.displayText("(1):", 1, 1)
lcd.displayText("(2):", 1, 2)
basic.forever(function () {
  lcd.displayText("" + ultraSonic.readDistance(ultraSonic.PingUnit.Centimeters, ultraSonic.PinKit.Port1) + " cm   ", 6, 1)
  lcd.displayText("" + ultraSonic.readDistance(ultraSonic.PingUnit.Centimeters, ultraSonic.PinKit.Port2) + " cm   ", 6, 2)
  basic.pause(1000)
})
