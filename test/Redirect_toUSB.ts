/**
 * Mặc định Micro:bit sử dụng cổng USB cho tính năng giao tiếp UART
 * Với Baudrate mặc định là 115200
 * 
 * Đoạn code test này, giúp phát hiện chuỗi kí tự gửi về Micro:bit
 * Với kí tự kết thúc là "new line"
 * Vì thế phía bên gửi, phải cài đặt có đệm thêm kí tự cuối (Append LF) chuỗi này mỗi khi gửi
 * 
 * Toàn bộ nội dung gửi về Micro:bit nhận được sẽ được hiển thị lên trên màn hình LCD
 */

serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
  lcd.clearScreen()
  lcd.displayText(serial.readUntil(serial.delimiters(Delimiters.NewLine)), 1, 1)
})
serial.setTxBufferSize(32)
serial.setRxBufferSize(32)
lcd.clearScreen()
