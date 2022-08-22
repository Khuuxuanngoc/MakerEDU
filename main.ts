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
            case 3: cursor = 0xD4;          // 0xC0 + 0x14
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
    //% block="DS3231 \\| Check Alarm"
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
//% groups="['Control Motor DC', 'Control Servo']"
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

    /* --------------------------------------------------------------------- */

    //! nhớ thêm lệnh để yêu cầu motor dừng hẳn khi mới khởi tạo lần đầu

    /* --------------------------------------------------------------------- */

    /**
     * !
     * @param addr is I2C address for Driver
     * @param motor x
     * @param rotate x
     * @param speed x
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

        control.waitMicros(15);
        pins.i2cWriteBuffer(addr, buf);
    }

    /**
     * !
     * @param addr is I2C address for Driver
     * @param pause x
     * @param motor x
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
     * !
     * @param addr is I2C address for Driver
     * @param servo x
     * @param angle x
     */
    //% block="Driver address $addr \\| Control servo $servo with angle $angle in (0° - 180°)"
    //% addr.defl=Address.add64 addr.fieldEditor="gridpicker" addr.fieldOptions.columns=2
    //% servo.defl=Servo.Servo1
    //% angle.shadow="protractorPicker"
    //% inlineInputMode=inline
    //% weight=3
    //% group="Control Servo"
    export function controlServo(addr: Address, servo: Servo, angle: number) {
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

        control.waitMicros(15);
        pins.i2cWriteBuffer(addr, buf);
    }

    /**
     * !
     * @param addr is I2C address for Driver
     * @param servo x
     * @param minPulse x
     * @param maxPulse x
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
     * !
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
