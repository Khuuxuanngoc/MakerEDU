/**
 * Code này giúp ta biết được toàn bộ thông tin giá trị
 * Nhận được từ mỗi nút của remote IR
 * Dưới dạng giá trị HEX
 */

let dataIR = ""
basic.forever(function () {
  dataIR = ir1838.printValueIR(ir1838.PinKit.P0)
  if (dataIR != "NONE") {
    serial.writeString(dataIR)
    serial.writeLine("...")
  }
})
