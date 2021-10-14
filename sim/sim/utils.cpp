#include <sstream>
#include <iostream>
#include <iomanip>

#include "utils.hpp"
#include "entry.hpp"

// Convert string to hex roar address string
std::string fmtAddress(uint16_t d) {
    std::ostringstream sstream;
    sstream << std::hex << std::setw(4) << std::setfill('0') << d;
    return sstream.str();
}

// Format d as a bit
std::string fmtB(bool d) {
    std::ostringstream sstream;
    sstream << d;
    return sstream.str();
}

// Format d as a hex nybble
std::string fmtN(uint8_t d) {
    std::ostringstream sstream;
sstream << std::hex << d;
  return sstream.str();
}

// Format d as 1 hex byte
std::string fmt1(uint8_t d) {
    std::ostringstream sstream;
sstream << std::hex << std::setw(2) << std::setfill('0') << d;
  return sstream.str();
}

// Format d as 2 hex bytes
std::string fmt2(uint16_t d) {
    std::ostringstream sstream;
sstream << std::hex << std::setw(4) << std::setfill('0') << d;
  return sstream.str();
}

// Format d as 2 hex bytes upper case
std::string fmt2uc(uint16_t d) {
    std::ostringstream sstream;
sstream << std::hex << std::uppercase << std::setw(4) << std::setfill('0') << d;
  return sstream.str();
}

// Format d as 4 hex bytes
std::string fmt4(uint32_t d) {
    std::ostringstream sstream;
sstream << std::hex << std::setw(8) << std::setfill('0') << uint32_t(d);
  return sstream.str();
}

