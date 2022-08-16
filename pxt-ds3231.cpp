#include "pxt.h"

namespace ds3231
{
  //%
  string get_DATE()
  {
    return __DATE__;
  }

  //%
  string get_TIME()
  {
    return __TIME__;
  }
}