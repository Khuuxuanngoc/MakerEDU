// Giá trị của "xúc xắc"
let random = 0

// Khi nhấn nút (P0) sẽ đổ "xúc xắc"
input.onPinPressed(TouchPin.P0, function () {
  basic.showLeds(`
        . . . . .
        . . . . .
        . . . . .
        . . . . .
        . . . . .
        `)
  // Lấy một số ngẫu nhiên trong khoảng 1 đến 6
  random = randint(1, 6)

  // Cho hiển thị mặt "xúc xắc" theo số tương ứng
  if (random == 1) {
    basic.showLeds(`
            . . . . .
            . . . . .
            . . # . .
            . . . . .
            . . . . .
            `)
  } else if (random == 2) {
    basic.showLeds(`
            . . # . .
            . . . . .
            . . . . .
            . . . . .
            . . # . .
            `)
  } else if (random == 3) {
    basic.showLeds(`
            . . . . #
            . . . . .
            . . # . .
            . . . . .
            # . . . .
            `)
  } else if (random == 4) {
    basic.showLeds(`
            # . . . #
            . . . . .
            . . . . .
            . . . . .
            # . . . #
            `)
  } else if (random == 5) {
    basic.showLeds(`
            # . . . #
            . . . . .
            . . # . .
            . . . . .
            # . . . #
            `)
  } else if (random == 6) {
    basic.showLeds(`
            # . . . #
            . . . . .
            # . . . #
            . . . . .
            # . . . #
            `)
  }
})
