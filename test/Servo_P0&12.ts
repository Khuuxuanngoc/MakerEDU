let angle = 0
basic.forever(function () {
  for (let index = 0; index < 180; index++) {
    angle += 1
    pins.servoWritePin(AnalogPin.P0, angle)
    pins.servoWritePin(AnalogPin.P12, angle)
    basic.pause(20)
  }
  for (let index = 0; index < 180; index++) {
    angle += -1
    pins.servoWritePin(AnalogPin.P0, angle)
    pins.servoWritePin(AnalogPin.P12, angle)
    basic.pause(20)
  }
})
