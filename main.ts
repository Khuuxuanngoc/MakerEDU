/* ------------------------------------------------------------------------- */
/*                             SENSOR ULTRASONIC                             */
/* ------------------------------------------------------------------------- */

//! pxt-ultraSonic

//% color="#41C0B5" weight=10 icon="\uf161" block="MKE-S01"
namespace ultraSonic {
    export enum PingUnit {
        //% block="(cm)"
        Centimeters,
        //% block="(inches)"
        Inches
    }

    /* --------------------------------------------------------------------- */

    /**
     * Measure the distance by sending a sound wave and get duration the time response (in microseconds)
     * @param unit desired conversion unit
     * @param maxCmDistance maximum distance in centimeters (default is 300)
     * @param echo echo pin
     * @param trig trigger pin
     */
    //% block="UltraSonic \\| Read distance $unit from EchoPin $echo and TriggerPin $trig"
    //% unit.defl=PingUnit.Centimeters
    //% echo.defl=DigitalPin.P14 echo.fieldEditor="gridpicker" echo.fieldOptions.columns=4
    //% trig.defl=DigitalPin.P15 trig.fieldEditor="gridpicker" trig.fieldOptions.columns=4
    //% inlineInputMode=inline
    export function readDistance(unit: PingUnit, maxCmDistance = 300, echo: DigitalPin, trig: DigitalPin): number {
        /* Send pulse */
        pins.setPull(trig, PinPullMode.PullNone);
        pins.digitalWritePin(trig, 0);  // Clears the TriggerPin condition
        control.waitMicros(2);
        pins.digitalWritePin(trig, 1);  // Sets the TriggerPin HIGH (ACTIVE) for 10us
        control.waitMicros(10);
        pins.digitalWritePin(trig, 0);

        /**
         * Read pulse
         * 
         * maxCmDistance * 2
         * ----------------- ~ maxCmDistance * 58
         *     0.034613
         */
        const duration: number = pins.pulseIn(echo, PulseValue.High, maxCmDistance * 58);

        /**
         * Return the distance (cm)
         * 
         *            0.034613   duration
         * duration * -------- ~ --------
         *               2          58
         * 
         * Return the distance (inches)
         *            0.034613            duration
         * duration * -------- * 0.3937 ~ --------
         *               2                  147
         */
        if (duration == 0)
            return 0;
        switch (unit) {
            case PingUnit.Centimeters: return Math.round(duration * 0.0173065);
            case PingUnit.Inches: return Math.round(duration * 0.0068135);
        }
    }
}

/* ------------------------------------------------------------------------- */
/*                                SENSOR DHT11                               */
/* ------------------------------------------------------------------------- */

//! pxt-dht11

//% color="#41C0B5" weight=9 icon="\uf043" block="MKE-S14"
namespace dht11 {
    export enum TemperatureType {
        //% block="°C"
        Celsius,
        //% block="°F"
        Fahrenheit
    }

    /* --------------------------------------------------------------------- */

    const DHT11_SAMPLE_TIME = 2000; // 2,000 (ms)
    const DHT11_TIMEOUT = 100;      // 100 (us)

    let _startTime = 0;
    let _readSuccessful = false;
    let _lastreadtime = input.runningTime() - DHT11_SAMPLE_TIME;

    let _temperature = 0;
    let _humidity = 0;

    const buffer: boolean[] = [false, false, false, false, false, false, false, false,
        false, false, false, false, false, false, false, false,
        false, false, false, false, false, false, false, false,
        false, false, false, false, false, false, false, false,
        false, false, false, false, false, false, false, false];
    const data: number[] = [0, 0, 0, 0, 0];

    /* --------------------------------------------------------------------- */

    export function read(sig: DigitalPin): boolean {
        /**
         * Check if sensor was read less than 2 seconds ago
         * And return early to use last reading
         */
        if ((input.runningTime() - _lastreadtime) < DHT11_SAMPLE_TIME) {
            return _readSuccessful;     // Check last correct measurement
        }
        _lastreadtime = input.runningTime();

        /* Clear all data in array */
        for (let i = 0; i < 40; i++) buffer[i] = false;
        data[0] = data[1] = data[2] = data[3] = data[4] = 0;

        /* 1. Start Signal */
        pins.digitalWritePin(sig, 0);   // Set data line LOW
        basic.pause(18);                // At least 18ms

        /* 2. End the "Start Signal" */
        pins.setPull(sig, PinPullMode.PullUp);
        pins.digitalReadPin(sig);
        control.waitMicros(30);         // Delay a moment (20us - 40us) to let sensor pull data line LOW

        /* 3. DHT Response */
        _startTime = control.micros();
        while (pins.digitalReadPin(sig) === 0) {        // LOW 80us
            if (control.micros() - _startTime > DHT11_TIMEOUT) break;
        }
        _startTime = control.micros();
        while (pins.digitalReadPin(sig) === 1) {        // HIGH 80us
            if (control.micros() - _startTime > DHT11_TIMEOUT) break;
        }

        /* 4. Read Data - 40 bit */
        for (let dataBits = 0; dataBits < 40; dataBits++) {
            _startTime = control.micros();
            while (pins.digitalReadPin(sig) === 0) {    // LOW 50us
                if (control.micros() - _startTime > DHT11_TIMEOUT) break;
            }
            /**
             * If sensor still pull up data pin after 28 us it means 1, otherwise 0
             * 
             * Data 1 : HIGH 70us
             * Data 0 : LOW (26us - 28us)
             */
            _startTime = control.micros();
            control.waitMicros(28);
            if (pins.digitalReadPin(sig) === 1) {
                buffer[dataBits] = true;
                while (pins.digitalReadPin(sig) === 1) {
                    if (control.micros() - _startTime > DHT11_TIMEOUT) break;
                }
            }
        }

        /**
         * Convert byte number array to integer
         * The ** operator is exponentiation 
         */
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 8; j++) {
                if (buffer[8 * i + j] === true) {
                    data[i] += 2 ** (7 - j);
                }
            }
        }

        //! Use for Debug
        // serial.writeNumber(data[0]); serial.writeLine(" [0]");
        // serial.writeNumber(data[1]); serial.writeLine(" [1]");
        // serial.writeNumber(data[2]); serial.writeLine(" [2]");
        // serial.writeNumber(data[3]); serial.writeLine(" [3]");
        // serial.writeNumber(data[4]); serial.writeLine(" [4]");

        /* 5. Verify Checksum */
        if (((data[0] + data[1] + data[2] + data[3]) & 0xFF) === data[4]) {
            _humidity = data[0] + data[1] * 0.1;
            _temperature = data[2] + data[3] * 0.1;
            _readSuccessful = true;
        } else {
            if (data[0] == 255 &&
                data[1] == 255 &&
                data[2] == 255 &&
                data[3] == 255 &&
                data[4] == 255) {
                _readSuccessful = false;
            } else {
                _readSuccessful = true;
            }
        }
        return _readSuccessful;
    }

    /* --------------------------------------------------------------------- */

    /**
     * Read the ambient air temperature
     * @param sig signal pin
     * @param unit desired conversion unit
     */
    //% block="DHT11 \\| Read temperature from pin $sig in degree $unit"
    //% sig.defl=DigitalPin.P8 sig.fieldEditor="gridpicker" sig.fieldOptions.columns=4
    //% unit.defl=TemperatureType.Celsius
    //% inlineInputMode=inline
    //% weight=2
    export function readTemperature(sig: DigitalPin, unit: TemperatureType): number {
        let t = 0;
        if (read(sig)) {
            (unit == TemperatureType.Celsius) ? (t = _temperature) : (t = _temperature * 1.8 + 32);
        }
        return t;
    }

    /**
     * Read ambient air humidity
     * @param sig signal pin
     */
    //% block="DHT11 \\| Read air humidity (\\%) from pin $sig"
    //% sig.defl=DigitalPin.P8 sig.fieldEditor="gridpicker" sig.fieldOptions.columns=4
    //% unit.defl=TemperatureType.Celsius
    //% inlineInputMode=inline
    //% weight=1
    export function readHumidity(sig: DigitalPin): number {
        let h = 0;
        if (read(sig)) {
            h = _humidity;
        }
        return h;
    }
}

/* ------------------------------------------------------------------------- */
/*                               SENSOR DS18B20                              */
/* ------------------------------------------------------------------------- */

//! pxt-ds18b20

//% color="#41C0B5" weight=8 icon="\uf2c9" block="MKE-S15"
namespace ds18b20 {
    export enum TemperatureType {
        //% block="°C"
        Celsius,
        //% block="°F"
        Fahrenheit
    }

    /* --------------------------------------------------------------------- */

    //% shim=ds18b20::temperature
    export function temperature(sig: DigitalPin): number {
        return 999;
    }

    /* --------------------------------------------------------------------- */

    /**
     * Read the ambient air temperature
     * @param sig signal pin
     * @param unit desired conversion unit
     */
    //% block="DS18B20 \\| Read temperature from pin $sig in degree $unit"
    //% sig.defl=DigitalPin.P8 sig.fieldEditor="gridpicker" sig.fieldOptions.columns=4
    //% unit.defl=TemperatureType.Celsius
    //% inlineInputMode=inline
    export function readTemperature(sig: DigitalPin, unit: TemperatureType): number {
        let t = temperature(sig);
        if (t == 999) {
            return 0;
        } else {
            if (unit == TemperatureType.Celsius) {
                return t;
            } else {
                return t * 1.8 + 32;
            }
        }
    }
}

/* ------------------------------------------------------------------------- */
/*                               MODULE BUZZER                               */
/* ------------------------------------------------------------------------- */

//! pxt-buzzer

// //% color="#FEBC68" weight=7 icon="\uf0f3" block="MKE-M03"
// namespace buzzer {
//     //% block
//     export function playNote() {
//         //
//     }
// }

/* ------------------------------------------------------------------------- */
/*                                 MODULE LCD                                */
/* ------------------------------------------------------------------------- */

//! pxt-lcd

//% color="#FEBC68" weight=6 icon="\uf26c" block="MKE-M07,08"
//% groups="['Display', 'Clean']"
namespace lcd {
    /**
     * Driver PCF8574
     * 0x27 (39) - default
     */
    export enum address {
        //% block="0x27 (39)"
        add39 = 39,
        //% block="0x26 (38)"
        add38 = 38,
        //% block="0x25 (37)"
        add37 = 37,
        //% block="0x24 (36)"
        add36 = 36,
        //% block="0x23 (35)"
        add35 = 35,
        //% block="0x22 (34)"
        add34 = 34,
        //% block="0x21 (33)"
        add33 = 33,
        //% block="0x20 (32)"
        add32 = 32
    }

    /* https://mil.ufl.edu/3744/docs/lcdmanual/characterset.html */
    export enum symbols {
        //% block="¥"
        sym01 = 92,
        //% block="→"
        sym02 = 126,
        //% block="←"
        sym03 = 127,
        //% block="⌜"
        sym04 = 162,
        //% block="⌟"
        sym05 = 163,
        //% block="·"
        sym06 = 165,
        //% block="°"
        sym07 = 223,
        //% block="⎷"
        sym08 = 232,
        //% block="∞"
        sym09 = 243,
        //% block="Ω"
        sym10 = 244,
        //% block="Σ"
        sym11 = 246,
        //% block="π"
        sym12 = 247,
        //% block="÷"
        sym13 = 253
    }

    /* --------------------------------------------------------------------- */

    /**
     * D7 | D6 | D5 | D4 | xx | EN | RW | RS    <-> LCD
     * P7   P6   P5   P4   P3   P2   P1   P0    <-> I2C
     *
     * EN : Starts Data Read/Write
     * RW : Selects Read (1) or Write (0)
     * RS : Selects Registers
     *      | 0 = Instruction Register (IR), for Write "Busy Flag (BF)"
     *      |     Address Counter (AC), for Read
     *      | 1 = Data Register (DR), for Write and Read
     *
     * 0x3F (63) : PCF8574A
     * 0x27 (39) : PCF8574
     */
    let _i2cAddr = 39;

    /**
     * RS | RW | D7 | D6 | D5 | D4 | D3 | D2 | D1 | D0  <-> Instructions
     * 0    0    0    0    0    0    1    D    C    B   <-> Display on/off control
     *                                                      D = 0; Display off
     *                                                      C = 0; Cursor off
     *                                                      B = 0; Blinking off
     * BackLight    : 0x00
     * No BackLight : 0x08
     */
    let _BK: number;

    /**
     * Register Select Bit
     *
     * RS is the LSB in protocol I2C
     * So that means when RS = 0x00, sends a command (IR)
     * Otherwise when RS = 0x01, sends data (DR)
     */
    let _RS: number;

    const _initOneTime: boolean[] = [false, false, false, false, false, false, false, false];

    /* --------------------------------------------------------------------- */

    /* Send via I2C */
    export function setReg(d: number) {
        pins.i2cWriteNumber(_i2cAddr, d, NumberFormat.Int8LE);
        control.waitMicros(50);//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    }

    /* Send data to I2C bus */
    export function set(d: number) {
        d = d & 0xF0;
        d = d + _BK + _RS;
        setReg(d);
        setReg(d + 0x04);
        setReg(d);
    }

    /* --------------------------------------------------------------------- */

    /* Send command (IR) */
    export function cmd(d: number) {
        _RS = 0x00;
        set(d);
        set(d << 4);
    }

    /* Send data (DR) */
    export function dat(d: number) {
        _RS = 0x01;
        set(d);
        set(d << 4);
    }

    /* --------------------------------------------------------------------- */

    /* LCD initialization */
    export function initLCD(addr: number) {
        _i2cAddr = addr;
        _BK = 0x08;
        _RS = 0x00;

        // delay(50);
        basic.pause(50);

        // expanderWrite(_backlightval);
        // _backlightval = LCD_NOBACKLIGHT;
        // 0x00 | 0x00 = 0x00 //I2C, delay 1s
        setReg(0x00);
        basic.pause(1000);

        //put the LCD into 4 bit mode
        // we start in 8bit mode, try to set 4 bit mode
        // write4bits(0x03 << 4);  //0x30
        // expanderWrite(0x30);
        setReg(0x30);
        // pulseEnable(0x30);
        // EN = 0x04
        // ~EN = 0xFB
        setReg(0x34); control.waitMicros(1);
        setReg(0x30); control.waitMicros(50);
        // delayMicroseconds(4500); // wait min 4.1ms
        control.waitMicros(4500);
        
        // second try
        // write4bits(0x03 << 4);
        // delayMicroseconds(4500); // wait min 4.1ms
        setReg(0x30);
        setReg(0x34); control.waitMicros(1);
        setReg(0x30); control.waitMicros(50);
        control.waitMicros(4500);
        
        // third go!
        // write4bits(0x03 << 4); 
        // delayMicroseconds(150);
        setReg(0x30);
        setReg(0x34); control.waitMicros(1);
        setReg(0x30); control.waitMicros(50);
        control.waitMicros(150);
        
        // finally, set to 4-bit interface
        // write4bits(0x02 << 4); // 0x20
        // expanderWrite(0x20);
        setReg(0x20);
        // pulseEnable(0x20);
        setReg(0x24); control.waitMicros(1);
        setReg(0x20); control.waitMicros(50);

        // set # lines, font size, etc.
        // command(LCD_FUNCTIONSET | _displayfunction);  // 0x28
        // LCD_FUNCTIONSET = 0x20
        // _displayfunction = 0x08
        // send(0x28, 0); // 0x20 và 0x80
        // write4bits(0x20);
        setReg(0x20);
        setReg(0x24); control.waitMicros(1);
        setReg(0x20); control.waitMicros(50);
        // write4bits(0x80);
        setReg(0x80);
        setReg(0x84); control.waitMicros(1);
        setReg(0x80); control.waitMicros(50);
        
        // turn the display on with no cursor or blinking default
        // _displaycontrol = LCD_DISPLAYON | LCD_CURSOROFF | LCD_BLINKOFF; = 0x04
        // display();
        // command(0x0C);
        // send(0x0C, 0); // 0x00 và 0xC0
        // write4bits(0x00);
        setReg(0x00);
        setReg(0x04); control.waitMicros(1);
        setReg(0x00); control.waitMicros(50);
        // write4bits(0xC0);
        setReg(0xC0);
        setReg(0xC4); control.waitMicros(1);
        setReg(0xC0); control.waitMicros(50);
        
        // clear it off
        // clear();
        // command(LCD_CLEARDISPLAY);// clear display, set cursor position to zero = 0x01
        // send(0x01, 0); // 0x00 và 0x10
        // write4bits(0x00);
        setReg(0x00);
        setReg(0x04); control.waitMicros(1);
        setReg(0x00); control.waitMicros(50);
        // write4bits(0x10);
        setReg(0x10);
        setReg(0x14); control.waitMicros(1);
        setReg(0x10); control.waitMicros(50);
        // delayMicroseconds(2000);  // this command takes a long time!
        basic.pause(2);
        
        // Initialize to default text direction (for roman languages)
        // _displaymode = LCD_ENTRYLEFT | LCD_ENTRYSHIFTDECREMENT;
        // 0x02
        
        // set the entry mode
        // 0x04 | 0x02 = 0x06
        // command(LCD_ENTRYMODESET | _displaymode);
        // send(0x06, 0); // 0x00 và 0x60
        // write4bits(0x00);
        setReg(0x00);
        setReg(0x04); control.waitMicros(1);
        setReg(0x00); control.waitMicros(50);
        // write4bits(0x60);
        setReg(0x60);
        setReg(0x64); control.waitMicros(1);
        setReg(0x60); control.waitMicros(50);
        
        // home();
        // command(LCD_RETURNHOME);  // set cursor position to zero = 0x02
        // send(0x02, 0); // 0x00 và 0x20
        // write4bits(0x00);
        setReg(0x00);
        setReg(0x04); control.waitMicros(1);
        setReg(0x00); control.waitMicros(50);
        // write4bits(0x20);
        setReg(0x20);
        setReg(0x24); control.waitMicros(1);
        setReg(0x20); control.waitMicros(50);
        // delayMicroseconds(2000);  // this command takes a long time!
        basic.pause(2);


































        // cmd(0x33);  // Set 4bit mode
        // basic.pause(5);

        // set(0x30);
        // basic.pause(5);

        // set(0x20);
        // basic.pause(5);

        // cmd(0x28);  // Set mode
        // cmd(0x0C);
        // cmd(0x06);
        // cmd(0x01);  // Clear
    }

    /* --------------------------------------------------------------------- */

    /**
     * Show a string into LCD at a given position
     * @param addr is I2C address for LCD
     * @param text is the string will be shown
     * @param col is LCD column position
     * @param row is LCD row position
     */
    //% block="LCD address $addr \\| Print $text at Column $col and Row $row"
    //% addr.defl=address.add39 addr.fieldEditor="gridpicker" addr.fieldOptions.columns=2
    //% text.defl="MakerEDU"
    //% col.defl=1 col.min=1 col.max=20
    //% row.defl=1 row.min=1 row.max=4
    //% inlineInputMode=inline
    //% weight=3
    //% group="Display"
    export function displayText(addr: address, text: string, col: number, row: number) {
        /* Make sure to initialize each LCD once */
        if (!_initOneTime[addr - 32]) {
            initLCD(addr);
            _initOneTime[addr - 32] = true;
        }

        _i2cAddr = addr;
        //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        /* Set cursor position to print */
        let cursor: number;
        switch (row - 1) {
            case 0: cursor = 0x80; break;
            case 1: cursor = 0xC0; break;
            case 2: cursor = 0x94; break;   // 0x80 + 20
            case 3: cursor = 0xD4;          // 0xC0 + 20
        }
        cursor += (col - 1);
        cmd(cursor);

        /* Do not print overflow character */
        let overflow: number;
        if (text.length > 20)
            overflow = 20;
        else
            overflow = text.length;
        for (let i = 0; i < overflow; i++)
            dat(text.charCodeAt(i));
        //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    }

    /**
     * Select special character to print on the LCD screen
     * @param sym is special character you choose
     */
    //% block="Special character $sym"
    //% sym.defl=symbols.sym01 sym.fieldEditor="gridpicker" sym.fieldOptions.columns=2
    //% inlineInputMode=inline
    //% weight=2
    //% group="Display"
    export function displaySymbol(sym: symbols): string {
        return String.fromCharCode(sym);
    }

    /**
     * Clear all display content
     * @param addr is the I2C address for LCD
     */
    //% block="LCD address $addr \\| Clean all"
    //% addr.defl=address.add39 addr.fieldEditor="gridpicker" addr.fieldOptions.columns=2
    //% inlineInputMode=inline
    //% weight=1
    //% group="Clean"
    export function clearScreen(addr: address) {
        /* Make sure to initialize each LCD once */
        if (!_initOneTime[addr - 32]) {
            initLCD(addr);
            _initOneTime[addr - 32] = true;
        }

        _i2cAddr = addr;
        cmd(0x01);
    }
}






















































/* ------------------------------------------------------------------------- */
/*                               MODULE DS3231                               */
/* ------------------------------------------------------------------------- */

//! pxt-ds3231

//% color="#FEBC68" weight=5 icon="\uf073" block="MKE-M09"
namespace ds3231 {
    //% block
    export function getTime(): number {
        return 0;
    }

    //% block
    export function setTime() {
        //
    }
}

/* ------------------------------------------------------------------------- */
/*                          MODULE DRIVER MOTOR I2C                          */
/* ------------------------------------------------------------------------- */

//! pxt-driver

//% color="#FEBC68" weight=4 icon="\u26a1" block="MKE-M10"
namespace driver {
    //% block
    export function controlMotor() {
        //
    }

    //% block
    export function controlServo() {
        //
    }
}






















































/* ------------------------------------------------------------------------- */
/*                             MODULE MP3 PLAYER                             */
/* ------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------- */

//! pxt-mp3Player

//% color="#FEBC68" weight=3 icon="\uf001" block="MKE-M11"
namespace mp3Player {
    //% block
    export function helloWorld() {
        //
    }
}

/* ------------------------------------------------------------------------- */
/*                               MODULE IR1838                               */
/* ------------------------------------------------------------------------- */

//! pxt-ir1838

//% color="#FEBC68" weight=2 icon="\u26a1" block="MKE-M14"
namespace ir1838 {
    //% block
    export function helloWorld() {
        //
    }
}

/* ------------------------------------------------------------------------- */
/*                              MODULE BLUETOOTH                             */
/* ------------------------------------------------------------------------- */

//! pxt-bleDabble

//% color="#FEBC68" weight=1 icon="\u26a1" block="MKE-M15"
namespace bleDabble {
    //% block
    export function helloWorld() {
        //
    }
}
