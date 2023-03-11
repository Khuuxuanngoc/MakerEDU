// Xóa toàn bộ nội dung trên LCD (nếu có)
lcd.clearScreen()

basic.forever(function () {
  // Cho hiển thị thông tin LỊCH hiện tại trong RTC trên LCD
  // Là Thứ, Ngày, Tháng, Năm
  lcd.displayText(ds3231.getCalendar(), 1, 1)

  // Cho hiển thị tiếp thông tin THỜI GIAN hiện tại trong RTC trên LCD
  // Là Giờ, Phút, Giây
  lcd.displayText(ds3231.getTime(), 1, 2)

  // Dừng 1s
  basic.pause(1000)
})
