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
>
>
>
>
>
>
>
> Trang web giúp phát triển giao diện các khối [MakeCode Blocks Playground](https://makecode.com/playground#basic-hello-world)
>
> 
>
>
>
>
>

## Tổng quan về "MakerEDU Shield for Microbit"

> Shield được thiết kế để có thể sử dụng với **V1.5** cả **V2** của Micro:bit. Nó có thiết kế 1 khe cắm cho Micro:bit để kết nối dễ dàng. 1 cổng *"Micro USB"* để cắp nguồn cho toàn shield cũng như cho Motor nếu dùng với Driver.

> **3** pin `Touch`: `P0`, `P1`, `P2`.

> **6** cụm port 3Wires `Digital/Analog` **[ Pin | 5V | GND ]** gồm:
> - `P0`, `P1`, `P2`
> - `P13`, `P14`, `P15`

> **2** cụm port 4Wires `I2C` **[ SCL | SDA | 5V | GND ]**, trong đó:
> - `P19` - SCL
> - `P20` - SDA

> **2** cụm port 4Wires `UART` **[ RX | TX | 5V | GND ]** gồm:
> - `P0+P1` - UART1
>   - P0 - TX1
>   - P1 - RX1
> - `P2+P8` - UART2
>   - P2 - TX2
>   - P8 - RX2
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
> Sử dụng một trong 2 cụm port 4Wires `UART`.

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
> Sử dụng một trong 2 cụm port 4Wires `UART`.

### M14

> [Mạch Thu Hồng Ngoại MKE-M14 VS1838 IR Remote Control Receiver Module](https://hshop.vn/products/mach-thu-hong-ngoai-mkl-m14-vs1838-ir-remote-control-receiver-module)
>
> Sử dụng một trong 6 cụm port 3Wires `Digital/Analog`.

## Các module hỗ trợ khác

### Bluetooth

Sử dụng tính năng **Bluetooth (BLE)** `V1.5 (4.0)` hoặc `V2 (5.1)` tích hợp sẵn trên Micro:bit.

### Driver Motor

Sử dụng mạch **Driver (L9110)** tích hợp sẵn trên shield MakerEdu.