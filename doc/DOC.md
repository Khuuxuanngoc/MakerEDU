# Bộ Extension của MakerEDU cho Micro:bit

...

## Nguồn tài nguyên

> Tham khảo các *"khối nền tảng"* của MakeCode, ở cả ngôn ngữ Block, JavaScript, Python - [MakeCode | Reference](https://makecode.microbit.org/reference).
>
> Hiểu về *"phần cứng"* bo mạch BBC Micro:bit - [Hardware | Device](https://makecode.microbit.org/device).
>
> Hiểu cơ bản về *"ngôn ngữ khối"* - [Blocks Language](https://makecode.microbit.org/blocks).
>
> Mối tương quan giữa ngôn ngữ [JavaScript](https://makecode.microbit.org/javascript) và các **Block**.
>
> Cách *"lưu trữ dự án"* của bạn - [Sharing your project](https://makecode.microbit.org/share).
>
> Bộ *"thư viện tiện ích mở rộng"* - [Extension Gallery](https://makecode.microbit.org/extensions).
>
> ---
>
> Trang web giúp *"phát triển nhanh"* giao diện, tính năng các khối mở rộng do ta viết [MakeCode Blocks Playground](https://makecode.com/playground#basic-hello-world).
>
> Trang web giúp kiểm tra thực tế bộ khối mở rộng do ta viết [Makecode Microbit](https://makecode.microbit.org/).
>
> ---
>
> Các bộ thư viện tham khảo trong quá trình phát triển:
> - [tinkertanker/pxt-iot-environment-kit](https://github.com/tinkertanker/pxt-iot-environment-kit)

## Tổng quan về "MakerEDU Shield for Microbit"

> Shield được thiết kế để có thể sử dụng với **V1.5** cả **V2** của Micro:bit. Nó có thiết kế 1 khe cắm cho Micro:bit để kết nối dễ dàng. 1 cổng *"Micro USB"* để cắp nguồn cho toàn shield cũng như cho Motor nếu dùng với Driver.

> **3** pin `Touch`: `P0`, `P1`, `P2`.

> **6** cụm port 3Wires `Digital/Analog` **[ Pin | 5V | GND ]** gồm:
> - `P0`, `P1`, `P2`
> - `P13`, `P14`, `P15`

> **2** cụm port 4Wires `I2C` **[ SCL | SDA | 5V | GND ]**, trong đó:
> - `P19` - SCL
> - `P20` - SDA

> **2** cụm port 4Wires **[ P1/P8 | P0/P2 | 5V | GND ]** gồm:
> - `P0+P1` - Digital
>   - P0 - Trig
>   - P1 - Echo
> - `P2+P8` - Digital, UART
>   - P2 - Trig, RX
>   - P8 - Echo, TX
>
> Lưu ý, với tính năng **UART (software)**, Micro:bit chỉ hỗ trợ cho các pin sau:
>
>     P0, P1, P2, P8, P12, P13, P14, P15, P16

> **2** cụm port 3Wires `Servo` **[ Pin | 5V | GND ]** gồm:
> - `P0` - PPM (Touch, Digital/Analog)
> - `P12` - PPM (Reserved: accessibility)
>
> Lưu ý, với tính năng **PPM**, Micro:bit chỉ hỗ trợ cho các pin sau:
>
>     P0, P1, P2, P3, P4, P10
>
>     Write Only: P5, P6, P7, P8, P9
>     Write Only: P11, P12, P13, P14, P15, P16

> **2** cụm port Domino `Motor` gồm:
> - `P13+P14` - Motor_A
>   - P13 - kênh B của Motor_A
>   - P14 - kênh A của Motor_A
> - `P15+P16` - Motor_B
>   - P15 - kênh B của Motor_B
>   - P16 - kênh A của Motor_B
>
> Sơ đồ kết nối chi tiết như sau:
>
>             | Gate AND |     | Motor_A |
>             |  HC08AG  |     |  L9110  |
>     P13 <-> A1 ------ Y1 <-> IB ----- OB
>     VCC <-> B1 ------ Y1
>     VCC <-> A2 ------ Y2
>     P14 <-> B2 ------ Y2 <-> IA ----- OA
>
>             | Gate AND |     | Motor_B |
>             |  HC08AG  |     |  L9110  |
>     P15 <-> A3 ------ Y3 <-> IB ----- OB
>     VCC <-> B3 ------ Y3
>     VCC <-> A4 ------ Y4
>     P16 <-> B4 ------ Y4 <-> IA ----- OA

## Các cảm biến hỗ trợ

### S01

> [Cảm Biến Siêu Âm MKE-S01 Ultra Sonic Distance Sensor](https://hshop.vn/products/cam-bien-sieu-am-mkl-us01-ultra-sonic-distance-sensor)
>
> Sử dụng một trong 2 cụm port 4Wires gồm `(P0+P1)` và `(P2+P8)`.

### S14

> [Cảm Biến Độ Ẩm Nhiệt Độ MKE-S14 DHT11 Temperature And Humidity Sensor](https://hshop.vn/products/cam-bien-do-am-nhiet-do-mkl-s14-dht11-temperature-and-humidity-sensor)
>
> Sử dụng một trong 6 cụm port 3Wires `Digital/Analog`.

### S15

> [Cảm Biến Nhiệt Độ MKE-S15 DS18B20 Waterproof Temperature Sensor](https://hshop.vn/products/cam-bien-nhiet-do-mkl-s15-ds18b20-waterproof-temperature-sensor-1)
>
> Sử dụng một trong 6 cụm port 3Wires `Digital/Analog`.

## Các module hỗ trợ

### M07/08

> [Mạch Hiển Thị MKE-M07 LCD1602 I2C Module](https://hshop.vn/products/mach-hien-thi-mkl-m07-lcd1602-i2c-module)
>
> [Mạch Hiển Thị MKE-M08 LCD2004 I2C Module](https://hshop.vn/products/mach-hien-thi-mkl-m08-lcd2004-i2c-module)
>
> Sử dụng một trong 2 cụm port 4Wires `I2C`.

### M09

> [Mạch Thời Gian Thực MKE-M09 RTC DS3231 Real Time Clock Module](https://hshop.vn/products/mach-thoi-gian-thuc-mkl-m09-rtc-ds3231-real-time-clock-module)
>
> Sử dụng một trong 2 cụm port 4Wires `I2C`.

### M13

> [Mạch Phát Âm Thanh MKE-M11 UART Control MP3 Player Module](https://hshop.vn/products/mach-phat-am-thanh-mkl-m11-uart-control-mp3-player-module)
>
> Sử dụng cụm port 4Wires `UART (P2+P8)`.

### M14

> [Mạch Thu Hồng Ngoại MKE-M14 VS1838 IR Remote Control Receiver Module](https://hshop.vn/products/mach-thu-hong-ngoai-mkl-m14-vs1838-ir-remote-control-receiver-module)
>
> Sử dụng một trong 6 cụm port 3Wires `Digital/Analog`.

## Các module hỗ trợ khác

### Bluetooth

> Sử dụng tính năng **Bluetooth (BLE)** `V1.5 (4.0)` hoặc `V2 (5.1)` tích hợp sẵn trên Micro:bit.
>
> Mọi thứ về Bluetooth của Micro:bit có thể xem tại đây ... [Bluetooth](https://makecode.microbit.org/reference/bluetooth).
>
> Các bước ghép nối Micro:bit với Phone qua Bluetooth:
> 1. Ở lần ghép nối đầu tiên, bạn nên nạp đoạn mã code file HEX `microbit-pair` này cho Micro:bit trước.<br>Xem qua bài viết, [Bluetooth troubleshooting guide](https://support.microbit.org/support/solutions/articles/19000069393) và, [micro:bit iOS app: connect and send programs](https://support.microbit.org/support/solutions/articles/19000117215-micro-bit-ios-app-connect-and-send-programs).
> 2. Tiếp bạn mở App `micro:bit` trên Phone -> *"Choose micro:bit"* -> *"Pair a new micro:bit"*.
> 3. Lúc này bạn đang chuẩn bị *"Enter pairing mode"*.<br>Thực hiện trên micro:bit với các thao tác theo hướng dẫn trên App.
> 4. Sau khi ghép nối thành công, kể từ giờ mỗi khi mở App, nó sẽ tự động ghép nối với bo mạch micro:bit đó.<br>Từ giờ bạn có thể nạp các code có ứng dụng sử dụng Bluetooth với Phone.
>     - Chỉ cần mở App `micro:bit` -> *"Monitor and Control"*.
>     - Thiết lập giao diện muốn dùng trong mục *"Set"* và *"Add"*.
>     - Chọn thiết bị micro:bit đã thực hiện ghép nối trước đó (mỗi bo mạch micro:bit sẽ có 1 tên riêng hiển thị trên Phone).
>     - Cuối cùng, chỉ việc bấm *"Start"* khi muốn bắt đầu điều khiển bằng Bluetooth.
>     - Và nhấn *"Stop"* để dừng kết nối Bluetooth, mỗi khi muốn kết thúc điều khiển.
>
> Một số dự án demo bằng tính năng Bluetooth:
> - [Controlling the Micro:bit from a Phone App](https://www.youtube.com/watch?v=UuGTBZRwC-8&ab_channel=BillSiever)

### Driver Motor

> Sử dụng mạch **Driver (L9110)** tích hợp sẵn trên shield MakerEdu.

### Servo

> Sử dụng trực tiếp tính năng **PPM** của Micro:bit.
>
> Một chút lưu ý về chân [P12](https://microbit.pinout.xyz/pin-p12-accessibility-.html) (Reserved - Accessibility).
>
> Bên cạnh, Micro:bit chỉ hỗ trợ tính năng PPM cho vài chân, ta có thể xem chi tiết hơn trong khối [Servo Write Pin](https://makecode.microbit.org/reference/pins/servo-write-pin).