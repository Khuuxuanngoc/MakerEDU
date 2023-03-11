/**
 * Code này giúp bạn biết được toàn bộ thông tin dạng văn bản
 * Nhận được từ mỗi nút bấm của Remote IR
 * Dưới dạng các giá trị HEX
 */

let dataIR = ""
basic.forever(function () {
  dataIR = ir1838.printValueIR(ir1838.PinKit.P0)
  if (dataIR != "NONE") {
    serial.writeString(dataIR)
    serial.writeLine("...")
  }
})
