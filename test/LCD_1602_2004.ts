lcd.clearScreen()
lcd.displayText("1234567890123456", 1, 1)
lcd.displayText("12345678901234567890", 1, 2)
lcd.displayText(lcd.displaySymbol(lcd.Symbols.sym11), 3, 3)
lcd.displayText(lcd.displaySymbol(lcd.Symbols.sym10), 4, 4)
basic.pause(5000)
lcd.clearScreen()
lcd.displayText("Count:", 1, 1)
let count = 0
basic.forever(function () {
  count += 1
  lcd.displayText(convertToText(count), 8, 1)
  basic.pause(500)
})
