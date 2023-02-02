basic.forever(function () {
  l9110.controlMotor(l9110.Motor.MotorA, l9110.Rotate.Forward, 100)
  l9110.controlMotor(l9110.Motor.MotorB, l9110.Rotate.Forward, 100)
  basic.showLeds(`
        . . # . .
        . # # # .
        # . # . #
        . . # . .
        . . # . .
        `)
  basic.pause(3000)
  l9110.controlMotor(l9110.Motor.MotorA, l9110.Rotate.Backward, 30)
  l9110.controlMotor(l9110.Motor.MotorB, l9110.Rotate.Backward, 30)
  basic.showLeds(`
        . . # . .
        . . # . .
        # . # . #
        . # # # .
        . . # . .
        `)
  basic.pause(3000)
  l9110.pauseMotor(l9110.Motor.MotorA)
  l9110.pauseMotor(l9110.Motor.MotorB)
  basic.showLeds(`
        . . . . .
        . . . . .
        # # # # #
        . . . . .
        . . . . .
        `)
  basic.pause(3000)
})
