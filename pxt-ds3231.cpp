#include "pxt.h"

namespace ds3231
{
  //%
  String get_DATE()
  {
    return PSTR(__DATE__);
  }

  //%
  String get_TIME()
  {
    return PSTR(__TIME__);
  }
}