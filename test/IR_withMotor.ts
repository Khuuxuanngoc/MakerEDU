let ir = 0
basic.forever(function () {
  ir = ir1838.readValueIR(ir1838.ValueIR.RawData, ir1838.PinKit.P0)
  if (ir != 0) {
    if (ir == 4278255360) {
      serial.writeLine("ON all motor 100%")
      l9110.controlMotor(l9110.Motor.MotorA, l9110.Rotate.Forward, 100)
      l9110.controlMotor(l9110.Motor.MotorB, l9110.Rotate.Forward, 100)
    } else if (ir == 4261543680) {
      serial.writeLine("Motor A run 70%")
      l9110.controlMotor(l9110.Motor.MotorA, l9110.Rotate.Forward, 70)
    } else if (ir == 4244832000) {
      serial.writeLine("Motor A run 40%")
      l9110.controlMotor(l9110.Motor.MotorA, l9110.Rotate.Forward, 40)
    } else if (ir == 4144561920) {
      serial.writeLine("OFF all Motor")
      l9110.pauseMotor(l9110.Motor.MotorA)
      l9110.pauseMotor(l9110.Motor.MotorB)
    } else if (ir == 4127850240) {
      serial.writeLine("Motor B run 70%")
      l9110.controlMotor(l9110.Motor.MotorB, l9110.Rotate.Forward, 70)
    } else if (ir == 4111138560) {
      serial.writeLine("Motor B run 40%")
      l9110.controlMotor(l9110.Motor.MotorB, l9110.Rotate.Forward, 40)
    }
  }
})
