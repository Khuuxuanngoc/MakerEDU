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
    export enum Address {
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
    export enum Symbols {
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
    let _i2cAddr = Address.add39;

    /**
     * RS | RW | D7 | D6 | D5 | D4 | D3 | D2 | D1 | D0  <-> Instructions
     * 0    0    0    0    0    0    1    D    C    B   <-> Display on/off control
     *                                                      D = 0; Display off
     *                                                      C = 0; Cursor off
     *                                                      B = 0; Blinking off
     * BackLight    : 0x00
     * No BackLight : 0x08
     */
    let _BK = 0x00;

    /**
     * Register Select Bit
     *
     * RS is the LSB in protocol I2C
     * So that means when RS = 0x00, sends a command (IR)
     * Otherwise when RS = 0x01, sends data (DR)
     */
    let _RS = 0x00;

    const _initOneTime: boolean[] = [false, false, false, false, false, false, false, false];

    /* --------------------------------------------------------------------- */

    /* Send via I2C */
    export function setReg(d: number) {
        pins.i2cWriteNumber(_i2cAddr, d, NumberFormat.UInt8LE);
    }

    /* Send data to I2C bus */
    export function set(d: number) {
        d = d & 0xF0;
        d = d + _BK + _RS;

        setReg(d);              // expanderWrite()
        /**
         * pulseEnable()
         * 
         * EN is the 3rd bit in the I2C protocol
         * So when EN high = 0x04, opposite EN low = 0x00
         */
        setReg(d + 0x04);       // EN high
        control.waitMicros(1);  // Enable pulse must be >450ns
        setReg(d);              // EN low
        control.waitMicros(50); // Commands need > 37us to settle
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
        _BK = 0x00;
        _RS = 0x00;

        /**
         * INITIALIZATION SPECIFICATION!
         * 
         * According to datasheet, we need at least 40ms after power rises above 2.7V
         */
        basic.pause(50);

        /**
         * Now we pull both RS and R/W low to begin commands
         * Reset expanderand turn backlight off
         */
        setReg(0x00);
        basic.pause(1000);

        /**
         * Put the LCD into 4-bit mode
         * We start in 8-bit mode, try to set 4-bit mode
         */
        set(0x30);                  //
        control.waitMicros(4500);   // Wait min 4.1ms
        set(0x30);                  // Second try!
        control.waitMicros(4500);   // Wait min 4.1ms
        set(0x30);                  // Third go!
        control.waitMicros(150);    //
        set(0x20);                  // Finally, set to 4-bit interface

        /* Set # lines, font size, etc. */
        cmd(0x28);

        /* Turn the display on with no cursor or blinking default */
        cmd(0x0C);

        /* Clear it off */
        cmd(0x01);
        basic.pause(2); // This command takes a long time!

        /**
         * Initialize to default text direction (for roman languages)
         * Then set the entry mode
         */
        cmd(0x06);

        /* Go home ... set cursor position to zero */
        cmd(0x02);
        basic.pause(2); // This command takes a long time!

        _BK = 0x08;
        _RS = 0x00;
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
    //% addr.defl=Address.add39 addr.fieldEditor="gridpicker" addr.fieldOptions.columns=2
    //% text.defl="MakerEDU"
    //% col.defl=1 col.min=1 col.max=20
    //% row.defl=1 row.min=1 row.max=4
    //% inlineInputMode=inline
    //% weight=3
    //% group="Display"
    export function displayText(addr: Address, text: string, col: number, row: number) {
        /* Make sure to initialize each LCD once */
        if (!_initOneTime[addr - 32]) {
            initLCD(addr);
            _initOneTime[addr - 32] = true;
        }

        _i2cAddr = addr;

        /* Set cursor position to print */
        let cursor: number;
        switch (row - 1) {
            /**
             * RS | RW | D7 | D6 | D5 | D4 | D3 | D2 | D1 | D0  <-> Instructions
             * 0    0    1    ADD  ADD  ADD  ADD  ADD  ADD  ADD <-> Set DDRAM address
             * 
             * DDRAM address (hexadecimal):
             * 
             *          C00 C01 C02 C03 C04 C05 C06 C07 C08 C09 C10 C11 C12 C13 C14 C15 C16 C17 C18 C19
             *      -------------------------------------------------------------------------------------
             * R00  |   00  01  02  03  04  05  06  07  08  09  0A  0B  0C  0D  0E  0F  10  11  12  13  |
             * R01  |   40  41  42  43  44  45  46  47  48  49  4A  4B  4C  4D  4E  4F  50  51  52  53  |
             * R02  |   14  15  16  17  18  19  1A  1B  1C  1D  1E  1F  20  21  22  23  24  25  26  27  |
             * R03  |   54  55  56  57  58  59  5A  5B  5C  5D  5E  5F  60  61  62  63  64  65  66  67  |
             *      -------------------------------------------------------------------------------------
             */
            case 0: cursor = 0x80; break;
            case 1: cursor = 0xC0; break;   // 0x80 + 0x40
            case 2: cursor = 0x94; break;   // 0x80 + 0x14
            case 3: cursor = 0xD4; break;   // 0xC0 + 0x14
        }
        cursor += (col - 1);
        cmd(cursor);

        /* Do not print overflow character */
        let overflow: number;
        if (text.length <= 20 - (col - 1))
            overflow = text.length;
        else
            overflow = 20 - (col - 1);
        for (let i = 0; i < overflow; i++)
            dat(text.charCodeAt(i));
    }

    /**
     * Select special character to print on the LCD screen
     * @param sym is special character you choose
     */
    //% block="Special character $sym"
    //% sym.defl=Symbols.sym01 sym.fieldEditor="gridpicker" sym.fieldOptions.columns=1
    //% inlineInputMode=inline
    //% weight=2
    //% group="Display"
    export function displaySymbol(sym: Symbols): string {
        return String.fromCharCode(sym);
    }

    /**
     * Clear all display content
     * @param addr is the I2C address for LCD
     */
    //% block="LCD address $addr \\| Clean all"
    //% addr.defl=Address.add39 addr.fieldEditor="gridpicker" addr.fieldOptions.columns=2
    //% inlineInputMode=inline
    //% weight=1
    //% group="Clean"
    export function clearScreen(addr: Address) {
        /* Make sure to initialize each LCD once */
        if (!_initOneTime[addr - 32]) {
            initLCD(addr);
            _initOneTime[addr - 32] = true;
        }

        _i2cAddr = addr;
        /**
         * RS | RW | D7 | D6 | D5 | D4 | D3 | D2 | D1 | D0  <-> Instructions
         * 0    0    0    0    0    0    0    0    0    1   <-> Clear display
         */
        cmd(0x01);
        basic.pause(2); // This command takes a long time!
    }
}

/* ------------------------------------------------------------------------- */
/*                               MODULE DS3231                               */
/* ------------------------------------------------------------------------- */

//! pxt-ds3231

//% color="#FEBC68" weight=5 icon="\uf017" block="MKE-M09"
//% groups="['Get Info Time (Data)', 'Get Info Time (Text)', 'Setting Time', 'Alarm']"
namespace ds3231 {
    export enum Calendar {
        //% block="Day"
        Day,
        //% block="Month"
        Month,
        //% block="Year"
        Year
    }

    export enum Clock {
        //% block="Hour"
        Hour,
        //% block="Minute"
        Minute,
        //% block="Second"
        Second
    }

    export enum Month {
        //% block="Jan"
        Jan = 1,
        //% block="Feb"
        Feb = 2,
        //% block="Mar"
        Mar = 3,
        //% block="Apr"
        Apr = 4,
        //% block="May"
        May = 5,
        //% block="Jun"
        Jun = 6,
        //% block="Jul"
        Jul = 7,
        //% block="Aug"
        Aug = 8,
        //% block="Sep"
        Sep = 9,
        //% block="Oct"
        Oct = 10,
        //% block="Nov"
        Nov = 11,
        //% block="Dec"
        Dec = 12
    }

    export enum Alarm {
        //% block="one time"
        OneTime = 1,
        //% block="always"
        Always = 0
    }

    /**
     * Note: the value "Day of the Week" store in DS3231
     * Have value from [1 - 7], with value 1 mean Sunday, 2 is Monday, and so on ...
     * 
     *      ENUM - DS3231  - ISO_8601 (the Week begin Monday, not Sunday)
     * Sun  0    - 1       - 7
     * Mon  1    - 2       - 1
     * Tue  2    - 3       - 2
     * Wed  3    - 4       - 3
     * Thu  4    - 5       - 4
     * Fri  5    - 6       - 5
     * Sat  6    - 7       - 6
     */
    export enum DayOfWeek {
        Sun, Mon, Tue, Wed, Thu, Fri, Sat
    }

    const alarm: number[] = [-1, -1];   // [Hour:Minute]
    let typeAlarm = Alarm.OneTime;      // Alarm one time!

    /* --------------------------------------------------------------------- */

    const DS3231_I2C_ADDR = 0x68;

    const DS3231_REG_SECOND = 0x00;
    const DS3231_REG_MINUTE = 0x01;
    const DS3231_REG_HOUR = 0x02;
    const DS3231_REG_DAY = 0x03;
    const DS3231_REG_DATE = 0x04;
    const DS3231_REG_MONTH = 0x05;
    const DS3231_REG_YEAR = 0x06;

    /* --------------------------------------------------------------------- */

    /* Set a DS3231 reg */
    export function setReg(reg: number, dat: number) {
        let buf = pins.createBuffer(2);

        buf[0] = reg;
        buf[1] = dat;

        pins.i2cWriteBuffer(DS3231_I2C_ADDR, buf);
    }

    /* Get a DS3231 reg value */
    export function regValue(reg: number): number {
        pins.i2cWriteNumber(DS3231_I2C_ADDR, reg, NumberFormat.UInt8LE);

        return pins.i2cReadNumber(DS3231_I2C_ADDR, NumberFormat.UInt8LE);
    }

    /* --------------------------------------------------------------------- */

    /**
     * Convert a "Binary Coded Decimal" value to Binary
     * 
     * RTC stores time/date values as BCD
     * 
     * Old Recipe:  ( BCD >> 4 ) * 10 + ( BCD & 0x0F )
     * New Recipe:  BCD - 6 * ( BCD >> 4 )
     */
    export function bcdToDec(bcd: number): number {
        return bcd - 6 * (bcd >> 4);
    }

    /**
     * Convert a Binary value to BCD format for the RTC registers
     * 
     * The format BCD does not store value DEC in normal format of Binary
     * It use 4 bit corresponding for 10 digit "0-9" that is 10 number from "0-9"
     * With 4bit MSB for "Digit x10", and 4 bit LSB for "Digit x1"
     * 
     * Old Recipe:  ( ( DEC / 10 ) << 4 ) + ( DEC % 10 )
     * New Recipe:  DEC + 6 * ( DEC / 10 )
     */
    export function decToBcd(dec: number): number {
        return dec + 6 * Math.idiv(dec, 10);
    }

    /* --------------------------------------------------------------------- */

    /**
     * To determine this "Date" of Month of Year is what "Day of the Week"?
     * The Week begin Sunday with number 0
     * 
     * Way Tomohiko Sakamoto’s used the "Doomsday Algorithm" to determine the Day of the Week!
     */
    export function getDayOfWeek(y: number, m: number, d: number): number {
        const monthTable: number[] = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];

        y -= ((m < 3) ? 1 : 0);

        return ((y + Math.idiv(y, 4) - Math.idiv(y, 100) + Math.idiv(y, 400) + monthTable[m - 1] + d) % 7);
    }

    /**
     * Mapping the value "Day" from "Tomohiko Sakamoto" to "ISO_8601"
     */
    export function getDS3231DayOfWeek(y: number, m: number, d: number): number {
        switch (getDayOfWeek(y, m, d)) {
            case DayOfWeek.Sun: return 1;
            case DayOfWeek.Mon: return 2;
            case DayOfWeek.Tue: return 3;
            case DayOfWeek.Wed: return 4;
            case DayOfWeek.Thu: return 5;
            case DayOfWeek.Fri: return 6;
            case DayOfWeek.Sat: return 7;
            default: return 0;
        }
    }

    /* --------------------------------------------------------------------- */

    //% shim=ds3231::get_DATE
    export function get_DATE(): string {
        return "?";
    }

    //% shim=ds3231::get_TIME
    export function get_TIME(): string {
        return "?";
    }

    //! Use for Debug
    // //% block="DS3231 \\| Print DATE"
    // export function print_DATE(): string {
    //     return get_DATE();
    // }

    //! Use for Debug
    // //% block="DS3231 \\| Print TIME"
    // export function print_TIME(): string {
    //     return get_TIME();
    // }

    /* --------------------------------------------------------------------- */

    /**
     * Get Day, Month, Year data from DS3231
     * @param calendar select get data Day, Month or Year
     */
    //% block="DS3231 \\| Get $calendar in Calendar"
    //% calendar.defl=Calendar.Day
    //% inlineInputMode=inline
    //% weight=11
    //% group="Get Info Time (Data)"
    export function getDayMonthYear(calendar: Calendar): number {
        switch (calendar) {
            case Calendar.Day: return bcdToDec(regValue(DS3231_REG_DATE));
            case Calendar.Month: return bcdToDec(regValue(DS3231_REG_MONTH));
            case Calendar.Year: return bcdToDec(regValue(DS3231_REG_YEAR)) + 2000;
        }
    }

    /**
     * Get "Date of Week" data from DS3231
     */
    //% block="DS3231 \\| Get Days of the Week"
    //% inlineInputMode=inline
    //% weight=10
    //% group="Get Info Time (Data)"
    export function getDate(): string {
        switch (regValue(DS3231_REG_DAY)) {
            case 1: return "Sun";
            case 2: return "Mon";
            case 3: return "Tue";
            case 4: return "Wed";
            case 5: return "Thu";
            case 6: return "Fri";
            case 7: return "Sat";
            default: return "---";
        }
    }

    /**
     * Get Hour, Minute, Second data from DS3231
     * @param clock select get data Hour, Minute or Second
     */
    //% block="DS3231 \\| Get $clock in Time now"
    //% clock.defl=Clock.Hour
    //% inlineInputMode=inline
    //% weight=9
    //% group="Get Info Time (Data)"
    export function getHourMinuteSecond(clock: Clock): number {
        switch (clock) {
            case Clock.Hour: return bcdToDec(regValue(DS3231_REG_HOUR));
            case Clock.Minute: return bcdToDec(regValue(DS3231_REG_MINUTE));
            case Clock.Second: return bcdToDec(regValue(DS3231_REG_SECOND));
        }
    }

    /**
     * Get aggregated __DATE__ data
     */
    //% block="DS3231 \\| Get Calendar"
    //% inlineInputMode=inline
    //% weight=8
    //% group="Get Info Time (Text)"
    export function getCalendar(): string {
        let d = bcdToDec(regValue(DS3231_REG_DATE));
        let m = bcdToDec(regValue(DS3231_REG_MONTH));
        let y = bcdToDec(regValue(DS3231_REG_YEAR)) + 2000;

        let t = "";
        t = t + getDate() + ",";
        (d < 10) ? (t = t + "0" + convertToText(d) + "/") : (t = t + convertToText(d) + "/");
        (m < 10) ? (t = t + "0" + convertToText(m) + "/") : (t = t + convertToText(m) + "/");
        t += y;

        return t;
    }

    /**
     * Get aggregated __TIME__ data
     */
    //% block="DS3231 \\| Get Time now"
    //% inlineInputMode=inline
    //% weight=7
    //% group="Get Info Time (Text)"
    export function getTime(): string {
        let h = bcdToDec(regValue(DS3231_REG_HOUR));
        let m = bcdToDec(regValue(DS3231_REG_MINUTE));
        let s = bcdToDec(regValue(DS3231_REG_SECOND));

        let t = "";
        (h < 10) ? (t = t + "0" + convertToText(h) + ":") : (t = t + convertToText(h) + ":");
        (m < 10) ? (t = t + "0" + convertToText(m) + ":") : (t = t + convertToText(m) + ":");
        (s < 10) ? (t = t + "0" + convertToText(s)) : (t = t + convertToText(s));

        return t;
    }

    // /**
    //  * !
    //  */
    // //% block="DS3231 \\| Set Date & Time this sketch was compiled"
    // //% inlineInputMode=inline
    // //% weight=6
    // //% group="Setting Time"
    // export function setTime_byCompiled() {
    //     let s = "";

    //     s = get_DATE(); // mmm dd yyyy
    //     let DATE = s.split(" ");
    //     s = get_TIME(); // hh:mm:ss
    //     let TIME = s.split(":");

    //     //! Use for Debug
    //     // serial.writeLine(DATE[1] + "-" + DATE[0] + "-" + DATE[2]);
    //     // serial.writeLine(TIME[0] + ":" + TIME[1] + ":" + TIME[2]);

    //     /* ----------------------------------------------------------------- */

    //     let buf = pins.createBuffer(8);

    //     buf[0] = DS3231_REG_SECOND;
    //     buf[1] = decToBcd(parseInt(TIME[2]));
    //     buf[2] = decToBcd(parseInt(TIME[1]));
    //     buf[3] = decToBcd(parseInt(TIME[0]));
    //     buf[4] = decToBcd(getDS3231DayOfWeek(y, m, d));
    //     buf[5] = decToBcd(d);
    //     buf[6] = decToBcd(m);
    //     buf[7] = decToBcd(y - 2000);

    //     pins.i2cWriteBuffer(DS3231_I2C_ADDR, buf);
    // }

    /**
     * Date & Time settings for DS3231
     * @param day choose Day
     * @param month choose Month
     * @param year choose Year
     * @param hour choose Hour
     * @param minute choose Minute
     */
    //% block="DS3231 \\| Set Day $day Month $month Year $year, $hour Hour : $minute Minute : 0 Second"
    //% day.defl=1 day.min=1 day.max=31
    //% month.defl=Month.Jan
    //% year.defl=2022 year.min=2000 year.max=2099
    //% hour.defl=11 hour.min=0 hour.max=23
    //% minute.defl=30 minute.min=0 minute.max=59
    //% inlineInputMode=inline
    //% weight=5
    //% group="Setting Time"
    export function setTime_byChoose(day: number, month: Month, year: number, hour: number, minute: number) {
        let buf = pins.createBuffer(8);

        buf[0] = DS3231_REG_SECOND;
        buf[1] = decToBcd(0);
        buf[2] = decToBcd(minute);
        buf[3] = decToBcd(hour);
        buf[4] = decToBcd(getDS3231DayOfWeek(year, month, day));
        buf[5] = decToBcd(day);
        buf[6] = decToBcd(month);
        buf[7] = decToBcd(year - 2000);

        pins.i2cWriteBuffer(DS3231_I2C_ADDR, buf);
    }

    /**
     * Set the Date & Time for the DS3231 using the command
     * @param setFullTime install by command according to the syntax "ST-dd/mm/yyyy-hh:mm:ss"
     */
    //% block="DS3231 \\| Setting Date & Time $setFullTime"
    //% setFullTime.defl="ST-15/08/2022-13:13:13"
    //% inlineInputMode=inline
    //% weight=4
    //% group="Setting Time"
    export function setTime_byCommands(setFullTime: string): boolean {
        /**
         * String handling:
         * 
         * The command SetTime input correct is: ST-00/00/0000-00:00:00
         * With value sequence is: ST-Day/Month/Year-Hour:Minute:Second
         */
        if (setFullTime.length == 22) {
            if (setFullTime.includes("ST")) {
                if (setFullTime[2] != '-') return false;
                if (setFullTime[5] != '/') return false;
                if (setFullTime[8] != '/') return false;
                if (setFullTime[13] != '-') return false;
                if (setFullTime[16] != ':') return false;
                if (setFullTime[19] != ':') return false;

                let day = parseInt(setFullTime.substr(3, 2));
                let month = parseInt(setFullTime.substr(6, 2));
                let year = parseInt(setFullTime.substr(9, 4));

                let hour = parseInt(setFullTime.substr(14, 2));
                let minute = parseInt(setFullTime.substr(17, 2));
                let second = parseInt(setFullTime.substr(20, 2));

                /* --------------------------------------------------------- */

                let buf = pins.createBuffer(8);

                buf[0] = DS3231_REG_SECOND;
                buf[1] = decToBcd(second);
                buf[2] = decToBcd(minute);
                buf[3] = decToBcd(hour);
                buf[4] = decToBcd(getDS3231DayOfWeek(year, month, day));
                buf[5] = decToBcd(day);
                buf[6] = decToBcd(month);
                buf[7] = decToBcd(year - 2000);

                pins.i2cWriteBuffer(DS3231_I2C_ADDR, buf);
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    /**
     * Alarm settings for DS3231
     * @param hour choose Hour
     * @param minute choose Minute
     * @param types alarm once or every day
     */
    //% block="DS3231 \\| Set Alarm at $hour Hour : $minute Minute $types"
    //% hour.defl=11 hour.min=0 hour.max=23
    //% minute.defl=30 minute.min=0 minute.max=59
    //% types.defl=Alarm.OneTime
    //% inlineInputMode=inline
    //% weight=3
    //% group="Alarm"
    export function setAlarm_byChoose(hour: number, minute: number, types: Alarm) {
        alarm[0] = hour;
        alarm[1] = minute;
        typeAlarm = types;
    }

    /**
     * Set the Alarm for the DS3231 using the command
     * @param ticks install by command according to the syntax "ST-hh:mm"
     * @param types alarm once or every day
     */
    //% block="DS3231 \\| Setting Alarm $ticks $types"
    //% ticks.defl="SA-15:30"
    //% types.defl=Alarm.OneTime
    //% inlineInputMode=inline
    //% weight=2
    //% group="Alarm"
    export function setAlarm_byCommands(ticks: string, types: Alarm): boolean {
        /**
         * String handling:
         * 
         * The command SetTime input correct is: SA-00:00
         * With value sequence is: SA-Hour:Minute
         */
        if (ticks.length == 8) {
            if (ticks.includes("SA")) {
                if (ticks[2] != '-') return false;
                if (ticks[5] != ':') return false;

                alarm[0] = parseInt(ticks.substr(3, 2));
                alarm[1] = parseInt(ticks.substr(6, 2));
                typeAlarm = types;

                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    /**
     * Update the time to see if it's time for the alarm
     */
    //% block="DS3231 \\| Check Alarm 💤⏰"
    //% inlineInputMode=inline
    //% weight=1
    //% group="Alarm"
    export function checkAlarm(): boolean {
        if (bcdToDec(regValue(DS3231_REG_HOUR)) == alarm[0]) {
            if (bcdToDec(regValue(DS3231_REG_MINUTE)) == alarm[1]) {
                if (typeAlarm == 1) {   // OneTime
                    alarm[0] = alarm[1] = -1;
                }
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }
    }
}

/* ------------------------------------------------------------------------- */
/*                          MODULE DRIVER MOTOR I2C                          */
/* ------------------------------------------------------------------------- */

//! pxt-driver

//% color="#FEBC68" weight=4 icon="\uf018" block="MKE-M10"
//% groups="['Control Motor DC', 'Control Servo', 'GO', 'CROSS', 'TURN', 'STOP', 'MEASURE']"
namespace driver {
    export enum Address {
        //% block="0x40 (64)"
        add64 = 64,
        //% block="0x41 (65)"
        add65 = 65,
        //% block="0x42 (66)"
        add66 = 66,
        //% block="0x43 (67)"
        add67 = 67,
        //% block="0x44 (68)"
        add68 = 68
        // //% block="0x45 (69)"
        // add69 = 69
    }

    export enum Motor {
        //% block="A"
        MotorA = 0,
        //% block="B"
        MotorB = 1
    }

    /**
     * CW:  channel A & B (+) = VIN
     *      channel A & B (-) = GND
     * 
     * CCW: channel A & B (-) = VIN
     *      channel A & B (+) = GND
     */
    export enum Rotate {
        //% block="CW"
        Clockwise = 1,
        //% block="CCW"
        CounterClockwise = 0
    }

    export enum Pause {
        //% block="BRAKE (stop now)"
        Brake = 1,
        //% block="STOP (release)"
        Stop = 0
    }

    export enum Servo {
        //% block="S1"
        Servo1 = 0,
        //% block="S2"
        Servo2 = 1
    }

    /* --------------------------------------------------------------------- */

    /**
     * Pulse range information of each servo:
     * 
     * [0]  pulseMin    : Default 460. Range from 400 to 1,000
     * [1]  pulseMax    : Default 2,350. Range from 2,000 to 2,600
     */
    const infoRC_1: number[] = [460, 2350, 460, 2350, 460, 2350, 460, 2350, 460, 2350];
    const infoRC_2: number[] = [460, 2350, 460, 2350, 460, 2350, 460, 2350, 460, 2350];

    const _initOneTime: boolean[] = [false, false, false, false, false];

    /* --------------------------------------------------------------------- */

    /**
     * Driver initialization
     * 
     * First time initialization, remember to turn off all Motor and Servo
     */
    export function initDriver(addr: number) {
        let buf = pins.createBuffer(6);

        /* Pause Motor B */
        buf[0] = addr;
        buf[1] = 1; // modeId = DC_ID (1)
        buf[2] = 1; // index  = MotorB (1)
        buf[3] = 0; // pwm    = PWM (0)
        buf[4] = 0; // dir    = CCW (0)
        buf[5] = (buf[0] + 2) % 256;
        pins.i2cWriteBuffer(addr, buf);
        control.waitMicros(15);

        /* Pause Motor A */
        buf[0] = addr;
        buf[1] = 1; // modeId = DC_ID (1)
        buf[2] = 0; // index  = MotorA (0)
        buf[3] = 0; // pwm    = PWM (0)
        buf[4] = 0; // dir    = CCW (0)
        buf[5] = (buf[0] + 1) % 256;
        pins.i2cWriteBuffer(addr, buf);
        control.waitMicros(15);

        /* Release Servo 2 */
        buf[0] = addr;
        buf[1] = 0;     // modeId = RC_ID (0)
        buf[2] = 2;     // index  = Servo2 (2)
        buf[3] = 11;    // pulse_H (0x0B)
        buf[4] = 184;   // pulse_L (0xB8)
        buf[5] = (buf[0] + 197) % 256;
        pins.i2cWriteBuffer(addr, buf);
        control.waitMicros(15);

        /* Release Servo 1 */
        buf[0] = addr;
        buf[1] = 0;     // modeId = RC_ID (0)
        buf[2] = 1;     // index  = Servo1 (1)
        buf[3] = 11;    // pulse_H (0x0B)
        buf[4] = 184;   // pulse_L (0xB8)
        buf[5] = (buf[0] + 196) % 256;
        control.waitMicros(15);
    }

    /* --------------------------------------------------------------------- */

    /**
     * Control DC motor with parameters: speed & direction of rotation
     * @param addr is I2C address for Driver
     * @param motor choose motor A or motor B
     * @param rotate set the motor rotation direction
     * @param speed set the rotational speed of the motor
     */
    //% block="Driver address $addr \\| Control motor $motor rotation $rotate with speed $speed in (1\\% - 100\\%)"
    //% addr.defl=Address.add64 addr.fieldEditor="gridpicker" addr.fieldOptions.columns=2
    //% motor.defl=Motor.MotorA
    //% rotate.defl=Rotate.Clockwise
    //% speed.defl=50 speed.min=1 speed.max=100
    //% inlineInputMode=inline
    //% weight=5
    //% group="Control Motor DC"
    export function controlMotor(addr: Address, motor: Motor, rotate: Rotate, speed: number) {
        /* Make sure to initialize each Driver once */
        if (!_initOneTime[addr - 64]) {
            initDriver(addr);
            _initOneTime[addr - 64] = true;
        }

        /**
         * Data frame for Motor DC:
         * 
         * [0]  addressId    (1 Byte)   = Address (64, 65, 66, 67, 68)
         * [1]  modeId       (1 Byte)   = DC_ID (1)
         * [2]  index        (1 Byte)   = MotorA (0) & MotorB (1)
         * [3]  pwm          (1 Byte)   = PWM [0 - 255]
         * [4]  dir          (1 Byte)   = CW (1) & CCW (0)
         * [5]  checkSum     (1 Byte)
         */
        let buf = pins.createBuffer(6);

        /* ----------------------------------------------------------------- */

        /**
         * Convert (%) scale to (PWM) scale
         * 
         * (%) - 0   (PWM) - 0
         * ------- = ---------
         * 100 - 0    255 - 0
         */
        buf[0] = addr;      // addressId = Address (64, 65, 66, 67, 68)
        switch (motor) {
            case Motor.MotorA: {
                buf[1] = 1; // modeId = DC_ID (1)
                buf[2] = 0; // index  = MotorA (0)
                break;
            }
            case Motor.MotorB: {
                buf[1] = 1; // modeId = DC_ID (1)
                buf[2] = 1; // index  = MotorB (1)
                break;
            }
        }
        buf[3] = Math.round(2.55 * speed);                              // pwm = PWM [0 - 255]
        buf[4] = rotate;                                                // dir = CW (1) & CCW (0)
        buf[5] = (buf[0] + buf[1] + buf[2] + buf[3] + buf[4]) % 256;    //! checkSum

        /* ----------------------------------------------------------------- */

        //! Use for Debug
        // serial.writeNumber(buf[0]); serial.writeLine(" [0]");
        // serial.writeNumber(buf[1]); serial.writeLine(" [1]");
        // serial.writeNumber(buf[2]); serial.writeLine(" [2]");
        // serial.writeNumber(buf[3]); serial.writeLine(" [3]");
        // serial.writeNumber(buf[4]); serial.writeLine(" [4]");
        // serial.writeNumber(buf[5]); serial.writeLine(" [5]");

        pins.i2cWriteBuffer(addr, buf);
        control.waitMicros(15);
    }

    /**
     * Make the engine stop immediately, or release
     * @param addr is I2C address for Driver
     * @param pause make Brake or Stop motor
     * @param motor choose motor A or motor B
     */
    //% block="Driver address $addr \\| $pause motor $motor"
    //% addr.defl=Address.add64 addr.fieldEditor="gridpicker" addr.fieldOptions.columns=2
    //% pause.defl=Pause.Brake
    //% motor.defl=Motor.MotorA
    //% inlineInputMode=inline
    //% weight=4
    //% group="Control Motor DC"
    export function pauseMotor(addr: Address, pause: Pause, motor: Motor) {
        switch (pause) {
            case Pause.Brake: {
                controlMotor(addr, motor, Rotate.Clockwise, 0);
                break;
            }
            case Pause.Stop: {
                controlMotor(addr, motor, Rotate.CounterClockwise, 0);
                break;
            }
        }
    }

    /**
     * Control RC motor (Servo) with parameter: angle
     * @param addr is I2C address for Driver
     * @param servo choose Servo 1 or Servo 2
     * @param angle set the rotation angle of Servo
     */
    //% block="Driver address $addr \\| Control servo $servo with angle $angle in (0° - 180°)"
    //% addr.defl=Address.add64 addr.fieldEditor="gridpicker" addr.fieldOptions.columns=2
    //% servo.defl=Servo.Servo1
    //% angle.shadow="protractorPicker"
    //% inlineInputMode=inline
    //% weight=3
    //% group="Control Servo"
    export function controlServo(addr: Address, servo: Servo, angle: number) {
        /* Make sure to initialize each Driver once */
        if (!_initOneTime[addr - 64]) {
            initDriver(addr);
            _initOneTime[addr - 64] = true;
        }

        /**
         * Data frame for Motor RC (Servo):
         * 
         * [0]  addressId    (1 Byte)   = Address (64, 65, 66, 67, 68)
         * [1]  modeId       (1 Byte)   = RC_ID (0)
         * [2]  index        (1 Byte)   = Servo1 (1) & Servo2 (2)
         * [3]  pulse_H      (1 Byte)   = | PPM [minPulse - maxPulse]
         * [4]  pulse_L      (1 Byte)     |
         * [5]  checkSum     (1 Byte)
         */
        let pulse: number;
        let buf = pins.createBuffer(6);

        /* ----------------------------------------------------------------- */

        /**
         * Convert (Angle) scale to (Pulse) scale
         * 
         * (Angle) - 0    (Pulse) - minPulse
         * ----------- = -------------------
         *   180 - 0     maxPulse - minPulse
         */
        buf[0] = addr;      // addressId = Address (64, 65, 66, 67, 68)
        switch (servo) {
            case Servo.Servo1: {
                pulse = (angle * (infoRC_1[(addr - 64) * 2 + 1] - infoRC_1[(addr - 64) * 2]) / 180) + infoRC_1[0];
                buf[1] = 0; // modeId = RC_ID (0)
                buf[2] = 1; // index  = Servo1 (1)
                break;
            }
            case Servo.Servo2: {
                pulse = (angle * (infoRC_2[(addr - 64) * 2 + 1] - infoRC_2[(addr - 64) * 2]) / 180) + infoRC_2[0];
                buf[1] = 0; // modeId = RC_ID (0)
                buf[2] = 2; // index  = Servo2 (2)
                break;
            }
        }
        buf[3] = Math.idiv(pulse, 256);                                 // pulse_H
        buf[4] = pulse % 256;                                           // pulse_L
        buf[5] = (buf[0] + buf[1] + buf[2] + buf[3] + buf[4]) % 256;    //! checkSum

        /* ----------------------------------------------------------------- */

        //! Use for Debug
        // serial.writeNumber(buf[0]); serial.writeLine(" [0]");
        // serial.writeNumber(buf[1]); serial.writeLine(" [1]");
        // serial.writeNumber(buf[2]); serial.writeLine(" [2]");
        // serial.writeNumber(buf[3]); serial.writeLine(" [3]");
        // serial.writeNumber(buf[4]); serial.writeLine(" [4]");
        // serial.writeNumber(buf[5]); serial.writeLine(" [5]");

        pins.i2cWriteBuffer(addr, buf);
        control.waitMicros(15);
    }

    /**
     * Set the PPW pulse range for Servo
     * @param addr is I2C address for Driver
     * @param servo choose Servo 1 or Servo 2
     * @param minPulse set the PPM pulse to the minimum allowed width
     * @param maxPulse set the PPM pulse to the maximum allowed width
     */
    //% block="Driver address $addr \\| Set range the pulse for servo $servo from $minPulse (Min) to $maxPulse (Max)"
    //% addr.defl=Address.add64 addr.fieldEditor="gridpicker" addr.fieldOptions.columns=2
    //% servo.defl=Servo.Servo1
    //% minPulse.defl=460 minPulse.min=400 minPulse.max=1000
    //% maxPulse.defl=2350 maxPulse.min=2000 maxPulse.max=2600
    //% inlineInputMode=inline
    //% weight=2
    //% group="Control Servo"
    export function setRangeServo(addr: Address, servo: Servo, minPulse: number, maxPulse: number) {
        switch (servo) {
            case Servo.Servo1: {
                infoRC_1[(addr - 64) * 2] = minPulse;
                infoRC_1[(addr - 64) * 2 + 1] = maxPulse;
                break;
            }
            case Servo.Servo2: {
                infoRC_2[(addr - 64) * 2] = minPulse;
                infoRC_2[(addr - 64) * 2 + 1] = maxPulse;
                break;
            }
        }
    }

    /**
     * Release Servo
     * @param addr is I2C address for Driver
     */
    //% block="Driver address $addr \\| Release servo $servo"
    //% addr.defl=Address.add64 addr.fieldEditor="gridpicker" addr.fieldOptions.columns=2
    //% servo.defl=Servo.Servo1
    //% inlineInputMode=inline
    //% weight=1
    //% group="Control Servo"
    export function releaseServo(addr: Address, servo: Servo) {
        controlServo(addr, servo, 3000);
    }

    /* --------------------------------------------------------------------- */

    /**
     * Control car go forward
     * @param speed set the rotational speed of the motor
     * @param addr is I2C address for Driver
     */
    //% advanced=true
    //% block="🚗 go forward [🡹] at speed $speed \\| Driver address $addr"
    //% speed.defl=90 speed.min=1 speed.max=100
    //% addr.defl=Address.add64 addr.fieldEditor="gridpicker" addr.fieldOptions.columns=2
    //% inlineInputMode=inline
    //% weight=10
    //% group="GO"
    export function goForward(speed: number, addr: Address) {
        controlMotor(addr, Motor.MotorB, Rotate.Clockwise, speed);
        controlMotor(addr, Motor.MotorA, Rotate.Clockwise, speed);
    }

    /**
     * Control car go backward
     * @param speed set the rotational speed of the motor
     * @param addr is I2C address for Driver
     */
    //% advanced=true
    //% block="🚗 go backward [🡻] at speed $speed \\| Driver address $addr"
    //% speed.defl=90 speed.min=1 speed.max=100
    //% addr.defl=Address.add64 addr.fieldEditor="gridpicker" addr.fieldOptions.columns=2
    //% inlineInputMode=inline
    //% weight=9
    //% group="GO"
    export function goBackward(speed: number, addr: Address) {
        controlMotor(addr, Motor.MotorB, Rotate.CounterClockwise, speed);
        controlMotor(addr, Motor.MotorA, Rotate.CounterClockwise, speed);
    }

    /**
     * Control car cross 'left' forward
     * @param speed set the rotational speed of the motor
     * @param addr is I2C address for Driver
     */
    //% advanced=true
    //% block="🚗 cross 'left' forward [🡼] at speed $speed \\| Driver address $addr"
    //% speed.defl=90 speed.min=1 speed.max=100
    //% addr.defl=Address.add64 addr.fieldEditor="gridpicker" addr.fieldOptions.columns=2
    //% inlineInputMode=inline
    //% weight=8
    //% group="CROSS"
    export function crossLeftForward(speed: number, addr: Address) {
        controlMotor(addr, Motor.MotorB, Rotate.Clockwise, 0);
        controlMotor(addr, Motor.MotorA, Rotate.Clockwise, speed);
    }

    /**
     * Control car cross 'right' forward
     * @param speed set the rotational speed of the motor
     * @param addr is I2C address for Driver
     */
    //% advanced=true
    //% block="🚗 cross 'right' forward [🡽] at speed $speed \\| Driver address $addr"
    //% speed.defl=90 speed.min=1 speed.max=100
    //% addr.defl=Address.add64 addr.fieldEditor="gridpicker" addr.fieldOptions.columns=2
    //% inlineInputMode=inline
    //% weight=7
    //% group="CROSS"
    export function crossRightForward(speed: number, addr: Address) {
        controlMotor(addr, Motor.MotorB, Rotate.Clockwise, speed);
        controlMotor(addr, Motor.MotorA, Rotate.Clockwise, 0);
    }

    /**
     * Control car cross 'left' backward
     * @param speed set the rotational speed of the motor
     * @param addr is I2C address for Driver
     */
    //% advanced=true
    //% block="🚗 cross 'left' backward [🡿] at speed $speed \\| Driver address $addr"
    //% speed.defl=90 speed.min=1 speed.max=100
    //% addr.defl=Address.add64 addr.fieldEditor="gridpicker" addr.fieldOptions.columns=2
    //% inlineInputMode=inline
    //% weight=6
    //% group="CROSS"
    export function crossLeftBackward(speed: number, addr: Address) {
        controlMotor(addr, Motor.MotorB, Rotate.Clockwise, 0);
        controlMotor(addr, Motor.MotorA, Rotate.CounterClockwise, speed);
    }

    /**
     * Control car cross 'right' backward
     * @param speed set the rotational speed of the motor
     * @param addr is I2C address for Driver
     */
    //% advanced=true
    //% block="🚗 cross 'right' backward [🡾] at speed $speed \\| Driver address $addr"
    //% speed.defl=90 speed.min=1 speed.max=100
    //% addr.defl=Address.add64 addr.fieldEditor="gridpicker" addr.fieldOptions.columns=2
    //% inlineInputMode=inline
    //% weight=5
    //% group="CROSS"
    export function crossRightBackward(speed: number, addr: Address) {
        controlMotor(addr, Motor.MotorB, Rotate.CounterClockwise, speed);
        controlMotor(addr, Motor.MotorA, Rotate.Clockwise, 0);
    }

    /**
     * Control car turn 'left'
     * @param speed set the rotational speed of the motor
     * @param addr is I2C address for Driver
     */
    //% advanced=true
    //% block="🚗 turn 'left' [🡸] at speed $speed \\| Driver address $addr"
    //% speed.defl=90 speed.min=1 speed.max=100
    //% addr.defl=Address.add64 addr.fieldEditor="gridpicker" addr.fieldOptions.columns=2
    //% inlineInputMode=inline
    //% weight=4
    //% group="TURN"
    export function turnLeft(speed: number, addr: Address) {
        /* ↺↺↺ : <== */
        controlMotor(addr, Motor.MotorB, Rotate.CounterClockwise, speed);
        controlMotor(addr, Motor.MotorA, Rotate.Clockwise, speed);
    }

    /**
     * Control car turn 'right'
     * @param speed set the rotational speed of the motor
     * @param addr is I2C address for Driver
     */
    //% advanced=true
    //% block="🚗 turn 'right' [🡺] at speed $speed \\| Driver address $addr"
    //% speed.defl=90 speed.min=1 speed.max=100
    //% addr.defl=Address.add64 addr.fieldEditor="gridpicker" addr.fieldOptions.columns=2
    //% inlineInputMode=inline
    //% weight=3
    //% group="TURN"
    export function turnRight(speed: number, addr: Address) {
        /* ↻↻↻ : ==> */
        controlMotor(addr, Motor.MotorB, Rotate.Clockwise, speed);
        controlMotor(addr, Motor.MotorA, Rotate.CounterClockwise, speed);
    }

    /**
     * Control car stop now
     * @param addr is I2C address for Driver
     */
    //% advanced=true
    //% block="🚗 stop now (Brakes) 🛑 \\| Driver address $addr"
    //% addr.defl=Address.add64 addr.fieldEditor="gridpicker" addr.fieldOptions.columns=2
    //% inlineInputMode=inline
    //% weight=2
    //% group="STOP"
    export function brake(addr: Address) {
        pauseMotor(addr, Pause.Brake, Motor.MotorB);
        pauseMotor(addr, Pause.Brake, Motor.MotorA);
    }

    /**
     * Stop driving the car
     * @param addr is I2C address for Driver
     */
    //% advanced=true
    //% block="🚗 release (Slip) ⚠️ \\| Driver address $addr"
    //% addr.defl=Address.add64 addr.fieldEditor="gridpicker" addr.fieldOptions.columns=2
    //% inlineInputMode=inline
    //% weight=1
    //% group="STOP"
    export function stop(addr: Address) {
        pauseMotor(addr, Pause.Stop, Motor.MotorB);
        pauseMotor(addr, Pause.Stop, Motor.MotorA);
    }
}

/* ------------------------------------------------------------------------- */
/*                             MODULE MP3 PLAYER                             */
/* ------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------- */

//! pxt-mp3Player

//% color="#FEBC68" weight=3 icon="\uf001" block="MKE-M11"
//% groups="['Setting', 'Control', 'Get Info', 'Advanced Control']"
namespace mp3Player {
    export enum EQ {
        //% block="Normal"
        Normal = 0x00,  // DFPLAYER_EQ_NORMAL
        //% block="Pop"
        Pop = 0x01,     // DFPLAYER_EQ_POP
        //% block="Rock"
        Rock = 0x02,    // DFPLAYER_EQ_ROCK
        //% block="Jazz"
        Jazz = 0x03,    // DFPLAYER_EQ_JAZZ
        //% block="Classic"
        Classic = 0x04, // DFPLAYER_EQ_CLASSIC
        //% block="Bass"
        Bass = 0x05     // DFPLAYER_EQ_BASS
    }

    export enum PlayWhat {
        //% block="Next"
        Next = 0x01,
        //% block="Previous"
        Previous = 0x02
    }

    /* --------------------------------------------------------------------- */

    /**
     * Serial Mode: Instruction Description
     * 
     * Format: $S - VER - Len - CMD - Feedback - para1 - para2 - checksum - $O
     * |
     * [0] $S       : start bit                         0x7E
     * [1] VER      : version information               0xFF
     * [2] Len      : the number of bytes after "Len"   0x06
     * [3] CMD      : indicate the specific operations  -> 1 Byte
     * [4] Feedback : feedback (1) / no feedback (0)    -> 1 Byte
     * [5] para1    : query high data byte              -> 1 Byte
     * [6] para2    : query low data byte               -> 1 Byte
     * [7] checksum : accumulation and verification     -> 2 Byte
     * [8]          = 0 - ( [1] + [2] + [3] + [4] + [5] + [6] )
     * [9] $O       : end bit                           0xEF
     */
    const dataArr: number[] = [0x7E, 0xFF, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xEF];

    const DFPlayerCardInserted: number = 2;
    const DFPlayerCardRemoved: number = 3;
    const DFPlayerCardOnline: number = 4;
    const DFPlayerPlayFinished: number = 5;
    const DFPlayerError: number = 6;
    const DFPlayerUSBInserted: number = 7;
    const DFPlayerUSBRemoved: number = 8;
    const DFPlayerUSBOnline: number = 9;
    const DFPlayerCardUSBOnline: number = 10;
    const DFPlayerFeedBack: number = 11;

    const Stack_Version: number = 1;
    const Stack_Length: number = 2;
    const Stack_End: number = 9;

    const TimeOut: number = 0;
    const WrongStack: number = 1;

    let _isAvailable = false;
    let _handleType: number;
    let _handleParameter: number;
    let _receivedIndex = 0;
    let _isSending = false;
    let _handleCommand: number;
    let _timeOutTimer: number;

    const _received: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    /* --------------------------------------------------------------------- */

    /* Connect to MP3 Player */
    export function connect() {
        /**
         * Configure the serial port to use the pins instead of USB
         * 
         * function serial.redirect(tx: SerialPin, rx: SerialPin, rate: BaudRate): void;
         * tx   : the transmit pin to send serial data on
         * rx   : the receive pin to receive serial data on
         * rate : the baud rate for transmitting and receiving data
         * 
         * MP3Player <----> MicroBit
         * RX               P14 (TX)
         * TX               P15 (RX)
         */
        serial.redirect(SerialPin.P14, SerialPin.P15, BaudRate.BaudRate9600);
    }

    /* Calculate Checksum */
    export function checkSum() {
        /**
         * 2 Byte (16 bit)
         * 
         * 0 - 1 = -1 : 0xFFFF : 65,535 = 65,536 - 1
         * 0 - 2 = -2 : 0xFFFE : 65,534 = 65,536 - 2
         * ...
         */
        let total = 65536 - (dataArr[1] + dataArr[2] + dataArr[3] + dataArr[4] + dataArr[5] + dataArr[6]);

        dataArr[7] = total >> 8;    // para_H
        dataArr[8] = total & 0xFF;  // para_L
    }

    /* Send commands to MP3 Player */
    export function sendData() {
        let buf = pins.createBuffer(10);

        for (let index = 0; index < 10; index++) {
            buf.setNumber(NumberFormat.UInt8LE, index, dataArr[index])
        }
        serial.writeBuffer(buf);

        _timeOutTimer = input.runningTime();
        basic.pause(100);//!
    }

    /* Start the process of sending commands via Serial */
    export function innerCall(CMD: number, para1: number, para2: number) {
        /* Make sure MP3Player is connected */
        connect();

        dataArr[3] = CMD;
        dataArr[5] = para1;
        dataArr[6] = para2;

        checkSum();
        sendData();
    }

    /* --------------------------------------------------------------------- */

    export function handleMessage(type: number, parameter: number): boolean {
        _receivedIndex = 0;
        _handleType = type;
        _handleParameter = parameter;
        _isAvailable = true;

        return _isAvailable;
    }

    export function handleError(type: number, parameter: number): boolean {
        handleMessage(type, parameter);
        _isSending = false;

        return false;
    }

    export function validateStack(): boolean {
        let calCheckSum = 65536 - (_received[1] + _received[2] + _received[3] + _received[4] + _received[5] + _received[6]);
        let revCheckSum = _received[7] * 256 + _received[8];

        return calCheckSum == revCheckSum;
    }

    export function parseStack() {
        let handleCommand = _received[3];
        /**
         * Handle the 0x41 ack feedback as a spcecial case
         * In case the pollusion of _handleCommand, _handleParameter, and _handleType
         */
        if (handleCommand == 0x41) {
            _isSending = false;
            return;
        }

        _handleCommand = handleCommand;
        _handleParameter = _received[5] * 256 + _received[6];

        switch (_handleCommand) {
            case 0x3D:
                handleMessage(DFPlayerPlayFinished, _handleParameter);
                break;
            case 0x3F:
                if (_handleParameter & 0x01) {
                    handleMessage(DFPlayerUSBOnline, _handleParameter);
                }
                else if (_handleParameter & 0x02) {
                    handleMessage(DFPlayerCardOnline, _handleParameter);
                }
                else if (_handleParameter & 0x03) {
                    handleMessage(DFPlayerCardUSBOnline, _handleParameter);
                }
                break;
            case 0x3A:
                if (_handleParameter & 0x01) {
                    handleMessage(DFPlayerUSBInserted, _handleParameter);
                }
                else if (_handleParameter & 0x02) {
                    handleMessage(DFPlayerCardInserted, _handleParameter);
                }
                break;
            case 0x3B:
                if (_handleParameter & 0x01) {
                    handleMessage(DFPlayerUSBRemoved, _handleParameter);
                }
                else if (_handleParameter & 0x02) {
                    handleMessage(DFPlayerCardRemoved, _handleParameter);
                }
                break;
            case 0x40:
                handleMessage(DFPlayerError, _handleParameter);
                break;
            case 0x3C:
            case 0x3E:
            case 0x42:
            case 0x43:
            case 0x44:
            case 0x45:
            case 0x46:
            case 0x47:
            case 0x48:
            case 0x49:
            case 0x4B:
            case 0x4C:
            case 0x4D:
            case 0x4E:
            case 0x4F:
                handleMessage(DFPlayerFeedBack, _handleParameter);
                break;
            default:
                handleError(WrongStack, 0);
                break;
        }
    }

    export function available(): boolean {
        let data = serial.readBuffer(0);
        while (_receivedIndex < data.length) {
            if (_receivedIndex == 0) {
                _received[0] = data.getNumber(NumberFormat.UInt8LE, 0);
                if (_received[0] == 0x7E) {
                    _receivedIndex++;
                }
            } else {
                _received[_receivedIndex] = data.getNumber(NumberFormat.UInt8LE, _receivedIndex);

                switch (_receivedIndex) {
                    case Stack_Version:
                        if (_received[_receivedIndex] != 0xFF) {
                            return handleError(WrongStack, 0);
                        }
                        break;
                    case Stack_Length:
                        if (_received[_receivedIndex] != 0x06) {
                            return handleError(WrongStack, 0);
                        }
                        break;
                    case Stack_End:
                        if (_received[_receivedIndex] != 0xEF) {
                            return handleError(WrongStack, 0);
                        } else {
                            if (validateStack()) {
                                _receivedIndex = 0;
                                parseStack();
                                return _isAvailable;
                            } else {
                                return handleError(WrongStack, 0);
                            }
                        }
                    default:
                        break;
                }

                _receivedIndex++;
            }
        }

        /* Over timeout 500ms */
        if (_isSending && (input.runningTime() - _timeOutTimer >= 500)) {
            return handleError(TimeOut, 0);
        }

        return _isAvailable;
    }

    export function waitAvailable(): boolean {
        let wait = input.runningTime();
        while (!available()) {
            /* Over timeout 500ms */
            if (input.runningTime() - wait > 500) {
                return false;
            }
        }
        return true;
    }

    export function readType(): number {
        _isAvailable = false;
        return _handleType;
    }

    export function read(): number {
        _isAvailable = false;
        return _handleParameter;
    }

    /* --------------------------------------------------------------------- */

    export function readEQ(): number {
        /* Query the current EQ */
        innerCall(0x44, 0x00, 0x00);

        if (waitAvailable()) {
            if (readType() == DFPlayerFeedBack)
                return read();
            else
                return -1;
        }
        else {
            return -1;
        }
    }

    export function readFileCounts(): number {
        /* Query the total number of U-disk files */
        innerCall(0x48, 0x00, 0x00);

        if (waitAvailable()) {
            if (readType() == DFPlayerFeedBack)
                return read();
            else
                return -1;
        }
        else {
            return -1;
        }
    }

    export function readVolume(): number {
        /* Query the current volume */
        innerCall(0x43, 0x00, 0x00);

        if (waitAvailable()) {
            return read();
        }
        else {
            return -1;
        }
    }

    export function getInfoMP3(): string {
        let info = "";
        let typeEQ = "";

        switch (readEQ()) {
            case 0: typeEQ = "Normal"; break;
            case 1: typeEQ = "Pop"; break;
            case 2: typeEQ = "Rock"; break;
            case 3: typeEQ = "Jazz"; break;
            case 4: typeEQ = "Classic"; break;
            case 5: typeEQ = "Bass"; break;
        }

        info = convertToText(readFileCounts()) + " files in SD Card.\n"
            + "Volume " + convertToText(readVolume()) + ".\n"
            + "EQ " + typeEQ + ".";

        /* Direct the serial input and output to use the USB connection */
        serial.redirectToUSB();
        return info;
    }

    /* --------------------------------------------------------------------- */

    /* Stop playing music after a period of time */
    export function playInPeriod(second: number) {
        let wait = input.runningTime() + 1000 * second;
        while (input.runningTime() <= wait) { }

        /* Pause */
        innerCall(0x0E, 0x00, 0x00);
    }

    /* --------------------------------------------------------------------- */

    export function waitFinishMusic() {
        let wrongStack = false;
        let timeOut = false;

        while (true) {
            basic.pause(500);//! Interval is set at 400ms
            if (available()) {
                if (readType() == DFPlayerPlayFinished) {
                    break;
                } else {
                    if (readType() == WrongStack) { wrongStack = true; }
                    else if (readType() == TimeOut) { timeOut = true; }
                    //
                    if (wrongStack && timeOut) { break; }
                }
            }
        }
    }

    /* --------------------------------------------------------------------- */

    /**
     * Perform volume up
     */
    //% block="MP3 Player \\| Up volume"
    //% inlineInputMode=inline
    //% weight=13
    //% group="Setting"
    export function upVolume() {
        // DFRobotDFPlayerMini::volumeUp()
        innerCall(0x04, 0x00, 0x00);

        serial.redirectToUSB();
    }

    /**
     * Perform volume down
     */
    //% block="MP3 Player \\| Down volume"
    //% inlineInputMode=inline
    //% weight=12
    //% group="Setting"
    export function downVolume() {
        // DFRobotDFPlayerMini::volumeDown()
        innerCall(0x05, 0x00, 0x00);

        serial.redirectToUSB();
    }

    /**
     * Perform volume adjustment
     * @param volume select sound level from 0 to 30
     */
    //% block="MP3 Player \\| Set volume level $volume"
    //% volume.defl=20 volume.min=0 volume.max=30
    //% inlineInputMode=inline
    //% weight=11
    //% group="Setting"
    export function setVolume(volume: number) {
        // DFRobotDFPlayerMini::volume(uint8_t volume)
        innerCall(0x06, 0x00, volume);

        serial.redirectToUSB();
    }

    /**
     * Adjust the EQ of the sound
     * @param chooseEQ select EQ format
     */
    //% block="MP3 Player \\| Set EQ $chooseEQ"
    //% chooseEQ.defl=EQ.Normal
    //% inlineInputMode=inline
    //% weight=10
    //% group="Setting"
    export function setEQ(chooseEQ: EQ) {
        // DFRobotDFPlayerMini::EQ(uint8_t eq)
        innerCall(0x07, 0x00, chooseEQ);

        serial.redirectToUSB();
    }

    /**
     * Play the music file of your choice
     * @param file select the music file you want to play
     */
    //% block="MP3 Player \\| Play file number $file"
    //% file.defl=1 file.min=0 file.max=65535
    //% inlineInputMode=inline
    //% weight=9
    //% group="Control"
    export function playFile(file: number) {
        /**
         * Play specific mp3 in SD:/MP3/0000.mp3; File Name (0 ~ 65,535)
         * DFRobotDFPlayerMini::playMp3Folder(int fileNumber)
         */
        innerCall(0x12, file >> 8, file & 0xFF);

        serial.redirectToUSB();
    }

    /**
     * Play the next or previous music file compared to the current music file
     * @param playWhat choose to play next or previous music file
     */
    //% block="MP3 Player \\| Play $playWhat"
    //% playWhat.defl=PlayWhat.Next
    //% inlineInputMode=inline
    //% weight=8
    //% group="Control"
    export function play(playWhat: PlayWhat) {
        /**
         * DFRobotDFPlayerMini::next()
         * DFRobotDFPlayerMini::previous()
         */
        innerCall(playWhat, 0x00, 0x00);

        serial.redirectToUSB();
    }

    /**
     * Pause the currently playing file
     */
    //% block="MP3 Player \\| Pause"
    //% inlineInputMode=inline
    //% weight=7
    //% group="Control"
    export function pause() {
        // DFRobotDFPlayerMini::pause()
        innerCall(0x0E, 0x00, 0x00);

        serial.redirectToUSB();
    }

    /**
     * Play continues with paused file music
     */
    //% block="MP3 Player \\| Start (Play continues)"
    //% inlineInputMode=inline
    //% weight=6
    //% group="Control"
    export function start() {
        // DFRobotDFPlayerMini::start()
        innerCall(0x0D, 0x00, 0x00);

        serial.redirectToUSB();
    }

    /**
     * Get the parameters being set in MP3 Player
     */
    //% block="MP3 Player \\| Read information setting current"
    //% inlineInputMode=inline
    //% weight=5
    //% group="Get Info"
    export function getInfo(): string {
        return getInfoMP3();
    }

    /**
     * Play a music file of your choice for a certain amount of time
     * @param file select the music file you want to play
     * @param second set how long you want to play that file
     */
    //% block="MP3 Player \\| Play file number $file in $second seconds"
    //% file.defl=1 file.min=0 file.max=65535
    //% second.defl=2.5
    //% inlineInputMode=inline
    //% weight=4
    //% group="Advanced Control"
    export function playFileInTime(file: number, second: number) {
        playFile(file);
        playInPeriod(second);

        serial.redirectToUSB();
    }

    /**
     * Play the music file of your choice until the song is over
     * @param file select the music file you want to play
     */
    //% block="MP3 Player \\| Play file number $file until done"
    //% file.defl=1 file.min=0 file.max=65535
    //% inlineInputMode=inline
    //% weight=3
    //% group="Advanced Control"
    export function playFileUntilDone(file: number) {
        /**
         * Play specific mp3 in SD:/MP3/0000.mp3; File Name (0 ~ 65,535)
         * DFRobotDFPlayerMini::playMp3Folder(int fileNumber)
         */
        innerCall(0x12, file >> 8, file & 0xFF);
        waitFinishMusic();

        serial.redirectToUSB();
    }

    /**
     * Play next or previous music file for a certain amount of time
     * @param playWhat choose to play next or previous music file
     * @param second set how long you want to play that file
     */
    //% block="MP3 Player \\| Play $playWhat in $second seconds"
    //% playWhat.defl=PlayWhat.Next
    //% second.defl=2.5
    //% inlineInputMode=inline
    //% weight=2
    //% group="Advanced Control"
    export function playInTime(playWhat: PlayWhat, second: number) {
        play(playWhat);
        playInPeriod(second);

        serial.redirectToUSB();
    }

    /**
     * Play next or previous music file until the song is over
     * @param playWhat choose to play next or previous music file
     */
    //% block="MP3 Player \\| Play $playWhat until done"
    //% playWhat.defl=PlayWhat.Next
    //% inlineInputMode=inline
    //% weight=1
    //% group="Advanced Control"
    export function playUntilDone(playWhat: PlayWhat) {
        /**
         * DFRobotDFPlayerMini::next()
         * DFRobotDFPlayerMini::previous()
         */
        innerCall(playWhat, 0x00, 0x00);
        waitFinishMusic();

        serial.redirectToUSB();
    }
}

/* ------------------------------------------------------------------------- */
/*                                 BACKGROUND                                */
/*        https://github.com/1010Technologies/pxt-makerbit-background        */
/* ------------------------------------------------------------------------- */

namespace background {
    export enum Thread {
        Priority = 0,
        UserCallback = 1
    }

    export enum Mode {
        Repeat,
        Once
    }

    /* --------------------------------------------------------------------- */

    class Executor {
        _newJobs: Job[] = undefined;
        _jobsToRemove: number[] = undefined;
        _pause: number = 100;
        _type: Thread;

        constructor(type: Thread) {
            this._type = type;
            this._newJobs = [];
            this._jobsToRemove = [];
            control.runInParallel(() => this.loop());
        }

        push(task: () => void, delay: number, mode: Mode): number {
            if (delay > 0 && delay < this._pause && mode === Mode.Repeat) {
                this._pause = Math.floor(delay);
            }
            const job = new Job(task, delay, mode);
            this._newJobs.push(job);
            return job.id;
        }

        cancel(jobId: number) {
            this._jobsToRemove.push(jobId);
        }

        loop(): void {
            const _jobs: Job[] = [];

            let previous = control.millis();

            while (true) {
                const now = control.millis();
                const delta = now - previous;
                previous = now;

                // Add new jobs
                this._newJobs.forEach(function (job: Job, index: number) {
                    _jobs.push(job);
                });
                this._newJobs = [];

                // Cancel jobs
                this._jobsToRemove.forEach(function (jobId: number, index: number) {
                    for (let i = _jobs.length - 1; i >= 0; i--) {
                        const job = _jobs[i];
                        if (job.id == jobId) {
                            _jobs.removeAt(i);
                            break;
                        }
                    }
                });
                this._jobsToRemove = [];

                // Execute all jobs
                if (this._type === Thread.Priority) {
                    // Newest first
                    for (let i = _jobs.length - 1; i >= 0; i--) {
                        if (_jobs[i].run(delta)) {
                            this._jobsToRemove.push(_jobs[i].id);
                        }
                    }
                } else {
                    // Execute in order of schedule
                    for (let i = 0; i < _jobs.length; i++) {
                        if (_jobs[i].run(delta)) {
                            this._jobsToRemove.push(_jobs[i].id);
                        }
                    }
                }

                basic.pause(this._pause);
            }
        }
    }

    class Job {
        id: number;
        func: () => void;
        delay: number;
        remaining: number;
        mode: Mode;

        constructor(func: () => void, delay: number, mode: Mode) {
            this.id = randint(0, 2147483647);
            this.func = func;
            this.delay = delay;
            this.remaining = delay;
            this.mode = mode;
        }

        run(delta: number): boolean {
            if (delta <= 0) {
                return false;
            }

            this.remaining -= delta;
            if (this.remaining > 0) {
                return false;
            }

            switch (this.mode) {
                case Mode.Once:
                    this.func();
                    basic.pause(0);
                    return true;
                case Mode.Repeat:
                    this.func();
                    this.remaining = this.delay;
                    basic.pause(0);
                    return false;
            }
        }
    }

    /* --------------------------------------------------------------------- */

    const queues: Executor[] = [];

    /* --------------------------------------------------------------------- */

    export function schedule(func: () => void, type: Thread, mode: Mode, delay: number): number {
        if (!func || delay < 0) {
            return 0;
        }

        if (!queues[type]) {
            queues[type] = new Executor(type);
        }

        return queues[type].push(func, delay, mode);
    }

    export function remove(type: Thread, jobId: number): void {
        if (queues[type]) {
            queues[type].cancel(jobId);
        }
    }
}

/* ------------------------------------------------------------------------- */
/*                               MODULE IR1838                               */
/* ------------------------------------------------------------------------- */

//! pxt-ir1838

//% color="#FEBC68" weight=2 icon="\uf00d" block="MKE-M14"
//% groups="['Get Info Infrared (Data)', 'Get Info Infrared (Text)']"
namespace ir1838 {
    export enum ValueIR {
        //% block="command"
        Command,
        //% block="address"
        Address,
        //% block="raw data"
        RawData
    }

    /* https://hshop.vn/products/module-dieu-khien-hong-ngoai-tu-xa */
    export enum IrButton {
        Any = -1,
        CH_Minus = 0x45,
        CH = 0x46,
        CH_Plus = 0x47,
        Prev = 0x44,
        Next = 0x40,
        Play_Pause = 0x43,
        Vol_Minus = 0x07,
        Vol_Plus = 0x15,
        EQ = 0x09,
        Number_0 = 0x16,
        Number_100Plus = 0x19,
        Number_200Plus = 0x0D,
        Number_1 = 0x0C,
        Number_2 = 0x18,
        Number_3 = 0x5E,
        Number_4 = 0x08,
        Number_5 = 0x1C,
        Number_6 = 0x5A,
        Number_7 = 0x42,
        Number_8 = 0x52,
        Number_9 = 0x4A
    }

    /* --------------------------------------------------------------------- */

    const IR_REPEAT = 256;          // Status code indicating "Repeat Code" received
    const IR_INCOMPLETE = 257;      // Status code indicating receipt of 1 signal pulse [ mark + space ]
    const IR_DATAGRAM = 258;        // Status code indicating full 32 bits of data received

    const REPEAT_TIMEOUT_MS = 120;  // Repeat cycle is >= 110ms

    class IrButtonHandler {
        irButton: IrButton;
        onEvent: () => void;

        constructor(irButton: IrButton, onEvent: () => void) {
            this.irButton = irButton;
            this.onEvent = onEvent;
        }
    }

    interface IrState {
        hasNewDatagram: boolean;    // Is there any new data sent?

        bitsReceived: number;       // Number of bits received

        hiword: number;             // Temporarily save the raw "Command" value
        loword: number;             // Temporarily save the raw "Address" value

        commandSectionBits: number; // Save the complete "Command" data
        addressSectionBits: number; // Save the complete "Address" data

        activeCommand: number;      // !
        repeatTimeout: number;      // Store time for "Repeat timer refresh"

        onIrButtonPressed: IrButtonHandler[];   // !
        onIrButtonReleased: IrButtonHandler[];  // !

        onIrDatagram: () => void;   // !
    }

    let irState: IrState;

    let _initOneTime = false;

    /* --------------------------------------------------------------------- */

    export function initIrState() {
        if (irState) {
            return;
        }

        irState = {
            hasNewDatagram: false,

            bitsReceived: 0,

            hiword: 0,
            loword: 0,

            commandSectionBits: 0,
            addressSectionBits: 0,

            activeCommand: -1,
            repeatTimeout: 0,

            onIrButtonPressed: [],
            onIrButtonReleased: [],

            onIrDatagram: undefined
        };
    }

    export function appendBitToDatagram(bit: boolean): number {
        /**
         * Because these signals are Logic 0 and 1
         * So every time received, need +1 to count the number of received data bits
         */
        irState.bitsReceived += 1;

        /**
         * Vd: Number_9 = 0x4A
         * 
         * |       hiword        |         loword      |
         * |         |           |           |         |         
         * | ~Command|   Command |  ~Address | Address |
         * |         |           |           |         |
         * |  0xB5   |    0x4A   |    0xFF   |    0x00 |
         * |         |           |           |         |
         * 1011.0101 + 0100.1010 | 1111.1111 + 0000.0000
         * |                                           |
         * MSB                                         LSB
         */
        if (irState.bitsReceived <= 16) {
            if (bit) {
                irState.loword = (irState.loword >>> 1) | 0x8000;
            } else {
                irState.loword = irState.loword >>> 1;
            }
        } else if (irState.bitsReceived <= 32) {
            if (bit) {
                irState.hiword = (irState.hiword >>> 1) | 0x8000;
            } else {
                irState.hiword = irState.hiword >>> 1;
            }
        }

        /**
         * When full 32 bits are received
         * Move clipboard data to main memory
         * Before transferring there is an extra "filtering" to ensure that the full 32 bits are received
         */
        if (irState.bitsReceived === 32) {
            irState.commandSectionBits = irState.hiword & 0xFFFF;
            irState.addressSectionBits = irState.loword & 0xFFFF;

            //! Use for Debug
            // serial.writeNumber(irState.commandSectionBits); serial.writeLine(" [C]");
            // serial.writeNumber(irState.addressSectionBits); serial.writeLine(" [A]");

            return IR_DATAGRAM;
        } else {
            return IR_INCOMPLETE;
        }
    }

    export function decode(markAndSpace: number): number {
        if (markAndSpace < 1600) {
            /**
             * Logic 0: [mark]  = 562.5us
             *          [space] = 562.5us
             * markAndSpace     ~ 1.125ms
             */
            return appendBitToDatagram(false);
        } else if (markAndSpace < 2700) {
            /**
             * Logic 1: [mark]  = 562.5us
             *          [space] = 1,687.5us
             * markAndSpace     ~ 2.25ms
             */
            return appendBitToDatagram(true);
        }

        /**
         * Because these signals are not Logic 0 and 1
         * So we "Reset" the number of received data bits to 0
         */
        irState.bitsReceived = 0;

        if (markAndSpace < 12500) {
            /**
             * ! Repeat detected
             * 
             * Repeat Code: [mark]  = 9,000us
             *              [space] = 2,250us
             * markAndSpace         ~ 11.25ms
             */
            return IR_REPEAT;
        } else if (markAndSpace < 14500) {
            /**
             * ! Start detected
             * 
             * Start of Frame:  [mark]  = 9,000us
             *                  [space] = 4,500us
             * markAndSpace             ~ 13.5ms
             */
            return IR_INCOMPLETE;
        } else {
            return IR_INCOMPLETE;
        }
    }

    export function handleIrEvent(irEvent: number) {
        /* Refresh repeat timer */
        if (irEvent === IR_DATAGRAM || irEvent === IR_REPEAT) {
            irState.repeatTimeout = input.runningTime() + REPEAT_TIMEOUT_MS;
        }

        /* Processing when full 32 bits are received */
        if (irEvent === IR_DATAGRAM) {
            irState.hasNewDatagram = true;

            if (irState.onIrDatagram) {
                background.schedule(irState.onIrDatagram, background.Thread.UserCallback, background.Mode.Once, 0);
            }

            const newCommand = irState.commandSectionBits & 0xFF;

            /* Process a new command */
            if (newCommand !== irState.activeCommand) {

                if (irState.activeCommand >= 0) {
                    const releasedHandler = irState.onIrButtonReleased.find(h => h.irButton === irState.activeCommand || IrButton.Any === h.irButton);
                    if (releasedHandler) {
                        background.schedule(releasedHandler.onEvent, background.Thread.UserCallback, background.Mode.Once, 0);
                    }
                }

                const pressedHandler = irState.onIrButtonPressed.find(h => h.irButton === newCommand || IrButton.Any === h.irButton);
                if (pressedHandler) {
                    background.schedule(pressedHandler.onEvent, background.Thread.UserCallback, background.Mode.Once, 0);
                }

                irState.activeCommand = newCommand;
            }
        }
    }

    export function enableIrMarkSpaceDetection(pin: DigitalPin) {
        pins.setPull(pin, PinPullMode.PullNone);

        let mark = 0;
        let space = 0;

        /**
         * Indicates the duration of time when this pin is LOW
         * 
         * That is, the time (us) is calculated from the time this pin starts LOW [Edge down]
         * Until this pin level HIGH [Edge up]
         * 
         * Then store in [mark] (burst)
         */
        pins.onPulsed(pin, PulseValue.Low, () => {
            mark = pins.pulseDuration();
        });

        /**
         * Indicates the duration of time when this pin is HIGH
         * 
         * That is, the time (us) is calculated from the time this pin starts HIGH [Edge up]
         * Until this pin level LOW [Edge down]
         * 
         * Then store in [space]
         */
        pins.onPulsed(pin, PulseValue.High, () => {
            space = pins.pulseDuration();

            const status = decode(mark + space);

            /**
             * Process when one of the following status signals is received:
             * [IR_REPEAT] or [IR_DATAGRAM]
             */
            if (status !== IR_INCOMPLETE) {
                handleIrEvent(status);
            }
        });
    }

    export function notifyIrEvents() {
        /* Skip to save CPU cylces */
        if (irState.activeCommand === -1) {
        } else {
            const now = input.runningTime();

            /* Repeat timed out */
            if (now > irState.repeatTimeout) {

                const handler = irState.onIrButtonReleased.find(h => h.irButton === irState.activeCommand || IrButton.Any === h.irButton);
                if (handler) {
                    background.schedule(handler.onEvent, background.Thread.UserCallback, background.Mode.Once, 0);
                }

                irState.bitsReceived = 0;
                irState.activeCommand = -1;
            }
        }
    }

    export function connectIrReceiver(pin: DigitalPin) {
        initIrState();
        enableIrMarkSpaceDetection(pin);
        background.schedule(notifyIrEvents, background.Thread.Priority, background.Mode.Repeat, REPEAT_TIMEOUT_MS);
    }

    export function ir_rec_to16BitHex(value: number): string {
        let hex = "";

        for (let pos = 0; pos < 4; pos++) {
            let remainder = value % 16;
            if (remainder < 10) {
                hex = remainder.toString() + hex;
            } else {
                hex = String.fromCharCode(55 + remainder) + hex;
            }
            value = Math.idiv(value, 16);
        }

        return hex;
    }

    /* --------------------------------------------------------------------- */

    /**
     * Read received IR signal value, NEC standard
     * @param chooseValue select the type of value IR you want to read
     * @param sig signal pin
     */
    //% block="IR1838 \\| Read $chooseValue NEC from pin $sig"
    //% chooseValue.defl=ValueIR.Command
    //% sig.defl=DigitalPin.P8 sig.fieldEditor="gridpicker" sig.fieldOptions.columns=4
    //% inlineInputMode=inline
    //% weight=2
    //% group="Get Info Infrared (Data)"
    export function readValueIR(chooseValue: ValueIR, sig: DigitalPin): number {
        /* Make sure to initialize IR at first use */
        if (!_initOneTime) {
            connectIrReceiver(sig);
            _initOneTime = true;
        }

        /* Yield to support background processing when called in tight loops */
        basic.pause(0);
        initIrState();
        if (irState.hasNewDatagram) {
            irState.hasNewDatagram = false;
            /* ------------------------------------------------------------- */
            basic.pause(0);//! Yield
            if (!irState) {
                return IrButton.Any;
            }
            switch (chooseValue) {
                case ValueIR.Command: return irState.commandSectionBits & 0xFF;
                case ValueIR.Address: return irState.addressSectionBits & 0xFF;
                case ValueIR.RawData: return irState.commandSectionBits * 65536 + irState.addressSectionBits;
                default: return 0;
            }
        } else {
            return 0;
        }
    }

    /**
     * Print all information about the received IR signal, NEC standard
     * @param sig signal pin
     */
    //% block="IR1838 \\| Print IR NEC result short from pin $sig"
    //% sig.defl=DigitalPin.P8 sig.fieldEditor="gridpicker" sig.fieldOptions.columns=4
    //% inlineInputMode=inline
    //% weight=1
    //% group="Get Info Infrared (Text)"
    export function printValueIR(sig: DigitalPin): string {
        /* Make sure to initialize IR at first use */
        if (!_initOneTime) {
            connectIrReceiver(sig);
            _initOneTime = true;
        }

        /* Yield to support background processing when called in tight loops */
        basic.pause(0);
        initIrState();
        if (irState.hasNewDatagram) {
            irState.hasNewDatagram = false;
            /* ------------------------------------------------------------- */
            basic.pause(0);//! Yield
            initIrState();
            let A = ir_rec_to16BitHex(irState.addressSectionBits);
            let C = ir_rec_to16BitHex(irState.commandSectionBits);
            return (
                "A: 0x" + A.substr(2, 2) + "\n" +
                "C: 0x" + C.substr(2, 2) + "\n" +
                "D: 0x" + C + A
            );
        } else {
            return "NONE";
        }
    }
}

/* ------------------------------------------------------------------------- */
/*                              MODULE BLUETOOTH                             */
/* ------------------------------------------------------------------------- */

// //! pxt-bleMicrobit

// //% color="#FEBC68" weight=1 icon="\uf294" block="MKE-M15"
// //% groups="['Gamepad (Number Keys)', 'Gamepad (Alphabet Keys)']"
// namespace bleMicrobit {
//     export enum AlphabetButton {
//         //% block="A"
//         btnA,
//         //% block="B"
//         btnB,
//         //% block="C"
//         btnC,
//         //% block="D"
//         btnD
//     }

//     export enum NumberButton {
//         //% block="1"
//         btn1,
//         //% block="2"
//         btn2,
//         //% block="3"
//         btn3,
//         //% block="4"
//         btn4
//     }

//     /* --------------------------------------------------------------------- */

//     /* --------------------------------------------------------------------- */

//     /**
//      * Check if the button is being pressed
//      * @param btn select push button
//      */
//     //% block="Is $btn pressed on GamePad?"
//     //% btn.defl=AlphabetButton.btnA
//     //% inlineInputMode=inline
//     //% weight=2
//     //% group="Gamepad (Alphabet Keys)"
//     export function alphabetGamepad(btn: AlphabetButton): boolean {
//         let e: MesDpadButtonInfo;
//         switch (btn) {
//             case AlphabetButton.btnA: e = MesDpadButtonInfo.ADown; break;
//             case AlphabetButton.btnB: e = MesDpadButtonInfo.BDown; break;
//             case AlphabetButton.btnC: e = MesDpadButtonInfo.CDown; break;
//             case AlphabetButton.btnD: e = MesDpadButtonInfo.DDown; break;
//         }

//         let status = false;
//         devices.onGamepadButton(e, function () {
//             //! Use for Debug
//             serial.writeLine(e.toString());

//             status = true;
//         });
//         return status;
//     }

//     /**
//      * Check if the button is being pressed
//      * @param btn select push button
//      */
//     //% block="Is $btn pressed on GamePad?"
//     //% btn.defl=NumberButton.btn1
//     //% inlineInputMode=inline
//     //% weight=1
//     //% group="Gamepad (Number Keys)"
//     export function numberGamepad(btn: NumberButton): boolean {
//         let e: MesDpadButtonInfo;
//         switch (btn) {
//             case NumberButton.btn1: e = MesDpadButtonInfo._1Down; break;
//             case NumberButton.btn2: e = MesDpadButtonInfo._2Down; break;
//             case NumberButton.btn3: e = MesDpadButtonInfo._3Down; break;
//             case NumberButton.btn4: e = MesDpadButtonInfo._4Down; break;
//         }

//         let status = false;
//         devices.onGamepadButton(e, function () {
//             //! Use for Debug
//             serial.writeLine(e.toString());

//             status = true;
//         });
//         return status;
//     }
// }
