// Đặt mức âm lượng là 30 (mức cao nhất)
mp3Player.setVolume(30)
// Đặt EQ là nhạc Jazz
mp3Player.setEQ(mp3Player.EQ.Jazz)

// Lấy thông tin hiện đang cài đặt trong bộ phát nhạc
// Và gửi thông tin đó lên cổng UART
serial.writeString(mp3Player.getInfo())
serial.writeLine("...")

// Dừng 3s
basic.pause(3000)

// Gửi thông tin dưới đây lên cổng UART
serial.writeLine("Play file 1 until done")
// Phát nhạc file 1 cho đến khi hết bài
mp3Player.playFileUntilDone(1)

basic.forever(function () {
  // Gửi thông tin dưới đây lên cổng UART
  serial.writeLine("Play Next")
  // Phát bài tiếp theo cho đến khi hết bài
  mp3Player.playUntilDone(mp3Player.PlayWhat.Next)
})
