lcd.clearScreen()
lcd.displayText("Temp:", 1, 1)
lcd.displayText("Humi:", 1, 2)
basic.forever(function () {
    lcd.displayText("" + dht11.readTemperature(dht11.TemperatureType.Celsius, dht11.PinKit.P0) + lcd.displaySymbol(lcd.Symbols.sym07) + "C   ", 7, 1)
    lcd.displayText("" + dht11.readHumidity(dht11.PinKit.P0) + "%   ", 7, 2)
})
