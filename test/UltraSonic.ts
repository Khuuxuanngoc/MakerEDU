// Xóa toàn bộ nội dung trên LCD (nếu có)
lcd.clearScreen()

// Cho hiển thị tiêu đề "Khoảng cách"
lcd.displayText("Dist:", 1, 1)

basic.forever(function () {
  // Đọc giá trị khoảng cách hiện tại từ cảm biến siêu âm, với đơn vị (cm)
  // Rồi cho hiển thị giá trị đó trên LCD sau tiêu đề "Khoảng cách"
  lcd.displayText("" + ultraSonic.readDistance(ultraSonic.PingUnit.Centimeters, ultraSonic.PinKit.Port1) + " cm   ", 7, 1)

  // Dừng 0.5s
  basic.pause(500)
})
