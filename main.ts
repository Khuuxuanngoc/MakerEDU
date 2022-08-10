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
     * @param trig trigger pin
     * @param echo echo pin
     * @param unit desired conversion unit
     * @param maxCmDistance maximum distance in centimeters (default is 300)
     */
    //% block="UltraSonic \\| Read distance $unit from EchoPin $echo and TriggerPin $trig"
    //% unit.defl=PingUnit.Centimeters
    //% echo.defl=DigitalPin.P14 echo.fieldEditor="gridpicker" echo.fieldOptions.columns=4
    //% trig.defl=DigitalPin.P15 trig.fieldEditor="gridpicker" trig.fieldOptions.columns=4
    //% inlineInputMode=inline
    export function readDistance(trig: DigitalPin, echo: DigitalPin, unit: PingUnit, maxCmDistance = 300): number {
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
        return 0;
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

//% color="#FEBC68" weight=7 icon="\uf0f3" block="MKE-M03"
namespace buzzer {
    //% block
    export function playNote() {
        //
    }
}

/* ------------------------------------------------------------------------- */
/*                                 MODULE LCD                                */
/* ------------------------------------------------------------------------- */

//! pxt-lcd

//% color="#FEBC68" weight=6 icon="\uf26c" block="MKE-M07,08"
namespace lcd {
    //% block
    export function displayText() {
        //
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
