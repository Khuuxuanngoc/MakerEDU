lcd.clearScreen()
basic.forever(function () {
  lcd.displayText("" + ultraSonic.readDistance(ultraSonic.PingUnit.Centimeters, ultraSonic.PinKit.Port1) + " cm   ", 1, 1)
  basic.pause(500)
})