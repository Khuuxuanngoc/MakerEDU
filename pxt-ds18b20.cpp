#include "pxt.h"

namespace ds18b20
{
  MicroBitPin *pin = &uBit.io.P8;

  /* ----------------------------------------------------------------------- */

  void sleep_us(int us)
  {
    int lasttime, nowtime;
    lasttime = system_timer_current_time_us();
    nowtime = system_timer_current_time_us();
    while ((nowtime - lasttime) < us)
    {
      nowtime = system_timer_current_time_us();
    }
  }

  /* ----------------------------------------------------------------------- */

  /* Write Time Slots
  **
  ** The bus master uses a Write 1 time slot to write a logic 1 to the DS18B20
  ** And a Write 0 time slot to write a logic 0 to the DS18B20
  **
  ** All write time slots must be a minimum of 60µs in duration
  ** With a minimum of a 1µs recovery time between individual write slots
  **
  ** To generate a Write 1 time slot, after pulling the 1-Wire bus low
  ** The bus master must release the 1-Wire bus within 15µs
  **
  ** To generate a Write 0 time slot, after pulling the 1-Wire bus low
  ** The bus master must continue to hold the bus low for the duration of the time slot (at least 60µs)
  */
  void ds18b20WiteByte(uint8_t data)
  {
    for (int i = 0; i < 8; i++)
    {
      if ((data >> i) & 0x01) // Write bit 1
      {
        pin->setDigitalValue(0);
        sleep_us(2);          // Master pull LOW
        pin->setDigitalValue(1);
        sleep_us(60);         // Master release
      }
      else                    // Write bit 0
      {
        pin->setDigitalValue(0);
        sleep_us(60);         // Master pull LOW
        pin->setDigitalValue(1);
        sleep_us(2);          // Master release
      }
    }
  }

  /* Read Time Slots
  **
  ** The DS18B20 can only transmit data to the master when the master issues read time slots
  ** Therefore, the master must generate read time slots
  **
  ** All read time slots must be a minimum of 60µs in duration
  ** With a minimum of a 1µs recovery time between slots
  **
  ** The master device pulling the 1-Wire bus low for a minimum of 1µs and then releasing the bus
  ** The DS18B20 will begin transmitting a 1 or 0 on bus
  **
  ** The master must release the bus and then sample the bus state within 15µs from the start of the slot
  ** The DS18B20 transmits a 1 by leaving the bus high and transmits a 0 by pulling the bus low
  */
  uint8_t ds18b20ReadBit()
  {
    uint8_t bit;

    pin->setDigitalValue(0);
    sleep_us(2);  // Master pull LOW
    pin->setDigitalValue(1);
    sleep_us(5);  // Master release

    if (pin->getDigitalValue())
      bit = 1;    // Read bit 1
    else
      bit = 0;    // Read bit 0
    sleep_us(60);

    return bit;
  }

  /* Read Scratchpad [BEh]
  **
  ** The data transfer starts with the least significant bit of byte 0
  ** And continues through the scratchpad until the 9th byte (byte 8 – CRC) is read
  **
  ** Byte 0 : TEMPERATURE LSB
  ** Byte 1 : TEMPERATURE MSB
  ** Byte 2 : TH REGISTER OR USER BYTE 1
  ** Byte 3 : TL REGISTER OR USER BYTE 2
  ** Byte 4 : CONFIGURATION REGISTER
  ** Byte 5 : RESERVED
  ** Byte 6 : RESERVED
  ** Byte 7 : RESERVED
  ** Byte 8 : CRC
  */
  uint8_t ds18b20ReadByte()
  {
    uint8_t bit;
    uint8_t data = 0;

    for (int i = 0; i < 8; i++)
    {
      bit = ds18b20ReadBit();
      sleep_us(2);

      data = data | (bit << i);
    }
    sleep_us(2);

    return data;
  }

  /* ----------------------------------------------------------------------- */

  /* Reset Pulses
  **
  ** All communication with the DS18B20 begins with an initialization sequence
  ** That consists of a reset pulse from the master followed by a presence pulse from the DS18B20
  **
  ** During the initialization sequence
  ** The bus master transmits (TX) the reset pulse by pulling the 1-Wire bus low for a minimum of 480µs
  */
  void ds18b20Rest()
  {
    pin->setDigitalValue(0);
    sleep_us(750);  // MASTER Tx RESET PULSE
    pin->setDigitalValue(1);
    sleep_us(15);   // DS18B20 WAITS
  }

  /* Presence Pulses
  **
  ** The bus master then releases the bus and goes into receive mode (RX)
  ** When the DS18B20 detects this rising edge, it waits 15µs to 60µs
  ** And then transmits a presence pulse by pulling the 1-Wire bus low for 60µs to 240µs
  */
  bool ds18b20Check()
  {
    int state = 0;

    while (pin->getDigitalValue())  // DS18B20 WAITS (if still have)
    {
      state++;
      sleep_us(1);
      if (state >= 200)
        break;
    }
    if (state >= 200)
      return false;
    else
      state = 0;

    while (!pin->getDigitalValue()) // DS18B20 TX PRESENCE
    {
      state++;
      sleep_us(1);
      if (state >= 240)
        break;
    }
    if (state >= 240)
      return false;

    return true;                    // Initialization procedure successful!
  }

  /* Transaction Sequence
  **
  ** The transaction sequence for accessing the DS18B20 is as follows:
  ** Step 1. Initialization
  ** Step 2. ROM Command
  ** Step 3. DS18B20 Function Command 
  */
  void ds18b20Start()
  {
    ds18b20Rest();          // Reset Pulses
    ds18b20Check();         // Presence Pulses

    sleep_us(2);

    ds18b20WiteByte(0xCC);  // ROM Commands       : Skip Rom [CCh]
    ds18b20WiteByte(0x44);  // Function Commands  : Convert T [44h]
  }

  /* ----------------------------------------------------------------------- */
  /*                                   MAIN                                  */
  /* ----------------------------------------------------------------------- */

  /* 
  ** The 1-Wire bus must be switched to the strong pullup
  ** Within 10µs (max) after a Convert T [44h] or Copy Scratchpad [48h] command is issued
  **
  ** The bus must be held high by the pullup for the duration of the conversion (tCONV) or data transfer (tWR = 10ms)
  ** No other activity can take place on the 1-Wire bus while the pullup is enabled
  */
  float ds18b20GetTemperture()
  {
    uint8_t TH, TL;
    uint16_t temp;

    ds18b20Start();

    sleep_us(100);          // ! Temperature Conversion Time (tCONV)

    /************************/
    ds18b20Rest();          // Reset Pulses
    ds18b20Check();         // Presence Pulses
    sleep_us(2);
    ds18b20WiteByte(0xCC);  // ROM Commands       : Skip Rom [CCh]
    ds18b20WiteByte(0xBE);  // Function Commands  : Read Scratchpad [BEh]

    TL = ds18b20ReadByte();
    sleep_us(100);          // !
    TH = ds18b20ReadByte();
    /************************/

    temp = TH;
    temp << 8;
    temp = temp + TL;

    if ((temp & 0xF800) == 0xF800)  // Sign = 1 (Negative numbers)
    {
      temp = (~temp) + 1;
      return temp * -0.0625;
    }
    else                            // Sign = 0 (Positive numbers)
      return temp * 0.0625;
  }

  /* ----------------------------------------------------------------------- */
  /*                                  BLOCK                                  */
  /* ----------------------------------------------------------------------- */

  //%
  float temperature(int p)
  {
    switch (p)
    {
      case 0:   pin = &uBit.io.P0; break;
      case 1:   pin = &uBit.io.P1; break;
      case 2:   pin = &uBit.io.P2; break;
      case 3:   pin = &uBit.io.P3; break;
      case 4:   pin = &uBit.io.P4; break;
      case 5:   pin = &uBit.io.P5; break;
      case 6:   pin = &uBit.io.P6; break;
      case 7:   pin = &uBit.io.P7; break;
      case 8:   pin = &uBit.io.P8; break;
      case 9:   pin = &uBit.io.P9; break;
      case 10:  pin = &uBit.io.P10; break;
      case 11:  pin = &uBit.io.P11; break;
      case 12:  pin = &uBit.io.P12; break;
      case 13:  pin = &uBit.io.P13; break;
      case 14:  pin = &uBit.io.P14; break;
      case 15:  pin = &uBit.io.P15; break;
      case 16:  pin = &uBit.io.P16; break;
      default:  pin = &uBit.io.P8;
    }
    return ds18b20GetTemperture();
  }
}
