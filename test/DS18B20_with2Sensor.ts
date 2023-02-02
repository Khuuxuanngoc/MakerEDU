lcd.clearScreen()
lcd.displayText("Sensor 1:", 1, 1)
lcd.displayText("Sensor 2:", 1, 2)
basic.forever(function () {
  lcd.displayText("" + ds18b20.readTemperature(ds18b20.PinKit.P1, ds18b20.TemperatureType.Celsius) + lcd.displaySymbol(lcd.Symbols.sym07) + "C  ", 11, 1)
  lcd.displayText("" + ds18b20.readTemperature(ds18b20.PinKit.P15, ds18b20.TemperatureType.Fahrenheit) + lcd.displaySymbol(lcd.Symbols.sym07) + "F  ", 11, 2)
})
