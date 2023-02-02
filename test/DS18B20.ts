lcd.clearScreen()
basic.forever(function () {
  lcd.displayText("" + ds18b20.readTemperature(ds18b20.PinKit.P0, ds18b20.TemperatureType.Celsius) + lcd.displaySymbol(lcd.Symbols.sym07) + "C   ", 1, 1)
})
