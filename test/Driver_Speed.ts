let speed = 0
basic.forever(function () {
  speed = 0
  basic.showLeds(`
        . . # . .
        . # # # .
        # . # . #
        . . # . .
        . . # . .
        `)
  for (let index = 0; index < 100; index++) {
    speed += 1
    l9110.controlMotor(l9110.Motor.MotorA, l9110.Rotate.Forward, speed)
    basic.pause(100)
  }
  basic.showLeds(`
        . . # . .
        . . # . .
        # . # . #
        . # # # .
        . . # . .
        `)
  for (let index = 0; index < 100; index++) {
    speed += -1
    l9110.controlMotor(l9110.Motor.MotorA, l9110.Rotate.Forward, speed)
    basic.pause(100)
  }
})
