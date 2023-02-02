let ir = 0
basic.forever(function () {
  ir = ir1838.readValueIR(ir1838.ValueIR.RawData, ir1838.PinKit.P1)
  if (ir != 0) {
    if (ir == 4278255360) {
      serial.writeLine("Servo P0 angle 0")
      pins.servoWritePin(AnalogPin.P0, 0)
    } else if (ir == 4261543680) {
      serial.writeLine("Servo P0 angle 90")
      pins.servoWritePin(AnalogPin.P0, 90)
    } else if (ir == 4244832000) {
      serial.writeLine("Servo P0 angle 180")
      pins.servoWritePin(AnalogPin.P0, 180)
    } else if (ir == 4144561920) {
      serial.writeLine("Servo P12 angle 0")
      pins.servoWritePin(AnalogPin.P12, 0)
    } else if (ir == 4127850240) {
      serial.writeLine("Servo P12 angle 90")
      pins.servoWritePin(AnalogPin.P12, 90)
    } else if (ir == 4111138560) {
      serial.writeLine("Servo P12 angle 180")
      pins.servoWritePin(AnalogPin.P12, 180)
    }
  }
})
