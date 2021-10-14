//
//  utils.hpp
//  sim
//
//  Created by Ken on 5/3/19.
//  Copyright © 2019 Ken. All rights reserved.
//

#ifndef utils_h
#define utils_h
// Convert string to hex roar address string
std::string fmtAddress(uint16_t d);

// Format d as a bit
std::string fmtB(bool d);

// Format d as a hex nybble
std::string fmtN(uint8_t d);

// Format d as 1 hex byte
std::string fmt1(uint8_t d);

// Format d as 2 hex bytes
std::string fmt2(uint16_t d);

// Format d as 2 hex bytes upper case
std::string fmt2uc(uint16_t d);

// Format d as 4 hex bytes
std::string fmt4(uint32_t d);

#endif /* utils_h */
