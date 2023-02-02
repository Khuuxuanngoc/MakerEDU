let ir = 0
basic.forever(function () {
    ir = ir1838.readValueIR(ir1838.ValueIR.RawData, ir1838.PinKit.P0)
    if (ir != 0) {
        if (ir == 4278255360) {
            serial.writeLine("ON/OFF")
        } else if (ir == 4261543680) {
            serial.writeLine("Intermittent")
        } else if (ir == 4244832000) {
            serial.writeLine("Continuous")
        } else if (ir == 4144561920) {
            serial.writeLine("Timing")
        } else if (ir == 4127850240) {
            serial.writeLine("Big/Small")
        } else if (ir == 4111138560) {
            serial.writeLine("Light")
        }
    }
})
